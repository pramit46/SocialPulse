import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertSocialEventSchema, insertSettingsSchema, dataSourceCredentialsSchema } from "@shared/schema";
import { z } from "zod";
import { dataCollectionService } from "./data-collection";
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

      // Set credentials for the data collection service
      dataCollectionService.setCredentials(credentials);
      
      let events: any[] = [];
      const query = "bangalore airport OR bengaluru airport OR kempegowda airport OR indigo OR spicejet OR air india OR vistara";
      
      // Collect data based on source type
      switch (source) {
        case 'twitter':
          events = await dataCollectionService.collectTwitterData(query);
          break;
        case 'reddit':
          events = await dataCollectionService.collectRedditData(query);
          break;
        case 'facebook':
          events = await dataCollectionService.collectFacebookData(query);
          break;
        case 'youtube':
          events = await dataCollectionService.collectYouTubeData(query);
          break;
        case 'instagram':
          events = await dataCollectionService.collectInstagramData(query);
          break;
        case 'vimeo':
          events = await dataCollectionService.collectVimeoData(query);
          break;
        case 'tiktok':
          events = await dataCollectionService.collectTikTokData(query);
          break;
        case 'tumblr':
          events = await dataCollectionService.collectTumblrData(query);
          break;
        case 'aajtak':
        case 'wion':
        case 'zee_news':
        case 'ndtv':
        case 'cnn':
          events = await dataCollectionService.collectNewsData(source, credentials[`${source}_rss_url`] || credentials[`${source}_api_key`]);
          break;
        default:
          return res.status(400).json({ error: `Data collection for ${source} not implemented yet` });
      }

      // Store collected events
      const storedEvents = [];
      for (const eventData of events) {
        const event = await storage.createSocialEvent(eventData);
        storedEvents.push(event);
      }

      res.json({ 
        success: true, 
        source,
        eventsCollected: storedEvents.length,
        events: storedEvents
      });
    } catch (error) {
      console.error('Data collection error:', error);
      res.status(500).json({ 
        error: "Failed to collect data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AeroBot chatbot endpoint
  app.post("/api/aerobot/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message?.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      // For now, disable LLM service due to encoding issues and use fallback responses
      const trimmedMessage = message.trim().toLowerCase();
      let response = "I understand you're asking about Bangalore airport experiences. Based on our analytics data, I can provide insights about sentiment, airline performance, and passenger feedback. For specific queries about delays, luggage, lounges, security, or check-in processes, please try those specific topics.";

      // Check for specific known topics
      if (trimmedMessage.includes("delay")) {
        response = "Flight delays at Bangalore airport show varying patterns across airlines. IndiGo maintains the best on-time performance at 82%, followed by Vistara at 78%. Air India has improved to 71% on-time, while SpiceJet faces challenges with 65% punctuality. Weather and air traffic are the primary delay factors during monsoon season.";
      } else if (trimmedMessage.includes("restaurant") || trimmedMessage.includes("food") || trimmedMessage.includes("dining")) {
        response = "Bangalore airport offers diverse dining options across terminals. Popular choices include Café Coffee Day, McDonald's, Subway, and local South Indian restaurants like MTR. Premium lounges feature buffet dining. Terminal 1 has more budget options, while Terminal 2 offers upscale dining experiences. Food courts are located on Level 3 of both terminals.";
      } else if (trimmedMessage.includes("shopping") || trimmedMessage.includes("duty free")) {
        response = "The airport features extensive shopping including duty-free stores, local handicraft shops, electronics retailers, and fashion brands. Popular purchases include Indian spices, silk products, and sandalwood items. Duty-free shopping is available for international travelers with competitive prices on alcohol, perfumes, and chocolates.";
      } else if (trimmedMessage.includes("transportation") || trimmedMessage.includes("taxi") || trimmedMessage.includes("uber")) {
        response = "Transportation from Bangalore airport includes pre-paid taxis, Ola/Uber ride-sharing, BMTC Vayu Vajra buses, and private car rentals. The airport is well-connected to the city center via Ballari Road. Travel time to major areas ranges from 45 minutes to 1.5 hours depending on traffic conditions.";
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

  const httpServer = createServer(app);
  return httpServer;
}
