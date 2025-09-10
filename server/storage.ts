import { 
  type SocialEvent, 
  type InsertSocialEvent,
  type ContactMessage,
  type InsertContactMessage,
  type Settings,
  type InsertSettings,
  type User,
  type InsertUser
} from "@shared/schema";
import { randomUUID } from "crypto";
import { mongoService } from "./mongodb";

// Extend the interface with new methods
export interface IStorage {
  // Social Events
  getSocialEvents(options?: { limit?: number }): Promise<SocialEvent[]>;
  createSocialEvent(event: InsertSocialEvent): Promise<SocialEvent>;
  
  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  
  // Settings
  getSettings(userId: string): Promise<Settings | undefined>;
  updateSettings(settings: InsertSettings): Promise<Settings>;
  
  // User Management
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Analytics
  getAnalyticsMetrics(): Promise<any>;
  getChartData(): Promise<any>;
}

export class MemStorage implements IStorage {
  private socialEvents: Map<string, SocialEvent>;
  private contactMessages: Map<string, ContactMessage>;
  private settings: Map<string, Settings>;
  private users: Map<string, User>;

  constructor() {
    this.socialEvents = new Map();
    this.contactMessages = new Map();
    this.settings = new Map();
    this.users = new Map();
    
    // Initialize only essential user data, no mock social events
    this.initializeUsers();
  }

  private initializeUsers() {
    // Initialize only essential user data
    const adminUser: User = {
      id: "user_pramit",
      name: "Pramit",
      email: "pramit@bng-analytics.com", 
      role: "super_admin",
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(adminUser.id, adminUser);
  }

  async getSocialEvents(options: { limit?: number } = {}): Promise<SocialEvent[]> {
    // First try to get from MongoDB, fallback to memory
    if (mongoService.isConnectionActive()) {
      try {
        const mongoEvents = await mongoService.getAllSocialEvents();
        const sortedEvents = mongoEvents.sort((a: any, b: any) => 
          new Date(b.timestamp_utc || b.created_at || 0).getTime() - 
          new Date(a.timestamp_utc || a.created_at || 0).getTime()
        );
        return options.limit ? sortedEvents.slice(0, options.limit) : sortedEvents;
      } catch (error) {
        console.error('Failed to get events from MongoDB, using memory:', error);
      }
    }
    
    // Fallback to memory (should be empty now - no mock data)
    const events = Array.from(this.socialEvents.values()).sort((a, b) => 
      new Date(b.timestamp_utc || b.created_at || 0).getTime() - new Date(a.timestamp_utc || a.created_at || 0).getTime()
    );
    return options.limit ? events.slice(0, options.limit) : events;
  }

  async createSocialEvent(insertEvent: InsertSocialEvent): Promise<SocialEvent> {
    const id = randomUUID();
    const event: SocialEvent = { 
      author_id: insertEvent.author_id || null,
      author_name: insertEvent.author_name || null,
      clean_event_text: insertEvent.clean_event_text || null,
      engagement_metrics: insertEvent.engagement_metrics || {
        comments: null,
        likes: null,
        shares: null
      },
      event_content: insertEvent.event_content || null,
      event_id: insertEvent.event_id || null,
      event_title: insertEvent.event_title || null,
      event_url: insertEvent.event_url || null,
      parent_event_id: insertEvent.parent_event_id || null,
      platform: insertEvent.platform || null,
      timestamp_utc: insertEvent.timestamp_utc || null,
      sentiment_analysis: insertEvent.sentiment_analysis || {
        overall_sentiment: 0,
        sentiment_score: 0,
        categories: {
          ease_of_booking: null,
          check_in: null,
          luggage_handling: null,
          security: null,
          lounge: null,
          amenities: null,
          communication: null
        }
      },
      location_focus: insertEvent.location_focus || null,
      airline_mentioned: insertEvent.airline_mentioned || null,
      id,
      created_at: new Date()
    } as SocialEvent;
    
    // Store in memory
    this.socialEvents.set(id, event);
    
    // Also store in MongoDB if connected, using platform as source name
    if (mongoService.isConnectionActive() && insertEvent.platform) {
      try {
        await mongoService.storeSocialEvent(insertEvent.platform, event);
        console.log(`✅ Stored event ${id} in MongoDB collection: ${insertEvent.platform}`);
      } catch (error) {
        console.error('❌ Failed to store event in MongoDB:', error);
        // Continue with in-memory storage even if MongoDB fails
      }
    }
    
    return event;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = { 
      ...insertMessage, 
      id,
      created_at: new Date()
    };
    this.contactMessages.set(id, message);
    return message;
  }

  async getSettings(userId: string): Promise<Settings | undefined> {
    return Array.from(this.settings.values()).find(
      (setting) => setting.user_id === userId
    );
  }

  async updateSettings(insertSettings: InsertSettings): Promise<Settings> {
    const existingSettings = Array.from(this.settings.values()).find(
      (setting) => setting.user_id === insertSettings.user_id
    );

    if (existingSettings) {
      const updatedSettings: Settings = { ...existingSettings, ...insertSettings };
      this.settings.set(existingSettings.id, updatedSettings);
      return updatedSettings;
    } else {
      const id = randomUUID();
      const newSettings: Settings = { 
        id,
        user_id: insertSettings.user_id,
        platform_connections: insertSettings.platform_connections || null,
        data_retention_days: insertSettings.data_retention_days || null,
        real_time_collection: insertSettings.real_time_collection || null,
        auto_cleanup: insertSettings.auto_cleanup || null,
        email_reports: insertSettings.email_reports || null,
        alert_notifications: insertSettings.alert_notifications || null
      };
      this.settings.set(id, newSettings);
      return newSettings;
    }
  }

  async getAnalyticsMetrics(): Promise<any> {
    const events = await this.getSocialEvents();
    
    const totalLikes = events.reduce((sum, event) => 
      sum + (event.engagement_metrics?.likes || 0), 0
    );
    const totalShares = events.reduce((sum, event) => 
      sum + (event.engagement_metrics?.shares || 0), 0
    );
    const totalComments = events.reduce((sum, event) => 
      sum + (event.engagement_metrics?.comments || 0), 0
    );
    
    const positiveEvents = events.filter(event => 
      (event.sentiment_analysis?.overall_sentiment || 0) > 0.1
    );
    const negativeEvents = events.filter(event => 
      (event.sentiment_analysis?.overall_sentiment || 0) < -0.1
    );
    
    return {
      totalEvents: events.length,
      totalLikes,
      totalShares,
      totalComments,
      totalViews: totalLikes + totalShares + totalComments, // Approximation
      likesGrowth: "+12%", // TODO: Calculate real growth
      sharesGrowth: "+8%", 
      commentsGrowth: "+15%",
      viewsGrowth: "+10%",
      avgSentiment: events.length > 0 ? 
        events.reduce((sum, event) => sum + (event.sentiment_analysis?.overall_sentiment || 0), 0) / events.length : 0,
      positiveCount: positiveEvents.length,
      negativeCount: negativeEvents.length,
      platformDistribution: this.calculatePlatformDistribution(events),
      airlineDistribution: this.calculateAirlineDistribution(events)
    };
  }

  async getChartData(): Promise<any> {
    const events = await this.getSocialEvents();
    
    // Generate time series data for engagement trends
    const timeSeriesData = this.generateTimeSeriesData(events);
    
    // Generate sentiment analysis chart data
    const sentimentData = this.generateSentimentChartData(events);
    
    return {
      engagementTrends: timeSeriesData,
      sentimentAnalysis: sentimentData,
      platformPerformance: this.calculatePlatformDistribution(events)
    };
  }

  private calculatePlatformDistribution(events: SocialEvent[]) {
    const distribution: { [platform: string]: number } = {};
    events.forEach(event => {
      const platform = event.platform || 'Unknown';
      distribution[platform] = (distribution[platform] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }

  private calculateAirlineDistribution(events: SocialEvent[]) {
    const distribution: { [airline: string]: number } = {};
    events.forEach(event => {
      if (event.airline_mentioned) {
        const airline = event.airline_mentioned;
        distribution[airline] = (distribution[airline] || 0) + 1;
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }

  private generateTimeSeriesData(events: SocialEvent[]) {
    const timeSeriesMap: { [date: string]: { likes: number; shares: number; comments: number } } = {};
    
    events.forEach(event => {
      const date = new Date(event.timestamp_utc || event.created_at || 0).toISOString().split('T')[0];
      if (!timeSeriesMap[date]) {
        timeSeriesMap[date] = { likes: 0, shares: 0, comments: 0 };
      }
      timeSeriesMap[date].likes += event.engagement_metrics?.likes || 0;
      timeSeriesMap[date].shares += event.engagement_metrics?.shares || 0;
      timeSeriesMap[date].comments += event.engagement_metrics?.comments || 0;
    });
    
    return Object.entries(timeSeriesMap)
      .map(([date, metrics]) => ({ date, ...metrics }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private generateSentimentChartData(events: SocialEvent[]) {
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    
    events.forEach(event => {
      const sentiment = event.sentiment_analysis?.overall_sentiment || 0;
      if (sentiment > 0.1) sentimentCounts.positive++;
      else if (sentiment < -0.1) sentimentCounts.negative++;
      else sentimentCounts.neutral++;
    });
    
    return [
      { name: 'Positive', value: sentimentCounts.positive, color: '#10b981' },
      { name: 'Neutral', value: sentimentCounts.neutral, color: '#f59e0b' },
      { name: 'Negative', value: sentimentCounts.negative, color: '#ef4444' }
    ];
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user",
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }
}

export const storage = new MemStorage();