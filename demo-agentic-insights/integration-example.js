/**
 * Integration Example: How to integrate the Agentic Insight System
 * into the existing Bangalore Airport Analytics Platform
 */

import { AgenticInsightSystem } from './insight-generator.js';

/**
 * Example integration class showing how to use the system
 * in the existing Express.js application
 */
class InsightIntegration {
  constructor(mongoService, llmService) {
    this.mongoService = mongoService;
    this.llmService = llmService;
    this.insightSystem = new AgenticInsightSystem();
  }

  /**
   * Method to integrate into existing /api/insights endpoint
   */
  async getAIGeneratedInsights() {
    try {
      console.log('🤖 Generating AI insights from real social media data...');
      
      // Use the agentic system to generate insights
      const result = await this.insightSystem.generateActionableInsights();
      
      // Store generated insights in MongoDB for caching
      await this.cacheInsights(result.insights);
      
      // Return insights in the format expected by the dashboard
      return {
        success: true,
        insights: result.insights,
        metadata: result.metadata,
        generationType: 'ai_generated'
      };
      
    } catch (error) {
      console.error('❌ AI insight generation failed, falling back to stored insights:', error);
      
      // Fallback to existing insights if AI generation fails
      return await this.getFallbackInsights();
    }
  }

  /**
   * Cache generated insights in MongoDB for performance
   */
  async cacheInsights(insights) {
    try {
      if (this.mongoService && this.mongoService.isConnectionActive()) {
        // Clear old insights
        await this.mongoService.clearCollection('ai_insights');
        
        // Store new AI-generated insights with timestamp
        const insightsWithMetadata = insights.map(insight => ({
          ...insight,
          generated_at: new Date(),
          source: 'ai_agent',
          cached: true
        }));
        
        await this.mongoService.storeToCollection('ai_insights', insightsWithMetadata);
        console.log(`✅ Cached ${insights.length} AI-generated insights`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to cache AI insights:', error.message);
    }
  }

  /**
   * Fallback to stored insights if AI generation fails
   */
  async getFallbackInsights() {
    try {
      if (this.mongoService && this.mongoService.isConnectionActive()) {
        // Try to get cached AI insights first
        const cachedInsights = await this.mongoService.getFromCollection('ai_insights', {});
        if (cachedInsights.length > 0) {
          return {
            success: true,
            insights: cachedInsights,
            source: 'cached_ai',
            fallback: true
          };
        }
        
        // Fallback to traditional insights
        const traditionaInsights = await this.mongoService.getInsights();
        return {
          success: true,
          insights: traditionaInsights,
          source: 'traditional',
          fallback: true
        };
      }
      
      return { success: false, error: 'No insights available' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule periodic insight generation (for production use)
   */
  startScheduledGeneration(intervalMinutes = 60) {
    console.log(`🕐 Starting scheduled insight generation every ${intervalMinutes} minutes`);
    
    const generateInsights = async () => {
      try {
        await this.getAIGeneratedInsights();
        console.log(`✅ Scheduled insights generated at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('❌ Scheduled insight generation failed:', error);
      }
    };

    // Generate immediately
    generateInsights();
    
    // Then schedule regular generation
    return setInterval(generateInsights, intervalMinutes * 60 * 1000);
  }

  /**
   * Manual trigger for insight generation (for admin use)
   */
  async triggerInsightGeneration(req, res) {
    try {
      const result = await this.getAIGeneratedInsights();
      
      res.json({
        success: true,
        message: 'AI insights generated successfully',
        insights: result.insights,
        metadata: result.metadata,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI insights',
        details: error.message
      });
    }
  }
}

/**
 * Example Express.js route integration
 */
function integrateWithExpress(app, mongoService, llmService) {
  const integration = new InsightIntegration(mongoService, llmService);

  // Modified insights endpoint to use AI generation
  app.get("/api/insights", async (req, res) => {
    try {
      const result = await integration.getAIGeneratedInsights();
      res.json(result.insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI insights" });
    }
  });

  // New endpoint for manual AI insight generation
  app.post("/api/insights/generate", async (req, res) => {
    await integration.triggerInsightGeneration(req, res);
  });

  // New endpoint to get insight metadata
  app.get("/api/insights/metadata", async (req, res) => {
    try {
      const result = await integration.getAIGeneratedInsights();
      res.json(result.metadata);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch insight metadata" });
    }
  });

  // Start scheduled generation for production
  if (process.env.NODE_ENV === 'production') {
    integration.startScheduledGeneration(30); // Every 30 minutes
  }

  return integration;
}

/**
 * Configuration for different deployment environments
 */
const deploymentConfig = {
  development: {
    scheduledGeneration: false,
    cacheLifetime: 5, // minutes
    fallbackEnabled: true
  },
  
  staging: {
    scheduledGeneration: true,
    scheduleInterval: 15, // minutes
    cacheLifetime: 10,
    fallbackEnabled: true
  },
  
  production: {
    scheduledGeneration: true,
    scheduleInterval: 30, // minutes  
    cacheLifetime: 30,
    fallbackEnabled: true,
    enableMonitoring: true
  }
};

/**
 * Performance monitoring for insight generation
 */
class InsightPerformanceMonitor {
  constructor() {
    this.metrics = {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      averageGenerationTime: 0,
      lastGeneration: null
    };
  }

  recordGeneration(startTime, success, insightCount = 0) {
    const duration = Date.now() - startTime;
    
    this.metrics.totalGenerations++;
    if (success) {
      this.metrics.successfulGenerations++;
    } else {
      this.metrics.failedGenerations++;
    }
    
    this.metrics.averageGenerationTime = 
      (this.metrics.averageGenerationTime + duration) / 2;
    
    this.metrics.lastGeneration = {
      timestamp: new Date().toISOString(),
      duration,
      success,
      insightCount
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulGenerations / this.metrics.totalGenerations * 100).toFixed(1)
    };
  }
}

export { 
  InsightIntegration, 
  integrateWithExpress, 
  deploymentConfig,
  InsightPerformanceMonitor
};