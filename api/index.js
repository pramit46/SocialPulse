import dotenv from "dotenv";
import express from "express";
import { registerRoutes } from "../server/routes.js";
import { serveStatic } from "../server/vite.js";

// Load environment variables
dotenv.config();

// Create express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
await registerRoutes(app);

// Serve static files in production
serveStatic(app);

// Export for Vercel
export default app;
