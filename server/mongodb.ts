import { MongoClient, Db, Collection } from "mongodb";
import type { SocialEvent } from "@shared/schema";
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionString: string | null = null;
  private databaseName: string = "bangalore_airport_analytics";
  private isConnected: boolean = false;

  constructor() {
    void this.autoConnect();
  }

  // Auto-connect using environment variables
  private async autoConnect() {
    const connectionString = process.env.MONGODB_CONNECTION_STRING;
    const databaseName = process.env.MONGODB_DATABASE_NAME || "bangalore_airport_analytics";

    if (connectionString) {
      try {
        await this.connect(connectionString, databaseName);
        console.log('Auto-connected to MongoDB using environment variables');
      } catch (error) {
        console.warn('Failed to auto-connect to MongoDB:', error);
      }
    }
  }

  async connect(connectionString: string, databaseName: string = "bangalore_airport_analytics"): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
      }

      this.client = new MongoClient(connectionString);
      await this.client.connect();
      
      this.db = this.client.db(databaseName);
      this.connectionString = connectionString;
      this.databaseName = databaseName;
      this.isConnected = true;

      // Test the connection
      await this.db.admin().ping();

      // Persist connection details
      const config = {
        connectionString,
        databaseName,
        connectedAt: new Date().toISOString()
      };
      
      fs.writeFileSync('./mongodb-config.json', JSON.stringify(config, null, 2));
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

  isConnectionActive(): boolean {
    return this.isConnected;
  }

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

  // Get collection for a specific data source
  getCollection(sourceName: string): Collection {
    const db = this.getDatabase();
    // Normalize source name for collection naming
    const collectionName = sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return db.collection(collectionName);
  }

  // Store social event data to source-specific collection
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
        console.log(`✅ Stored event to ${sourceName} collection:`, event.event_id);
      } else {
        console.log(`Event already exists in ${sourceName} collection:`, event.event_id);
      }
    } catch (error) {
      console.error(`❌ Error storing event to ${sourceName} collection:`, error);
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
      console.log(`✅ Bulk stored ${result.upsertedCount} new events to ${sourceName} collection`);
    } catch (error) {
      console.error(`❌ Error bulk storing events to ${sourceName} collection:`, error);
      throw error;
    }
  }

  // Export data from a specific collection
  async exportCollectionData(sourceName: string): Promise<any[]> {
    try {
      const collection = this.getCollection(sourceName);
      return await collection.find({}).toArray();
    } catch (error) {
      console.error(`Error exporting data from ${sourceName} collection:`, error);
      return [];
    }
  }

  // Get all collection names
  async getCollectionNames(): Promise<string[]> {
    if (!this.db) return [];
    
    try {
      const collections = await this.db.listCollections().toArray();
      return collections.map(col => col.name);
    } catch (error) {
      console.error('Error getting collection names:', error);
      return [];
    }
  }

  // Get stats for dashboard
  async getCollectionStats(): Promise<{ [key: string]: number }> {
    if (!this.db) return {};

    try {
      const collections = await this.db.listCollections().toArray();
      const stats: { [key: string]: number } = {};

      for (const collectionInfo of collections) {
        const collection = this.db.collection(collectionInfo.name);
        const count = await collection.countDocuments();
        stats[collectionInfo.name] = count;
      }

      return stats;
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return {};
    }
  }

  // Generic method to insert multiple documents into any collection
  async bulkInsertToCollection(collectionName: string, documents: any[]): Promise<void> {
    if (documents.length === 0) return;

    try {
      const collection = this.getCollection(collectionName);
      const docsWithMetadata = documents.map(doc => ({
        ...doc,
        mongodb_inserted_at: new Date()
      }));

      await collection.insertMany(docsWithMetadata);
      console.log(`✅ Bulk inserted ${documents.length} documents to ${collectionName} collection`);
    } catch (error) {
      console.error(`❌ Error bulk inserting to ${collectionName} collection:`, error);
      throw error;
    }
  }

  // Generic method to get documents from any collection
  async getFromCollection(collectionName: string, filter: any = {}): Promise<any[]> {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.find(filter).toArray();
    } catch (error) {
      console.error(`❌ Error getting data from ${collectionName} collection:`, error);
      return [];
    }
  }

  // Generic method to delete documents from any collection
  async deleteFromCollection(collectionName: string, filter: any): Promise<number> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.deleteMany(filter);
      console.log(`✅ Deleted ${result.deletedCount} documents from ${collectionName} collection`);
      return result.deletedCount;
    } catch (error) {
      console.error(`❌ Error deleting from ${collectionName} collection:`, error);
      return 0;
    }
  }

  // Get size of a specific collection
  async getCollectionSize(collectionName: string): Promise<number> {
    try {
      const collection = this.getCollection(collectionName);
      return await collection.countDocuments();
    } catch (error) {
      console.error(`❌ Error getting size of ${collectionName} collection:`, error);
      return 0;
    }
  }

  // Get data sources (social media platforms)
  async getDataSources(): Promise<string[]> {
    if (!this.db) return [];
    
    try {
      const collections = await this.db.listCollections().toArray();
      const socialCollections = collections
        .filter(col => ['reddit', 'twitter', 'facebook', 'instagram', 'cnn', 'inshorts', 'wion', 'zee', 'ndtv'].includes(col.name))
        .map(col => col.name);
      
      return socialCollections;
    } catch (error) {
      console.error('Error getting data sources:', error);
      return [];
    }
  }
  // Dashboard Analytics Methods
  async getChartData(): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('chart_data');
    const data = await collection.findOne({ type: 'dashboard_charts' });
    return data?.data || { engagement: [], platforms: [] };
  }

  async storeChartData(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('chart_data');
    await collection.replaceOne(
      { type: 'dashboard_charts' },
      { type: 'dashboard_charts', data, updatedAt: new Date() },
      { upsert: true }
    );
  }

  async getInsights(): Promise<any[]> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('insights');
    return await collection.find({}).toArray();
  }

  async storeInsights(insights: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('insights');
    await collection.deleteMany({});
    await collection.insertMany(insights);
  }

  async getSentimentData(): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('sentiment_data');
    const data = await collection.findOne({ type: 'airport_sentiment' });
    return data?.data || { bangalore_airport: null, airlines: {} };
  }

  async storeSentimentData(data: any): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('sentiment_data');
    await collection.replaceOne(
      { type: 'airport_sentiment' },
      { type: 'airport_sentiment', data, updatedAt: new Date() },
      { upsert: true }
    );
  }

  // AVA Context Management - Collection: 'ava_conversations'
  async storeAvaContext(sessionId: string, context: any, userId: string = 'Pramit'): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('ava_conversations');
    console.log(`📝 [MongoDB] Storing AVA context for session: ${sessionId} | User: ${userId}`);
    
    await collection.replaceOne(
      { sessionId },
      { 
        sessionId,
        userId, // Added user_id field with default 'Pramit'
        context, 
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      { upsert: true }
    );
  }

  async getAvaContext(sessionId: string): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('ava_conversations');
    console.log(`🔍 [MongoDB] Retrieving AVA context for session: ${sessionId}`);
    
    const result = await collection.findOne({ sessionId });
    if (result && result.expiresAt > new Date()) {
      console.log(`✅ [MongoDB] Found valid context for session: ${sessionId}`);
      return result.context;
    }
    
    console.log(`❌ [MongoDB] No valid context found for session: ${sessionId}`);
    return null;
  }

  async clearExpiredAvaContexts(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    const collection = this.db.collection('ava_conversations');
    const result = await collection.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log(`🧹 [MongoDB] Cleared ${result.deletedCount} expired AVA contexts`);
  }
}

export const mongoService = new MongoDBService();