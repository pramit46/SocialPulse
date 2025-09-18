import { InsertSocialEvent } from '@shared/schema';
import { llmService } from '../llm-service';
import { mongoService } from '../mongodb';
import { storage } from '../storage';
import AirportConfigHelper from '@shared/airport-config';

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

        // Store events directly in ChromaDB using simple text-based embeddings
        console.log(`🔮 Storing events in ChromaDB using text-based approach...`);
        
        // Use immediate storage approach without Ollama dependency
        setImmediate(async () => {
          let successCount = 0;
          for (const event of socialEvents) {
            try {
              const textContent = event.event_content || event.clean_event_text || '';
              if (textContent.trim()) {
                // Store directly in ChromaDB without waiting for Ollama embeddings
                await llmService.storeEventDirectly(
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
                successCount++;
              }
            } catch (storageError) {
              console.warn(`⚠️ ChromaDB storage failed for event ${event.id || 'unknown'}:`, storageError);
            }
          }
          console.log(`✅ Stored ${successCount}/${socialEvents.length} events in ChromaDB`);
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
    // Temporarily disable Ollama sentiment analysis due to persistent timeout issues
    // Use rule-based sentiment analysis instead for reliable data collection
    console.log(`🔍 [${this.constructor.name}] Using rule-based sentiment analysis for: "${text.substring(0, 100)}..."`);
    
    const sentiment = this.analyzeTextSentiment(text);
    console.log(`✅ Rule-based sentiment analysis completed`);
    return sentiment;
  }

  private analyzeTextSentiment(text: string): any {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'best', 'love', 'awesome', 'perfect', 'smooth', 'fast', 'clean', 'helpful', 'friendly', 'comfortable'];
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'horrible', 'poor', 'slow', 'dirty', 'rude', 'uncomfortable', 'delayed', 'cancelled', 'crowded', 'expensive'];
    
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    // Calculate sentiment score (-1 to 1)
    const totalWords = positiveCount + negativeCount;
    let sentimentScore = 0;
    
    if (totalWords > 0) {
      sentimentScore = (positiveCount - negativeCount) / totalWords;
    }
    
    // Determine overall sentiment
    let overallSentiment = 0; // neutral
    if (sentimentScore > 0.2) overallSentiment = 1;   // positive
    else if (sentimentScore < -0.2) overallSentiment = -1; // negative
    
    return {
      overall_sentiment: overallSentiment,
      sentiment_score: (sentimentScore + 1) / 2, // Convert to 0-1 scale
      categories: {
        ease_of_booking: lowerText.includes('booking') ? overallSentiment : null,
        check_in: lowerText.includes('check') ? overallSentiment : null,
        luggage_handling: lowerText.includes('luggage') || lowerText.includes('baggage') ? overallSentiment : null,
        security: lowerText.includes('security') ? overallSentiment : null,
        lounge: lowerText.includes('lounge') ? overallSentiment : null,
        amenities: lowerText.includes('amenities') || lowerText.includes('wifi') || lowerText.includes('food') ? overallSentiment : null,
        communication: lowerText.includes('staff') || lowerText.includes('service') ? overallSentiment : null
      }
    };
  }

  protected extractLocationFocus(text: string): string {
    const airportKeywords = AirportConfigHelper.getLocationKeywords();
    for (const keyword of airportKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        return AirportConfigHelper.getLocationSlug();
      }
    }
    return AirportConfigHelper.getLocationSlug(); // Default for this project
  }

  protected extractAirlineMention(text: string): string | null {
    const airlines = AirportConfigHelper.getConfig().airlines.primary;
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