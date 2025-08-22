import { MongoClient } from 'mongodb';
import { subDays, format, isAfter } from 'date-fns';

/**
 * Agentic AI System for Generating Actionable Insights
 * Analyzes real social media data and generates business insights
 */
class AgenticInsightSystem {
  constructor() {
    this.mongoClient = null;
    this.db = null;
    this.insights = [];
    this.currentId = 1;
  }

  // Connect to MongoDB (using same connection as main app)
  async connect() {
    try {
      // Use environment variables like the main app
      const connectionString = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017';
      const dbName = process.env.MONGODB_DATABASE_NAME || 'social_analytics';
      
      this.mongoClient = new MongoClient(connectionString);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(dbName);
      console.log('✅ Connected to MongoDB for insight generation');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }

  // **AGENT 1: DATA ANALYZER**
  // Aggregates and analyzes social media data patterns
  async analyzeDataPatterns() {
    console.log('🔍 Data Analyzer Agent: Processing social media data...');
    
    const last7Days = subDays(new Date(), 7);
    const last30Days = subDays(new Date(), 30);
    
    // Get all social events from different platforms
    const platforms = ['twitter', 'reddit', 'facebook', 'cnn', 'wion', 'inshorts'];
    const allEvents = [];
    
    for (const platform of platforms) {
      try {
        const collection = this.db.collection(platform);
        const events = await collection.find({
          timestamp_utc: { $gte: last30Days.toISOString() }
        }).toArray();
        allEvents.push(...events);
      } catch (error) {
        console.log(`⚠️ Platform ${platform} not accessible:`, error.message);
      }
    }

    console.log(`📊 Analyzed ${allEvents.length} social media events from last 30 days`);
    return this.processEventsData(allEvents, last7Days, last30Days);
  }

  processEventsData(events, last7Days, last30Days) {
    const analysis = {
      totalEvents: events.length,
      recentEvents: events.filter(e => new Date(e.timestamp_utc || e.created_at) > last7Days).length,
      
      // Sentiment analysis
      sentimentTrends: this.analyzeSentimentTrends(events, last7Days),
      
      // Category-specific analysis
      categoryIssues: this.analyzeCategoryIssues(events),
      
      // Airline-specific analysis  
      airlinePerformance: this.analyzeAirlinePerformance(events),
      
      // Platform engagement
      platformEngagement: this.analyzePlatformEngagement(events),
      
      // Time-based patterns
      timePatterns: this.analyzeTimePatterns(events, last7Days, last30Days)
    };
    
    return analysis;
  }

  // **AGENT 2: PATTERN RECOGNITION**
  // Identifies trends, anomalies, and critical issues
  async recognizePatterns(dataAnalysis) {
    console.log('🧠 Pattern Recognition Agent: Identifying critical patterns...');
    
    const patterns = {
      criticalIssues: [],
      opportunities: [],
      trendingTopics: [],
      performanceAlerts: []
    };

    // Detect sentiment drops
    if (dataAnalysis.sentimentTrends.weeklyChange < -0.2) {
      patterns.criticalIssues.push({
        type: 'sentiment_drop',
        severity: 'high',
        category: 'overall_sentiment',
        change: dataAnalysis.sentimentTrends.weeklyChange,
        description: `Overall sentiment dropped by ${Math.abs(dataAnalysis.sentimentTrends.weeklyChange * 100).toFixed(1)}% in the last week`
      });
    }

    // Analyze category-specific issues
    Object.entries(dataAnalysis.categoryIssues).forEach(([category, data]) => {
      if (data.averageSentiment < -0.3 && data.mentionCount > 5) {
        patterns.criticalIssues.push({
          type: 'category_issue',
          severity: data.averageSentiment < -0.5 ? 'high' : 'medium',
          category,
          sentiment: data.averageSentiment,
          mentions: data.mentionCount,
          description: `${category.replace('_', ' ')} showing negative sentiment (-${Math.abs(data.averageSentiment * 100).toFixed(0)}%) with ${data.mentionCount} mentions`
        });
      }
    });

    // Identify opportunities
    Object.entries(dataAnalysis.categoryIssues).forEach(([category, data]) => {
      if (data.averageSentiment > 0.5 && data.mentionCount > 3) {
        patterns.opportunities.push({
          type: 'positive_category',
          category,
          sentiment: data.averageSentiment,
          mentions: data.mentionCount,
          description: `${category.replace('_', ' ')} receiving highly positive feedback (+${(data.averageSentiment * 100).toFixed(0)}%)`
        });
      }
    });

    // Airline performance alerts
    Object.entries(dataAnalysis.airlinePerformance).forEach(([airline, data]) => {
      if (data.averageSentiment < -0.3 && data.mentionCount > 3) {
        patterns.performanceAlerts.push({
          type: 'airline_issue',
          airline,
          severity: data.averageSentiment < -0.5 ? 'high' : 'medium',
          sentiment: data.averageSentiment,
          mentions: data.mentionCount,
          description: `${airline} showing concerning sentiment trends (-${Math.abs(data.averageSentiment * 100).toFixed(0)}%)`
        });
      }
    });

    return patterns;
  }

  // **AGENT 3: INSIGHT GENERATOR**
  // Creates specific, actionable business recommendations
  async generateInsights(patterns, dataAnalysis) {
    console.log('💡 Insight Generator Agent: Creating actionable recommendations...');
    
    const insights = [];

    // Generate insights from critical issues
    patterns.criticalIssues.forEach(issue => {
      const insight = this.createCriticalIssueInsight(issue, dataAnalysis);
      if (insight) insights.push(insight);
    });

    // Generate insights from opportunities
    patterns.opportunities.forEach(opportunity => {
      const insight = this.createOpportunityInsight(opportunity, dataAnalysis);
      if (insight) insights.push(insight);
    });

    // Generate insights from performance alerts
    patterns.performanceAlerts.forEach(alert => {
      const insight = this.createPerformanceInsight(alert, dataAnalysis);
      if (insight) insights.push(insight);
    });

    // Add strategic insights based on overall trends
    const strategicInsight = this.createStrategicInsight(dataAnalysis, patterns);
    if (strategicInsight) insights.push(strategicInsight);

    return insights;
  }

  // **AGENT 4: PRIORITY SCORER**
  // Determines urgency and business impact of insights
  async prioritizeInsights(insights) {
    console.log('⚖️ Priority Scorer Agent: Calculating business impact scores...');
    
    return insights.map(insight => {
      const priority = this.calculatePriorityScore(insight);
      return {
        ...insight,
        priority,
        businessImpact: this.assessBusinessImpact(insight),
        urgency: this.assessUrgency(insight)
      };
    }).sort((a, b) => b.priority - a.priority);
  }

  // === INSIGHT CREATION METHODS ===
  
  createCriticalIssueInsight(issue, dataAnalysis) {
    const insightTemplates = {
      'sentiment_drop': {
        type: 'optimization',
        color: 'red',
        title: 'Address Overall Sentiment Decline',
        actionText: 'Investigate Now'
      },
      'category_issue': {
        type: 'optimization', 
        color: issue.severity === 'high' ? 'red' : 'yellow',
        title: `Improve ${this.formatCategory(issue.category)}`,
        actionText: 'View Details'
      }
    };

    const template = insightTemplates[issue.type];
    if (!template) return null;

    return {
      id: (this.currentId++).toString(),
      type: template.type,
      title: template.title,
      description: this.generateDescription(issue, dataAnalysis),
      actionText: template.actionText,
      color: template.color,
      rawData: issue
    };
  }

  createOpportunityInsight(opportunity, dataAnalysis) {
    return {
      id: (this.currentId++).toString(),
      type: 'strategy',
      title: `Leverage ${this.formatCategory(opportunity.category)} Excellence`,
      description: `${this.formatCategory(opportunity.category)} receiving ${opportunity.sentiment > 0.7 ? 'exceptional' : 'strong'} positive feedback (+${(opportunity.sentiment * 100).toFixed(0)}%). Consider highlighting this service in marketing campaigns and passenger communications.`,
      actionText: 'Implement Strategy',
      color: 'green',
      rawData: opportunity
    };
  }

  createPerformanceInsight(alert, dataAnalysis) {
    const severity = alert.severity === 'high' ? 'critical' : 'concerning';
    return {
      id: (this.currentId++).toString(),
      type: 'optimization',
      title: `Address ${this.formatAirline(alert.airline)} Service Issues`,
      description: `${this.formatAirline(alert.airline)} showing ${severity} sentiment trends (-${Math.abs(alert.sentiment * 100).toFixed(0)}%) across ${alert.mentions} mentions. Immediate service quality review recommended.`,
      actionText: 'Review Performance',
      color: alert.severity === 'high' ? 'red' : 'yellow',
      rawData: alert
    };
  }

  createStrategicInsight(dataAnalysis, patterns) {
    // Analyze overall engagement trends
    const totalEngagement = Object.values(dataAnalysis.platformEngagement).reduce((sum, platform) => sum + platform.totalEngagement, 0);
    const avgEngagement = totalEngagement / Object.keys(dataAnalysis.platformEngagement).length;

    if (avgEngagement > 100) {
      return {
        id: (this.currentId++).toString(),
        type: 'engagement',
        title: 'Capitalize on High Social Engagement',
        description: `Social media engagement is ${avgEngagement > 200 ? 'exceptionally' : 'significantly'} high (${avgEngagement.toFixed(0)} avg interactions). Optimize content strategy and response times to maximize passenger communication effectiveness.`,
        actionText: 'Optimize Strategy',
        color: 'blue',
        rawData: { totalEngagement, avgEngagement }
      };
    }
    
    return null;
  }

  // === ANALYSIS HELPER METHODS ===

  analyzeSentimentTrends(events, last7Days) {
    const recentEvents = events.filter(e => new Date(e.timestamp_utc || e.created_at) > last7Days);
    const olderEvents = events.filter(e => new Date(e.timestamp_utc || e.created_at) <= last7Days);
    
    const recentSentiment = this.calculateAverageSentiment(recentEvents);
    const olderSentiment = this.calculateAverageSentiment(olderEvents);
    
    return {
      recent: recentSentiment,
      previous: olderSentiment,
      weeklyChange: recentSentiment - olderSentiment
    };
  }

  analyzeCategoryIssues(events) {
    const categories = ['luggage_handling', 'security', 'check_in', 'lounge', 'amenities', 'communication'];
    const categoryAnalysis = {};

    categories.forEach(category => {
      const relevantEvents = events.filter(event => {
        const text = (event.clean_event_text || event.event_content || '').toLowerCase();
        const categoryKeywords = this.getCategoryKeywords(category);
        return categoryKeywords.some(keyword => text.includes(keyword));
      });

      if (relevantEvents.length > 0) {
        categoryAnalysis[category] = {
          mentionCount: relevantEvents.length,
          averageSentiment: this.calculateAverageSentiment(relevantEvents),
          recentMentions: relevantEvents.filter(e => 
            new Date(e.timestamp_utc || e.created_at) > subDays(new Date(), 7)
          ).length
        };
      }
    });

    return categoryAnalysis;
  }

  analyzeAirlinePerformance(events) {
    const airlines = ['indigo', 'spicejet', 'air_india', 'vistara'];
    const airlineAnalysis = {};

    airlines.forEach(airline => {
      const relevantEvents = events.filter(event => {
        const text = (event.clean_event_text || event.event_content || '').toLowerCase();
        const airlineKeywords = this.getAirlineKeywords(airline);
        return airlineKeywords.some(keyword => text.includes(keyword));
      });

      if (relevantEvents.length > 0) {
        airlineAnalysis[airline] = {
          mentionCount: relevantEvents.length,
          averageSentiment: this.calculateAverageSentiment(relevantEvents),
          recentMentions: relevantEvents.filter(e => 
            new Date(e.timestamp_utc || e.created_at) > subDays(new Date(), 7)
          ).length
        };
      }
    });

    return airlineAnalysis;
  }

  analyzePlatformEngagement(events) {
    const platformAnalysis = {};
    const platforms = [...new Set(events.map(e => e.platform))];

    platforms.forEach(platform => {
      const platformEvents = events.filter(e => e.platform === platform);
      const totalEngagement = platformEvents.reduce((sum, event) => {
        const metrics = event.engagement_metrics || {};
        return sum + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
      }, 0);

      platformAnalysis[platform] = {
        eventCount: platformEvents.length,
        totalEngagement,
        avgEngagement: totalEngagement / platformEvents.length || 0,
        avgSentiment: this.calculateAverageSentiment(platformEvents)
      };
    });

    return platformAnalysis;
  }

  analyzeTimePatterns(events, last7Days, last30Days) {
    return {
      recent7Days: events.filter(e => new Date(e.timestamp_utc || e.created_at) > last7Days).length,
      last30Days: events.length,
      growthRate: (events.filter(e => new Date(e.timestamp_utc || e.created_at) > last7Days).length / events.length * 100).toFixed(1)
    };
  }

  // === UTILITY METHODS ===

  calculateAverageSentiment(events) {
    if (events.length === 0) return 0;
    
    const sentimentSum = events.reduce((sum, event) => {
      return sum + (event.sentiment_analysis?.overall_sentiment || 0);
    }, 0);
    
    return sentimentSum / events.length;
  }

  calculatePriorityScore(insight) {
    let score = 0;
    
    // Color-based urgency
    const colorScores = { red: 100, yellow: 70, blue: 50, green: 30 };
    score += colorScores[insight.color] || 0;
    
    // Type-based importance
    const typeScores = { optimization: 80, strategy: 60, engagement: 40 };
    score += typeScores[insight.type] || 0;
    
    // Raw data impact
    if (insight.rawData) {
      if (insight.rawData.severity === 'high') score += 50;
      if (insight.rawData.mentions > 10) score += 30;
      if (Math.abs(insight.rawData.sentiment || 0) > 0.5) score += 20;
    }
    
    return score;
  }

  assessBusinessImpact(insight) {
    if (insight.color === 'red') return 'High';
    if (insight.color === 'yellow') return 'Medium';
    if (insight.color === 'blue') return 'Medium';
    return 'Low';
  }

  assessUrgency(insight) {
    if (insight.type === 'optimization' && insight.color === 'red') return 'Immediate';
    if (insight.color === 'red') return 'High';
    if (insight.color === 'yellow') return 'Medium';
    return 'Low';
  }

  getCategoryKeywords(category) {
    const keywords = {
      luggage_handling: ['baggage', 'luggage', 'bag', 'lost bag', 'damaged bag', 'bag claim'],
      security: ['security', 'checkpoint', 'screening', 'queue', 'wait time'],
      check_in: ['check in', 'checkin', 'counter', 'kiosk', 'boarding pass'],
      lounge: ['lounge', 'premium', 'business class', 'vip'],
      amenities: ['wifi', 'food', 'restaurant', 'shop', 'facility', 'clean'],
      communication: ['staff', 'service', 'help', 'information', 'announcement']
    };
    return keywords[category] || [];
  }

  getAirlineKeywords(airline) {
    const keywords = {
      indigo: ['indigo', '6e', 'indigo airline'],
      spicejet: ['spicejet', 'spice jet', 'sg'],
      air_india: ['air india', 'airindia', 'ai'],
      vistara: ['vistara', 'uk']
    };
    return keywords[airline] || [];
  }

  formatCategory(category) {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatAirline(airline) {
    const airlineNames = {
      indigo: 'IndiGo',
      spicejet: 'SpiceJet', 
      air_india: 'Air India',
      vistara: 'Vistara'
    };
    return airlineNames[airline] || airline;
  }

  generateDescription(issue, dataAnalysis) {
    switch (issue.type) {
      case 'sentiment_drop':
        return `Overall passenger sentiment has declined by ${Math.abs(issue.change * 100).toFixed(1)}% in recent days. This requires immediate attention to identify root causes and implement corrective measures.`;
      
      case 'category_issue':
        const categoryName = this.formatCategory(issue.category);
        return `${categoryName} showing negative sentiment (-${Math.abs(issue.sentiment * 100).toFixed(0)}%) across ${issue.mentions} recent mentions. Immediate service quality review and improvement initiatives recommended.`;
      
      default:
        return issue.description;
    }
  }

  // === MAIN ORCHESTRATION METHOD ===
  async generateActionableInsights() {
    try {
      console.log('🚀 Starting Agentic AI Insight Generation System...\n');
      
      await this.connect();
      
      // Agent 1: Analyze data patterns
      const dataAnalysis = await this.analyzeDataPatterns();
      
      // Agent 2: Recognize patterns and issues
      const patterns = await this.recognizePatterns(dataAnalysis);
      
      // Agent 3: Generate specific insights
      const insights = await this.generateInsights(patterns, dataAnalysis);
      
      // Agent 4: Prioritize based on business impact
      const prioritizedInsights = await this.prioritizeInsights(insights);
      
      console.log(`\n✅ Generated ${prioritizedInsights.length} actionable insights`);
      
      return {
        insights: prioritizedInsights.slice(0, 5), // Top 5 insights
        metadata: {
          totalEventsAnalyzed: dataAnalysis.totalEvents,
          recentEvents: dataAnalysis.recentEvents,
          analysisTimestamp: new Date().toISOString(),
          generationMethod: 'agentic_ai'
        }
      };
      
    } catch (error) {
      console.error('❌ Insight generation failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// === EXECUTION ===
if (import.meta.url === new URL(import.meta.resolve(process.argv[1])).href) {
  const insightSystem = new AgenticInsightSystem();
  
  insightSystem.generateActionableInsights()
    .then(result => {
      console.log('\n📊 GENERATED INSIGHTS:');
      console.log('='.repeat(50));
      
      result.insights.forEach((insight, index) => {
        console.log(`\n${index + 1}. ${insight.title}`);
        console.log(`   Type: ${insight.type} | Color: ${insight.color} | Priority: ${insight.priority}`);
        console.log(`   Description: ${insight.description}`);
        console.log(`   Action: ${insight.actionText}`);
        console.log(`   Business Impact: ${insight.businessImpact} | Urgency: ${insight.urgency}`);
      });
      
      console.log('\n📈 ANALYSIS METADATA:');
      console.log('='.repeat(50));
      console.log(`Total Events Analyzed: ${result.metadata.totalEventsAnalyzed}`);
      console.log(`Recent Events (7 days): ${result.metadata.recentEvents}`);
      console.log(`Analysis Timestamp: ${result.metadata.analysisTimestamp}`);
      console.log(`Generation Method: ${result.metadata.generationMethod}`);
      
      console.log('\n🔗 INTEGRATION FORMAT (Ready for Dashboard):');
      console.log('='.repeat(50));
      console.log(JSON.stringify(result.insights, null, 2));
    })
    .catch(error => {
      console.error('💥 System failed:', error);
      process.exit(1);
    });
}

export { AgenticInsightSystem };