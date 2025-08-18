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
        case 'aajtak':
        case 'wion':
        case 'zee_news':
        case 'ndtv':
          events = await dataCollectionService.collectNewsData(source, credentials[`${source}_rss_url`]);
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
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const response = await llmService.generateChatResponse(message);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
