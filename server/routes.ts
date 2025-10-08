import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mongoService } from "./mongodb";
import { insertContactMessageSchema, insertSocialEventSchema, insertSettingsSchema, dataSourceCredentialsSchema } from "@shared/schema";
import { z } from "zod";
import { agentManager } from "./agents/agent-manager";
import { llmService } from "./llm-service";
import chromaStartup from "./services/chroma-startup.js";
import AirportConfigHelper from "@shared/airport-config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize ChromaDB on startup
  console.log('🚀 Initializing ChromaDB service...');
  try {
    const chromaStarted = await chromaStartup.start();
    if (chromaStarted) {
      console.log('✅ ChromaDB service initialized successfully');
    } else {
      console.warn('⚠️ ChromaDB service failed to start, continuing without it');
    }
  } catch (error) {
    console.error('❌ ChromaDB initialization error:', error.message);
  }

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

  // Serve word cloud allowed list CSV with dynamic airport terms
  app.get("/lib/assets/word-cloud-allowed-list.csv", async (req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const csvPath = path.resolve('lib/assets/word-cloud-allowed-list.csv');
      let csvContent = fs.readFileSync(csvPath, 'utf-8');
      
      // Add airport-specific terms dynamically
      const airportTerms = AirportConfigHelper.getWordCloudTerms();
      if (airportTerms.length > 0) {
        csvContent += '\n' + airportTerms.join('\n');
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvContent);
    } catch (error) {
      res.status(404).json({ error: "Word cloud allowed list not found" });
    }
  });

  // Airport configuration endpoints
  app.get("/api/airport-config", async (req, res) => {
    try {
      const config = AirportConfigHelper.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to load airport configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/airport-config/reload", async (req, res) => {
    try {
      const config = AirportConfigHelper.reloadConfig();
      res.json({
        success: true,
        message: "Airport configuration reloaded successfully",
        airport: `${config.airport.city} (${config.airport.code})`
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to reload airport configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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
      const chartData = await mongoService.getChartData();
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  app.get("/api/insights", async (req, res) => {
    try {
      // Try AI-generated insights first
      try {
        const { AgenticInsightSystem } = await import('./services/insight-generator.js');
        const aiSystem = new AgenticInsightSystem();
        const result = await aiSystem.generateActionableInsights();
        
        // Ensure insights is a proper array
        const insights = Array.isArray(result.insights) ? result.insights : Object.values(result.insights || {});
        
        res.json(insights);
        return;
      } catch (aiError: any) {
        console.warn('AI insight generation failed, using stored insights:', aiError?.message || 'Unknown error');
      }
      
      // Fallback to stored insights
      const insights = await mongoService.getInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  // Populate ChromaDB with embeddings from existing MongoDB social events
  app.post("/api/chromadb/populate-embeddings", async (req, res) => {
    try {
      if (!mongoService.isConnectionActive()) {
        return res.status(400).json({ error: "MongoDB not connected" });
      }

      const socialEvents = await mongoService.getAllSocialEvents();
      let successCount = 0;
      let errorCount = 0;

      for (const event of socialEvents) {
        try {
          const textContent = event.event_content || event.clean_event_text || '';
          if (textContent.trim()) {
            await llmService.storeEventEmbedding(
              event._id?.toString() || event.id || `event_${Date.now()}`,
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
        } catch (error) {
          errorCount++;
          console.error(`Error storing embedding for event ${event.id}:`, error);
        }
      }

      res.json({
        success: true,
        message: `ChromaDB population completed`,
        totalEvents: socialEvents.length,
        successfulEmbeddings: successCount,
        errors: errorCount
      });
    } catch (error) {
      console.error('ChromaDB population error:', error);
      res.status(500).json({ error: "Failed to populate ChromaDB embeddings" });
    }
  });

  // **REMOVED MOCK DATA MIGRATION - NOW USING REAL DATA ONLY**
  // This endpoint was disabled to eliminate mock data usage
  app.post("/api/migrate-mock-data", async (req, res) => {
    res.status(410).json({ 
      error: "Mock data migration disabled - system now uses only real data from social media sources"
    });
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
      const query = AirportConfigHelper.buildDefaultQuery();
      
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

  // Test all data collectors
  app.post("/api/test-collectors", async (req, res) => {
    try {
      const { testServices } = await import('./test-services.js');
      const results = await testServices.testAllCollectors();
      
      res.json({
        success: true,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Test collectors error:', error);
      res.status(500).json({
        error: "Failed to test collectors",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get collector status and metrics
  app.get("/api/collector-status", async (req, res) => {
    try {
      // Get active collectors based on last successful fetch
      const activeCollectors = [];
      const sources = ['twitter', 'reddit', 'facebook', 'cnn'];
      
      for (const source of sources) {
        if (agentManager.validateCredentials(source)) {
          activeCollectors.push({
            name: source,
            status: 'active',
            last_sync: new Date().toISOString(), // Would be actual last sync in production
            frequency: '1 hour',
            next_sync: new Date(Date.now() + 3600000).toISOString()
          });
        }
      }

      // Get total events from MongoDB
      let totalEvents = 0;
      if (mongoService.isConnectionActive()) {
        try {
          const socialEvents = await mongoService.getCollectionSize('social_events');
          const newsEvents = await mongoService.getCollectionSize('news_events') || 0;
          totalEvents = socialEvents + newsEvents;
        } catch (error) {
          console.error('Error getting collection sizes:', error);
        }
      }

      res.json({
        active_collectors: activeCollectors.length,
        total_events: totalEvents,
        last_sync: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        collectors: activeCollectors
      });
    } catch (error) {
      console.error('Collector status error:', error);
      res.status(500).json({
        error: "Failed to get collector status"
      });
    }
  });

  // AVA chatbot endpoint - RAG implementation
  app.post("/api/ava/chat", async (req, res) => {
    try {
      console.log('📨 Received chat request body:', req.body);
      const { message, sessionId } = req.body;
      
      if (!message?.trim()) {
        console.log('❌ Invalid message field:', { message, body: req.body });
        return res.status(400).json({ error: "Message is required" });
      }

      // Implement RAG: First search through scraped social media data
      const query = message.trim();
      // Always use 'default' session and 'Pramit' user for consistent context tracking
      const userSessionId = 'default';
      const userId = 'Pramit';
      let response;
      
      try {
        // Use the new agentic reasoning system directly with session and user ID
        response = await llmService.generateChatResponse(query, [], userSessionId, userId);
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
      console.error('AVA chat error:', error);
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
        event.event_content?.toLowerCase().includes("delay") || 
        event.event_content?.toLowerCase().includes("late") ||
        event.event_content?.toLowerCase().includes("on time")
      );
      
      if (delayEvents.length > 0) {
        return `Based on recent social media posts, I found ${delayEvents.length} mentions about flight delays. Here's what passengers are saying: ${delayEvents.slice(0, 2).map(e => `"${e.event_content?.substring(0, 100)}..."`).join(" | ")}`;
      }
    } else if (query.includes("luggage") || query.includes("baggage")) {
      const events = await storage.getSocialEvents({ limit: 50 });
      const luggageEvents = events.filter(event => 
        event.event_content?.toLowerCase().includes("luggage") || 
        event.event_content?.toLowerCase().includes("baggage") ||
        event.event_content?.toLowerCase().includes("lost bag")
      );
      
      if (luggageEvents.length > 0) {
        return `I found ${luggageEvents.length} recent posts about luggage handling. Recent feedback: ${luggageEvents.slice(0, 2).map(e => `"${e.event_content?.substring(0, 100)}..."`).join(" | ")}`;
      }
    } else if (query.includes("security") || query.includes("screening")) {
      const events = await storage.getSocialEvents({ limit: 50 });
      const securityEvents = events.filter(event => 
        event.event_content?.toLowerCase().includes("security") || 
        event.event_content?.toLowerCase().includes("screening") ||
        event.event_content?.toLowerCase().includes("checkpoint")
      );
      
      if (securityEvents.length > 0) {
        return `Found ${securityEvents.length} mentions about security processes. Recent experiences: ${securityEvents.slice(0, 2).map(e => `"${e.event_content?.substring(0, 100)}..."`).join(" | ")}`;
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
          const stats = await mongoService.getFromCollection(source);
          return { name: source, count: stats.length };
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
      
      const data = await mongoService.getFromCollection(sourceName);
      
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

  // Weather API endpoints for MongoDB collections

  // Get weather conditions
  app.get("/api/weather/conditions", async (req, res) => {
    try {
      const conditions = await mongoService.getFromCollection('weather_conditions', {});
      res.json(conditions);
    } catch (error) {
      console.error('Weather conditions fetch error:', error);
      res.status(500).json({ error: "Failed to fetch weather conditions" });
    }
  });

  // Get weather alerts
  app.get("/api/weather/alerts", async (req, res) => {
    try {
      const alerts = await mongoService.getFromCollection('weather_alerts', {});
      res.json(alerts);
    } catch (error) {
      console.error('Weather alerts fetch error:', error);
      res.status(500).json({ error: "Failed to fetch weather alerts" });
    }
  });

  // Delete weather alert
  app.delete("/api/weather/alerts", async (req, res) => {
    try {
      const { condition } = req.body;
      if (!condition) {
        return res.status(400).json({ error: "Condition is required" });
      }
      
      const deletedCount = await mongoService.deleteFromCollection('weather_alerts', { condition });
      res.json({ success: true, deletedCount, message: `Deleted ${deletedCount} alerts with condition: ${condition}` });
    } catch (error) {
      console.error('Error deleting weather alert:', error);
      res.status(500).json({ error: "Failed to delete weather alert" });
    }
  });

  // Get weather correlation data
  app.get("/api/weather/correlations", async (req, res) => {
    try {
      const correlations = await mongoService.getFromCollection('weather_correlations', {});
      res.json(correlations);
    } catch (error) {
      console.error('Weather correlations fetch error:', error);
      res.status(500).json({ error: "Failed to fetch weather correlations" });
    }
  });

  // Get weather forecast data
  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const forecasts = await mongoService.getFromCollection('weather_forecast', {});
      res.json(forecasts);
    } catch (error) {
      console.error('Weather forecast fetch error:', error);
      res.status(500).json({ error: "Failed to fetch weather forecasts" });
    }
  });

  // Verify user_id field exists in ava_conversations
  app.get("/api/ava/verify-user-field", async (req, res) => {
    try {
      // Get a sample document to check structure
      const sample = await mongoService.getFromCollection('ava_conversations', {});
      const hasUserIdField = sample.length > 0 && 'userId' in sample[0];
      
      res.json({
        success: true,
        hasUserIdField,
        sampleDocument: sample[0] || null,
        totalDocuments: sample.length
      });
    } catch (error) {
      console.error('AVA user_id verification error:', error);
      res.status(500).json({ error: "Failed to verify user_id field" });
    }
  });

  // Seed weather data endpoint
  app.post("/api/weather/seed", async (req, res) => {
    try {
      if (!mongoService.isConnectionActive()) {
        return res.status(400).json({ error: "MongoDB not connected" });
      }

      // Weather conditions data (current and historical)
      const weatherConditions = [
        {
          date: '2025-08-20',
          time: '14:00',
          temperature: 28,
          condition: 'partly_cloudy',
          humidity: 72,
          windSpeed: 15,
          visibility: 8,
          pressure: 1013,
          uvIndex: 6,
          description: 'Partly cloudy with moderate humidity'
        },
        {
          date: '2025-08-19',
          time: '14:00',
          temperature: 24,
          condition: 'thunderstorm',
          humidity: 90,
          windSpeed: 25,
          visibility: 4,
          pressure: 1005,
          uvIndex: 2,
          description: 'Thunderstorm with heavy rain and strong winds'
        },
        {
          date: '2025-08-18',
          time: '14:00',
          temperature: 30,
          condition: 'sunny',
          humidity: 60,
          windSpeed: 10,
          visibility: 10,
          pressure: 1018,
          uvIndex: 8,
          description: 'Clear sunny weather with excellent visibility'
        },
        {
          date: '2025-08-17',
          time: '14:00',
          temperature: 22,
          condition: 'rain',
          humidity: 85,
          windSpeed: 18,
          visibility: 5,
          pressure: 1008,
          uvIndex: 3,
          description: 'Light to moderate rain with overcast skies'
        }
      ];

      // Weather correlation data
      const weatherCorrelations = [
        {
          condition: 'Sunny',
          avgSentiment: 0.6,
          delayComplaints: 15,
          socialActivity: 85,
          passengerComfort: 'high',
          operationalImpact: 'minimal'
        },
        {
          condition: 'Cloudy', 
          avgSentiment: 0.3,
          delayComplaints: 25,
          socialActivity: 95,
          passengerComfort: 'moderate',
          operationalImpact: 'low'
        },
        {
          condition: 'Rain',
          avgSentiment: -0.2,
          delayComplaints: 45,
          socialActivity: 120,
          passengerComfort: 'low',
          operationalImpact: 'moderate'
        },
        {
          condition: 'Thunderstorm',
          avgSentiment: -0.4,
          delayComplaints: 65,
          socialActivity: 140,
          passengerComfort: 'very_low',
          operationalImpact: 'high'
        },
        {
          condition: 'Fog',
          avgSentiment: -0.6,
          delayComplaints: 85,
          socialActivity: 160,
          passengerComfort: 'very_low',
          operationalImpact: 'very_high'
        }
      ];

      // Weather alerts data
      const weatherAlerts = [
        {
          id: 'alert-001',
          type: 'warning',
          condition: 'High Winds',
          severity: 'moderate',
          message: 'Strong winds may affect airport operations',
          impact: 'Possible ground delays and passenger safety concerns',
          isActive: true,
          startTime: new Date('2025-08-20T10:00:00Z'),
          expectedEndTime: new Date('2025-08-20T18:00:00Z'),
          affectedOperations: ['ground_ops', 'boarding']
        },
        {
          id: 'alert-002',
          type: 'info',
          condition: 'High Humidity',
          severity: 'low',
          message: 'High humidity levels detected',
          impact: 'May affect passenger comfort in outdoor areas',
          isActive: true,
          startTime: new Date('2025-08-20T08:00:00Z'),
          expectedEndTime: new Date('2025-08-20T20:00:00Z'),
          affectedOperations: ['passenger_comfort']
        },
      ];

      // Insert data into MongoDB collections
      await mongoService.bulkInsertToCollection('weather_conditions', weatherConditions);
      await mongoService.bulkInsertToCollection('weather_correlations', weatherCorrelations);  
      await mongoService.bulkInsertToCollection('weather_alerts', weatherAlerts);

      res.json({
        success: true,
        message: 'Weather data seeded successfully',
        collections: {
          weather_conditions: weatherConditions.length,
          weather_correlations: weatherCorrelations.length,
          weather_alerts: weatherAlerts.length
        }
      });

    } catch (error) {
      console.error('Weather seed error:', error);
      res.status(500).json({
        error: "Failed to seed weather data",
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
        const platform = event.platform?.toLowerCase() || 'unknown';
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

  // Reddit embedding test endpoint
  app.post("/api/test/reddit-embeddings", async (req, res) => {
    try {
      console.log('🎯 Starting Reddit embedding test via API...');
      const { RedditEmbeddingTest } = await import('./services/reddit-embedding-test.js');
      const test = new RedditEmbeddingTest();
      await test.runEmbeddingTest();
      
      res.json({ 
        success: true, 
        message: 'Reddit embedding test completed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ Reddit embedding test failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Reddit embedding test failed',
        details: error?.message || 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
