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
      console.log(`🧠 [${this.constructor.name}] Analyzing sentiment using tinyllama:latest for: "${text.substring(0, 100)}..."`);
      return await llmService.analyzeSentiment(text);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
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