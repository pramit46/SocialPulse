import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoService } from "./mongodb";
import { insertContactMessageSchema, insertSocialEventSchema, insertSettingsSchema, dataSourceCredentialsSchema } from "@shared/schema";
import { z } from "zod";
import { agentManager } from "./agents/agent-manager";
import { llmService } from "./llm-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(contactData);
      res.json({ success: true, message: "Message sent successfully", id: message.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid form data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // Get social events endpoint
  app.get("/api/social-events", async (req, res) => {
    try {
      const events = await storage.getSocialEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social events" });
    }
  });

  // Create social event endpoint
  app.post("/api/social-events", async (req, res) => {
    try {
      const eventData = insertSocialEventSchema.parse(req.body);
      const event = await storage.createSocialEvent(eventData);
      res.json({ success: true, event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid event data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create social event" });
      }
    }
  });

  // Get settings endpoint
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update settings endpoint
  app.post("/api/settings", async (req, res) => {
    try {
      const settingsData = insertSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(settingsData);
      res.json({ success: true, settings });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update settings" });
      }
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/metrics", async (req, res) => {
    try {
      const metrics = await storage.getAnalyticsMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics metrics" });
    }
  });

  app.get("/api/analytics/charts", async (req, res) => {
    try {
      const chartData = await storage.getChartData();
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  // Data collection endpoint
  app.post("/api/collect-data", async (req, res) => {
    try {
      const { source, credentials } = req.body;
      
      if (!source) {
        return res.status(400).json({ error: "Source is required" });
      }

      // Set credentials for the specific agent
      agentManager.setCredentials(source, credentials || {});
      
      let events: any[] = [];
      const query = "bangalore airport OR bengaluru airport OR kempegowda airport OR indigo OR spicejet OR air india OR vistara";
      
      // Check if agent exists and credentials are valid
      if (!agentManager.validateCredentials(source)) {
        return res.status(400).json({ 
          error: `Invalid or missing credentials for ${source}` 
        });
      }

      // Collect data using the appropriate agent
      events = await agentManager.collectData(source, query);

      if (events.length === 0) {
        return res.json({ 
          success: true, 
          source,
          eventsCollected: 0,
          message: `No new events found for ${source}`
        });
      }

      res.json({ 
        success: true, 
        source,
        eventsCollected: events.length,
        events: events
      });
    } catch (error) {
      console.error('Data collection error:', error);
      res.status(500).json({ 
        error: "Failed to collect data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AeroBot chatbot endpoint - RAG implementation
  app.post("/api/aerobot/chat", async (req, res) => {
    try {
      console.log('📨 Received chat request body:', req.body);
      const { message } = req.body;
      
      if (!message?.trim()) {
        console.log('❌ Invalid message field:', { message, body: req.body });
        return res.status(400).json({ error: "Message is required" });
      }

      // Implement RAG: First search through scraped social media data
      const query = message.trim();
      let response;
      
      try {
        // Use the new agentic reasoning system directly
        response = await llmService.generateChatResponse(query);
      } catch (ragError) {
        console.error('AVA system error:', ragError);
        // Fallback to basic topic-based responses if AVA fails
        response = await getBasicResponse(query.toLowerCase());
      }
      
      res.json({ 
        success: true, 
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AeroBot chat error:', error);
      res.status(500).json({ 
        error: "Failed to generate response",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Helper function for basic responses when RAG system is unavailable
  async function getBasicResponse(query: string): Promise<string> {
    // Check for specific known topics based on actual scraped data categories
    if (query.includes("delay") || query.includes("on time") || query.includes("punctual")) {
      // Try to get actual delay data from storage
      const events = await storage.getSocialEvents({ limit: 50 });
      const delayEvents = events.filter(event => 
        event.event_content.toLowerCase().includes("delay") || 
        event.event_content.toLowerCase().includes("late") ||
        event.event_content.toLowerCase().includes("on time")
      );
      
      if (delayEvents.length > 0) {
        return `Based on recent social media posts, I found ${delayEvents.length} mentions about flight delays. Here's what passengers are saying: ${delayEvents.slice(0, 2).map(e => `"${e.event_content.substring(0, 100)}..."`).join(" | ")}`;
      }
    } else if (query.includes("luggage") || query.includes("baggage")) {
      const events = await storage.getSocialEvents({ limit: 50 });
      const luggageEvents = events.filter(event => 
        event.event_content.toLowerCase().includes("luggage") || 
        event.event_content.toLowerCase().includes("baggage") ||
        event.event_content.toLowerCase().includes("lost bag")
      );
      
      if (luggageEvents.length > 0) {
        return `I found ${luggageEvents.length} recent posts about luggage handling. Recent feedback: ${luggageEvents.slice(0, 2).map(e => `"${e.event_content.substring(0, 100)}..."`).join(" | ")}`;
      }
    } else if (query.includes("security") || query.includes("screening")) {
      const events = await storage.getSocialEvents({ limit: 50 });
      const securityEvents = events.filter(event => 
        event.event_content.toLowerCase().includes("security") || 
        event.event_content.toLowerCase().includes("screening") ||
        event.event_content.toLowerCase().includes("checkpoint")
      );
      
      if (securityEvents.length > 0) {
        return `Found ${securityEvents.length} mentions about security processes. Recent experiences: ${securityEvents.slice(0, 2).map(e => `"${e.event_content.substring(0, 100)}..."`).join(" | ")}`;
      }
    }
    
    return "I don't have specific social media data matching your query. Our system tracks passenger experiences about Bangalore airport including delays, luggage handling, security, check-in processes, and airline services. Please try asking about these topics, or visit our Dashboard for current analytics.";
  }

  // General query endpoint for unknown queries to be handled by LLM
  app.post("/api/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const response = await llmService.generateChatResponse(query);
      
      res.json({ 
        success: true, 
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Query processing error:', error);
      res.status(500).json({ 
        error: "Failed to process query",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // User management endpoints
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = req.body;
      const user = await storage.createUser(userData);
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // MongoDB Configuration endpoint
  app.post("/api/mongodb/connect", async (req, res) => {
    try {
      const { connectionString, databaseName } = req.body;
      
      if (!connectionString) {
        return res.status(400).json({ error: "MongoDB connection string is required" });
      }
      
      await mongoService.connect(connectionString, databaseName);
      res.json({ 
        success: true, 
        message: "Successfully connected to MongoDB",
        isConnected: mongoService.isConnectionActive()
      });
    } catch (error) {
      console.error('MongoDB connection error:', error);
      res.status(500).json({ 
        error: "Failed to connect to MongoDB",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // MongoDB Status endpoint
  app.get("/api/mongodb/status", async (req, res) => {
    try {
      res.json({
        isConnected: mongoService.isConnectionActive(),
        dataSources: mongoService.isConnectionActive() ? await mongoService.getDataSources() : []
      });
    } catch (error) {
      console.error('MongoDB status error:', error);
      res.status(500).json({ 
        error: "Failed to get MongoDB status",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get data sources (collections) endpoint
  app.get("/api/mongodb/data-sources", async (req, res) => {
    try {
      if (!mongoService.isConnectionActive()) {
        return res.status(400).json({ error: "MongoDB not connected" });
      }
      
      const dataSources = await mongoService.getDataSources();
      const sourceStats = await Promise.all(
        dataSources.map(async (source) => {
          return await mongoService.getCollectionStats(source);
        })
      );
      
      res.json({ sources: sourceStats });
    } catch (error) {
      console.error('Error getting data sources:', error);
      res.status(500).json({ 
        error: "Failed to get data sources",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Download data from specific source
  app.get("/api/mongodb/download/:sourceName", async (req, res) => {
    try {
      if (!mongoService.isConnectionActive()) {
        return res.status(400).json({ error: "MongoDB not connected" });
      }
      
      const { sourceName } = req.params;
      const { format = 'json', limit = 1000 } = req.query;
      
      const data = await mongoService.getDataFromSource(sourceName, parseInt(limit as string));
      
      if (format === 'csv') {
        // Convert to CSV format
        if (data.length === 0) {
          return res.status(404).json({ error: "No data found for this source" });
        }
        
        // Get all unique keys from all documents
        const allKeys = new Set<string>();
        data.forEach(doc => {
          Object.keys(doc).forEach(key => allKeys.add(key));
        });
        
        const headers = Array.from(allKeys).filter(key => key !== '_id'); // Exclude MongoDB _id
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(doc => {
          const row = headers.map(header => {
            const value = doc[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
            return value.toString();
          });
          csvContent += row.join(',') + '\n';
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${sourceName}_data.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${sourceName}_data.json"`);
        res.json(data);
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      res.status(500).json({ 
        error: "Failed to download data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Migration endpoint to transfer existing data to MongoDB
  app.post("/api/mongodb/migrate-existing-data", async (req, res) => {
    try {
      if (!mongoService.isConnectionActive()) {
        return res.status(400).json({ error: "MongoDB not connected" });
      }

      // Get all existing social events from memory storage
      const existingEvents = await storage.getSocialEvents();
      
      if (existingEvents.length === 0) {
        return res.json({ 
          success: true, 
          message: "No existing events to migrate",
          migratedCount: 0 
        });
      }

      // Group events by platform for organized storage
      const eventsByPlatform = existingEvents.reduce((groups: Record<string, typeof existingEvents>, event) => {
        const platform = event.platform.toLowerCase();
        if (!groups[platform]) {
          groups[platform] = [];
        }
        groups[platform].push(event);
        return groups;
      }, {} as Record<string, typeof existingEvents>);

      let totalMigrated = 0;
      const migrationResults = [];

      // Migrate each platform's events to MongoDB
      for (const [platform, events] of Object.entries(eventsByPlatform)) {
        try {
          await mongoService.bulkStoreSocialEvents(platform, events as any[]);
          migrationResults.push({
            platform,
            eventCount: events.length,
            status: 'success'
          });
          totalMigrated += events.length;
        } catch (error) {
          migrationResults.push({
            platform,
            eventCount: events.length,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Successfully migrated ${totalMigrated} events to MongoDB Atlas`,
        totalEvents: existingEvents.length,
        migratedCount: totalMigrated,
        results: migrationResults
      });

    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({
        error: "Failed to migrate data to MongoDB",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
