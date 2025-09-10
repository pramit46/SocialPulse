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

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const contactData = insertContactMessageSchema.parse(req.body);
    const message = await storage.createContactMessage(contactData);
    res.json({ success: true, message: "Message sent successfully", id: message.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get insights (simplified version)
app.get("/api/insights", async (req, res) => {
  try {
    const insights = await mongoService.getInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// Get social events
app.get("/api/social-events", async (req, res) => {
  try {
    const events = await storage.getSocialEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch social events" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve static files in production
serveStatic(app);

// Export for Vercel
export default app;
