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
    
    // No mock data - will use real MongoDB data
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
        clean_event_text: "SpiceJet baggage handling at Bangalore airport was terrible today. Lost my luggage and no communication from staff about when it will arrive.",
        engagement_metrics: {
          comments: 127,
          likes: 856,
          shares: 45
        },
        event_content: "SpiceJet baggage handling at Bangalore airport was terrible today. Lost my luggage and no communication from staff about when it will arrive. Very disappointed with the service.",
        event_id: "rd_9876543210",
        event_title: "Poor baggage handling experience",
        event_url: "https://reddit.com/r/bangalore/comments/9876543210",
        parent_event_id: null,
        platform: "Reddit",
        timestamp_utc: "2024-01-15T13:45:00Z",
        sentiment_analysis: {
          overall_sentiment: -0.7,
          sentiment_score: 0.85,
          categories: {
            ease_of_booking: null,
            check_in: null,
            luggage_handling: -0.9,
            security: null,
            lounge: null,
            amenities: null,
            communication: -0.8
          }
        },
        location_focus: "bangalore_airport",
        airline_mentioned: "spicejet",
        created_at: new Date()
      },
      {
        id: "3",
        author_id: "instagram_789",
        author_name: "aviation_enthusiast",
        clean_event_text: "Air India's new check-in process at Bangalore airport is much faster now. The digital kiosks work perfectly and staff is helpful.",
        engagement_metrics: {
          comments: 89,
          likes: 2100,
          shares: 156
        },
        event_content: "Air India's new check-in process at #BangaloreAirport is much faster now! 🎉 The digital kiosks work perfectly and staff is helpful. Great improvement! #AirIndia #Aviation",
        event_id: "ig_5555444433",
        event_title: "Improved check-in experience",
        event_url: "https://instagram.com/p/5555444433",
        parent_event_id: null,
        platform: "Instagram",
        timestamp_utc: "2024-01-15T12:15:00Z",
        sentiment_analysis: {
          overall_sentiment: 0.6,
          sentiment_score: 0.8,
          categories: {
            ease_of_booking: null,
            check_in: 0.8,
            luggage_handling: null,
            security: null,
            lounge: null,
            amenities: 0.6,
            communication: 0.7
          }
        },
        location_focus: "bangalore_airport",
        airline_mentioned: "air_india",
        created_at: new Date()
      }
    ];

    mockEvents.forEach(event => {
      this.socialEvents.set(event.id, event);
    });

    // Initialize Pramit as admin
    const pramit: User = {
      id: "user_pramit",
      name: "Pramit",
      email: "pramit@blranalytics.com",
      role: "admin",
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(pramit.id, pramit);
  }

  async getSocialEvents(options: { limit?: number } = {}): Promise<SocialEvent[]> {
    const events = Array.from(this.socialEvents.values()).sort((a, b) => 
      new Date(b.timestamp_utc || b.created_at || 0).getTime() - new Date(a.timestamp_utc || a.created_at || 0).getTime()
    );
    if (options.limit) {
      return events.slice(0, options.limit);
    }
    return events;
  }

  async createSocialEvent(insertEvent: InsertSocialEvent): Promise<SocialEvent> {
    const id = randomUUID();
    const event: SocialEvent = { 
      author_id: insertEvent.author_id || null,
      author_name: insertEvent.author_name || null,
      clean_event_text: insertEvent.clean_event_text || null,
      engagement_metrics: insertEvent.engagement_metrics || null,
      event_content: insertEvent.event_content || null,
      event_id: insertEvent.event_id || null,
      event_title: insertEvent.event_title || null,
      event_url: insertEvent.event_url || null,
      parent_event_id: insertEvent.parent_event_id || null,
      platform: insertEvent.platform || null,
      timestamp_utc: insertEvent.timestamp_utc || null,
      sentiment_analysis: insertEvent.sentiment_analysis || null,
      location_focus: insertEvent.location_focus || null,
      airline_mentioned: insertEvent.airline_mentioned || null,
      id,
      created_at: new Date()
    };
    
    // Store in memory
    this.socialEvents.set(id, event);
    
    // Also store in MongoDB if connected, using platform as source name
    if (mongoService.isConnectionActive() && insertEvent.platform) {
      try {
        await mongoService.storeSocialEvent(insertEvent.platform, event);
      } catch (error) {
        console.error('Failed to store event in MongoDB:', error);
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

    return {
      totalViews: "2.4M",
      totalLikes: totalLikes.toLocaleString(),
      totalShares: totalShares.toLocaleString(),
      totalComments: totalComments.toLocaleString(),
      viewsGrowth: "+12.5%",
      likesGrowth: "+8.2%",
      sharesGrowth: "+15.7%",
      commentsGrowth: "+22.1%"
    };
  }

  async getChartData(): Promise<any> {
    return {
      engagement: [
        { month: "Jan", likes: 12000, shares: 3000, comments: 5000 },
        { month: "Feb", likes: 19000, shares: 5000, comments: 8000 },
        { month: "Mar", likes: 15000, shares: 4000, comments: 6000 },
        { month: "Apr", likes: 25000, shares: 7000, comments: 12000 },
        { month: "May", likes: 22000, shares: 6000, comments: 10000 },
        { month: "Jun", likes: 30000, shares: 8000, comments: 15000 }
      ],
      platforms: [
        { name: "Twitter", value: 35, color: "#3B82F6" },
        { name: "Reddit", value: 25, color: "#F97316" },
        { name: "Instagram", value: 20, color: "#EC4899" },
        { name: "Facebook", value: 10, color: "#1877F2" },
        { name: "YouTube", value: 10, color: "#FF0000" }
      ]
    };
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Prevent deleting Pramit (admin)
    if (id === "user_pramit") {
      throw new Error("Cannot delete admin user");
    }
    this.users.delete(id);
  }
}

export const storage = new MemStorage();
