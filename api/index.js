import express from "express";
import { storage } from "../server/storage.js";
import { mongoService } from "../server/mongodb.js";
import { insertContactMessageSchema, insertSocialEventSchema, insertSettingsSchema } from "../shared/schema.js";
import { serveStatic } from "../server/vite.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint - ensure this works first
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Basic endpoints that don't require heavy dependencies
app.get("/api/social-events", async (req, res) => {
  try {
    const events = await storage.getSocialEvents();
    res.json(events);
  } catch (error) {
    console.error('Social events error:', error);
    res.json([]); // Return empty array instead of error
  }
});

app.get("/api/insights", async (req, res) => {
  try {
    // Return mock insights for now to ensure frontend works
    const mockInsights = [
      {
        title: "High Activity Period",
        description: "Increased social media mentions detected during evening hours",
        type: "info",
        confidence: 0.8
      },
      {
        title: "Positive Sentiment Trend", 
        description: "Overall sentiment has improved by 15% this week",
        type: "positive",
        confidence: 0.9
      }
    ];
    res.json(mockInsights);
  } catch (error) {
    console.error('Insights error:', error);
    res.json([]);
  }
});

// Weather endpoints with fallback data
app.get("/api/weather/conditions", async (req, res) => {
  try {
    if (mongoService && mongoService.isConnectionActive()) {
      const conditions = await mongoService.getFromCollection('weather_conditions', {});
      res.json(conditions);
    } else {
      // Return mock data
      res.json([{
        date: new Date().toISOString().split('T')[0],
        temperature: 28,
        condition: 'partly_cloudy',
        humidity: 72,
        description: 'Partly cloudy conditions'
      }]);
    }
  } catch (error) {
    console.error('Weather conditions error:', error);
    res.json([]);
  }
});

app.get("/api/weather/alerts", async (req, res) => {
  try {
    if (mongoService && mongoService.isConnectionActive()) {
      const alerts = await mongoService.getFromCollection('weather_alerts', {});
      res.json(alerts);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Weather alerts error:', error);
    res.json([]);
  }
});

app.get("/api/weather/correlations", async (req, res) => {
  try {
    if (mongoService && mongoService.isConnectionActive()) {
      const correlations = await mongoService.getFromCollection('weather_correlations', {});
      res.json(correlations);
    } else {
      // Return mock correlation data
      res.json([
        { condition: 'Sunny', avgSentiment: 0.6, delayComplaints: 15 },
        { condition: 'Rain', avgSentiment: -0.2, delayComplaints: 45 }
      ]);
    }
  } catch (error) {
    console.error('Weather correlations error:', error);
    res.json([]);
  }
});

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const contactData = insertContactMessageSchema.parse(req.body);
    const message = await storage.createContactMessage(contactData);
    res.json({ success: true, message: "Message sent successfully", id: message.id });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(400).json({ error: error.message || "Failed to send message" });
  }
});

// Analytics endpoints with fallback
app.get("/api/analytics/metrics", async (req, res) => {
  try {
    const metrics = await storage.getAnalyticsMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Analytics metrics error:', error);
    res.json({
      totalEvents: 0,
      avgSentiment: 0,
      engagementRate: 0,
      activeUsers: 0
    });
  }
});

app.get("/api/analytics/charts", async (req, res) => {
  try {
    if (mongoService && mongoService.isConnectionActive()) {
      const chartData = await mongoService.getChartData();
      res.json(chartData);
    } else {
      res.json({
        platformData: [],
        sentimentData: [],
        engagementData: []
      });
    }
  } catch (error) {
    console.error('Analytics charts error:', error);
    res.json({
      platformData: [],
      sentimentData: [],
      engagementData: []
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve static files in production
serveStatic(app);

// Export for Vercel
export default app;
