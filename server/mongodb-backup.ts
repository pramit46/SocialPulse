import { MongoClient, Db, Collection } from 'mongodb';
import type { SocialEvent } from '@shared/schema';
import AirportConfigHelper from '@shared/airport-config';

export class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private connectionString: string | null = null;
  private databaseName: string = 'bangalore_airport_analytics';

  constructor() {
    // Try to auto-connect using environment variables if available
    this.autoConnect();
  }

  private async autoConnect() {
    const mongoUri = process.env.MONGODB_CONNECTION_STRING;
    const baseDbName = process.env.MONGODB_DATABASE_NAME || 'airport_analytics';
    const city = AirportConfigHelper.getConfig().airport.city.toLowerCase();
    const dbName = `${city}_${baseDbName}`;
    
    if (mongoUri) {
      try {
        await this.connect(mongoUri, dbName);
        console.log('Auto-connected to MongoDB using environment variables');
      } catch (error) {
        console.log('Failed to auto-connect to MongoDB:', error);
      }
    }
  }

  async connect(connectionString: string, databaseName?: string) {
    if (!databaseName) {
      const baseDbName = process.env.MONGODB_DATABASE_NAME || 'airport_analytics';
      const city = AirportConfigHelper.getConfig().airport.city.toLowerCase();
      databaseName = `${city}_${baseDbName}`;
    }
    try {
      if (this.isConnected) {
        console.log('MongoDB already connected');
        return;
      }

      this.client = new MongoClient(connectionString);
      await this.client.connect();
      this.db = this.client.db(databaseName);
      this.isConnected = true;
      
      // Store connection details for reconnection after restart
      this.connectionString = connectionString;
      this.databaseName = databaseName;
      
      // Persist connection details in environment (for next restart)
      process.env.MONGODB_CONNECTION_STRING = connectionString;
      process.env.MONGODB_DATABASE_NAME = databaseName;
      
      console.log('Successfully connected to MongoDB and persisted connection details');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  // Method to get current connection details
  getConnectionDetails(): { connectionString: string | null; databaseName: string } {
    return {
      connectionString: this.connectionString,
      databaseName: this.databaseName
    };
  }

  // Methods required by storage layer

  async getAllSocialEvents(): Promise<any[]> {
    if (!this.db) {
      return [];
    }

    try {
      const collections = await this.db.listCollections().toArray();
      const socialCollections = collections.filter(col => 
        ['reddit', 'twitter', 'facebook', 'instagram', 'cnn', 'inshorts'].includes(col.name)
      );

      let allEvents: any[] = [];
      
      for (const collectionInfo of socialCollections) {
        const collection = this.db.collection(collectionInfo.name);
        const events = await collection.find({}).toArray();
        allEvents = allEvents.concat(events);
      }

      return allEvents.sort((a, b) => 
        new Date(b.timestamp_utc || b.created_at || 0).getTime() - 
        new Date(a.timestamp_utc || a.created_at || 0).getTime()
      );
    } catch (error) {
      console.error('Failed to get social events from MongoDB:', error);
      return [];
    }
  }

  // Remove this duplicate method

  // Remove this duplicate method

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Please provide connection credentials.');
    }
    return this.db;
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }

  // Get collection for a specific data source
  getCollection(sourceName: string): Collection {
    const db = this.getDatabase();
    // Normalize source name for collection naming
    const collectionName = sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return db.collection(collectionName);
  }

  // Store social event data to source-specific collection (this is the proper one)
  async storeSocialEvent(sourceName: string, event: SocialEvent): Promise<void> {
    try {
      const collection = this.getCollection(sourceName);
      const eventDoc = {
        ...event,
        mongodb_inserted_at: new Date(),
        source: sourceName
      };
      
      // Check if event already exists to avoid duplicates
      const existingEvent = await collection.findOne({ 
        event_id: event.event_id, 
        platform: event.platform 
      });
      
      if (!existingEvent) {
        await collection.insertOne(eventDoc);
        console.log(`Stored event to ${sourceName} collection:`, event.event_id);
      } else {
        console.log(`Event already exists in ${sourceName} collection:`, event.event_id);
      }
    } catch (error) {
      console.error(`Error storing event to ${sourceName} collection:`, error);
      throw error;
    }
  }

  // Bulk store multiple events
  async bulkStoreSocialEvents(sourceName: string, events: SocialEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      const collection = this.getCollection(sourceName);
      const eventsWithMetadata = events.map(event => ({
        ...event,
        mongodb_inserted_at: new Date(),
        source: sourceName
      }));

      // Use upsert to avoid duplicates
      const bulkOps = eventsWithMetadata.map(event => ({
        updateOne: {
          filter: { event_id: event.event_id, platform: event.platform },
          update: { $set: event },
          upsert: true
        }
      }));

      const result = await collection.bulkWrite(bulkOps);
      console.log(`Bulk stored ${result.upsertedCount} new events to ${sourceName} collection`);
    } catch (error) {
      console.error(`Error bulk storing events to ${sourceName} collection:`, error);
      throw error;
    }
  }

  // Get all collection names (data sources)
  async getDataSources(): Promise<string[]> {
    try {
      const db = this.getDatabase();
      const collections = await db.listCollections().toArray();
      return collections
        .map(col => col.name)
        .filter(name => !name.startsWith('system.')) // Filter out system collections
        .sort();
    } catch (error) {
      console.error('Error getting data sources:', error);
      return [];
    }
  }

  // Get data from a specific source collection
  async getDataFromSource(sourceName: string, limit: number = 1000): Promise<any[]> {
    try {
      const collection = this.getCollection(sourceName);
      const data = await collection
        .find({})
        .sort({ mongodb_inserted_at: -1 }) // Most recent first
        .limit(limit)
        .toArray();
      return data;
    } catch (error) {
      console.error(`Error getting data from ${sourceName} collection:`, error);
      return [];
    }
  }

  // Get collection stats
  async getCollectionStats(sourceName: string): Promise<any> {
    try {
      const collection = this.getCollection(sourceName);
      const count = await collection.countDocuments();
      const latestDoc = await collection.findOne({}, { sort: { mongodb_inserted_at: -1 } });
      const oldestDoc = await collection.findOne({}, { sort: { mongodb_inserted_at: 1 } });
      
      return {
        name: sourceName,
        documentCount: count,
        latestDocument: latestDoc?.mongodb_inserted_at || null,
        oldestDocument: oldestDoc?.mongodb_inserted_at || null
      };
    } catch (error) {
      console.error(`Error getting stats for ${sourceName} collection:`, error);
      return {
        name: sourceName,
        documentCount: 0,
        latestDocument: null,
        oldestDocument: null
      };
    }
  }
}

export const mongoService = new MongoDBService();