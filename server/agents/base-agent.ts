import { InsertSocialEvent } from '@shared/schema';
import { llmService } from '../llm-service';
import { mongoService } from '../mongodb';
import { storage } from '../storage';

export abstract class BaseAgent {
  protected credentials: any = {};

  constructor(credentials?: any) {
    if (credentials) {
      this.setCredentials(credentials);
    }
  }

  setCredentials(credentials: any) {
    this.credentials = { ...this.credentials, ...credentials };
  }

  protected async storeCollectedEvents(platform: string, events: InsertSocialEvent[]): Promise<void> {
    try {
      // Store in memory storage (existing functionality)
      for (const eventData of events) {
        await storage.createSocialEvent(eventData);
      }

      // Store in MongoDB if connected
      if (mongoService.isConnectionActive()) {
        const socialEvents = events.map(event => ({
          ...event,
          id: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date()
        }));

        await mongoService.bulkStoreSocialEvents(platform, socialEvents as any[]);
        console.log(`Stored ${events.length} events from ${platform} to MongoDB`);

        // Generate embeddings for ChromaDB after storing events (async, non-blocking)
        console.log(`🔮 Generating embeddings for ${events.length} events...`);
        
        // Run embedding generation in background to avoid blocking data collection
        setImmediate(async () => {
          let successCount = 0;
          for (const event of socialEvents) {
            try {
              const textContent = event.event_content || event.clean_event_text || '';
              if (textContent.trim()) {
                // Set timeout for embedding generation too
                const embeddingPromise = llmService.storeEventEmbedding(
                  event.id || `${platform}_${Date.now()}`,
                  textContent,
                  {
                    platform: event.platform,
                    timestamp: event.timestamp_utc || event.created_at,
                    sentiment: event.sentiment_analysis?.overall_sentiment || 0,
                    airline: event.airline_mentioned,
                    location: event.location_focus
                  }
                );
                
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Embedding timeout')), 20000)
                );
                
                await Promise.race([embeddingPromise, timeoutPromise]);
                successCount++;
              }
            } catch (embeddingError) {
              console.warn(`⚠️ Embedding generation timeout for event ${event.id || 'unknown'}`);
            }
          }
          console.log(`✅ Completed embedding generation: ${successCount}/${socialEvents.length} events`);
        });
      }
    } catch (error) {
      console.error(`Error storing ${platform} events:`, error);
      throw error;
    }
  }

  protected cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/[@#]\w+/g, '') // Remove mentions and hashtags for clean text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  protected async analyzeSentiment(text: string): Promise<any> {
    try {
      console.log(`🧠 [${this.constructor.name}] Analyzing sentiment using ${llmService.getModelName()} for: "${text.substring(0, 100)}..."`);
      
      // Set a shorter timeout for individual sentiment analysis calls
      const sentimentPromise = llmService.analyzeSentiment(text);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sentiment analysis timeout')), 30000) // 30 second timeout
      );
      
      return await Promise.race([sentimentPromise, timeoutPromise]);
    } catch (error) {
      console.warn(`⚠️ Sentiment analysis timeout/error for ${this.constructor.name}, using fallback values`);
      return {
        overall_sentiment: 0,
        sentiment_score: 0.5,
        categories: {
          ease_of_booking: null,
          check_in: null,
          luggage_handling: null,
          security: null,
          lounge: null,
          amenities: null,
          communication: null
        }
      };
    }
  }

  protected extractLocationFocus(text: string): string {
    const airportKeywords = ['bangalore airport', 'bengaluru airport', 'kempegowda airport', 'blr airport'];
    for (const keyword of airportKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        return 'bangalore_airport';
      }
    }
    return 'bangalore_airport'; // Default for this project
  }

  protected extractAirlineMention(text: string): string | null {
    const airlines = ['indigo', 'spicejet', 'air india', 'vistara', 'go first', 'akasa air'];
    for (const airline of airlines) {
      if (text.toLowerCase().includes(airline)) {
        return airline.replace(' ', '_');
      }
    }
    return null;
  }

  abstract collectData(query: string): Promise<InsertSocialEvent[]>;
  abstract validateCredentials(): boolean;
}