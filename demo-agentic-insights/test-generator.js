import { AgenticInsightSystem } from './insight-generator.js';

/**
 * Test harness for the Agentic Insight System
 * Demonstrates capabilities with sample data scenarios
 */

class InsightSystemTester {
  constructor() {
    this.system = new AgenticInsightSystem();
  }

  // Test with simulated social media data patterns
  async testWithSampleData() {
    console.log('🧪 Testing Agentic Insight System with Sample Data Scenarios\n');

    // Simulate different data scenarios
    const testScenarios = [
      {
        name: 'High Negative Sentiment on Baggage Handling',
        data: this.createBaggageIssueScenario()
      },
      {
        name: 'Positive Lounge Feedback Opportunity', 
        data: this.createLoungeOpportunityScenario()
      },
      {
        name: 'Mixed Security Process Feedback',
        data: this.createSecurityMixedScenario()
      }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n🔍 Testing Scenario: ${scenario.name}`);
      console.log('='.repeat(60));
      
      const insights = await this.analyzeScenario(scenario.data);
      
      insights.forEach((insight, index) => {
        console.log(`\n${index + 1}. ${insight.title}`);
        console.log(`   Type: ${insight.type} | Color: ${insight.color}`);
        console.log(`   Description: ${insight.description}`);
        console.log(`   Action: ${insight.actionText}`);
      });
    }
  }

  createBaggageIssueScenario() {
    return [
      {
        platform: 'Twitter',
        clean_event_text: 'Lost my baggage at Bangalore airport with SpiceJet. Very disappointing service.',
        sentiment_analysis: { overall_sentiment: -0.8 },
        timestamp_utc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        engagement_metrics: { likes: 15, comments: 8, shares: 5 }
      },
      {
        platform: 'Reddit',
        clean_event_text: 'Baggage handling at BLR airport is terrible. My bag was damaged by SpiceJet ground staff.',
        sentiment_analysis: { overall_sentiment: -0.9 },
        timestamp_utc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        engagement_metrics: { likes: 25, comments: 12, shares: 3 }
      },
      {
        platform: 'Facebook',
        clean_event_text: 'SpiceJet baggage claim took 2 hours at Bangalore airport. Unacceptable!',
        sentiment_analysis: { overall_sentiment: -0.7 },
        timestamp_utc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        engagement_metrics: { likes: 8, comments: 15, shares: 7 }
      }
    ];
  }

  createLoungeOpportunityScenario() {
    return [
      {
        platform: 'Twitter',
        clean_event_text: 'Vistara lounge at Bangalore airport is amazing! Great food and service.',
        sentiment_analysis: { overall_sentiment: 0.9 },
        timestamp_utc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        engagement_metrics: { likes: 45, comments: 12, shares: 18 }
      },
      {
        platform: 'Instagram', 
        clean_event_text: 'Best lounge experience at BLR with Vistara. Highly recommend premium services.',
        sentiment_analysis: { overall_sentiment: 0.85 },
        timestamp_utc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        engagement_metrics: { likes: 67, comments: 8, shares: 12 }
      }
    ];
  }

  createSecurityMixedScenario() {
    return [
      {
        platform: 'Twitter',
        clean_event_text: 'Security at Bangalore airport was quick today, but staff could be more helpful.',
        sentiment_analysis: { overall_sentiment: 0.2 },
        timestamp_utc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        engagement_metrics: { likes: 12, comments: 5, shares: 2 }
      },
      {
        platform: 'Reddit',
        clean_event_text: 'BLR airport security checkpoint was efficient but queues were long.',
        sentiment_analysis: { overall_sentiment: 0.1 },
        timestamp_utc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        engagement_metrics: { likes: 18, comments: 7, shares: 1 }
      }
    ];
  }

  // Simulate insight generation for a scenario
  async analyzeScenario(events) {
    // Mock the analysis methods for testing
    const dataAnalysis = {
      totalEvents: events.length,
      recentEvents: events.length,
      sentimentTrends: {
        recent: events.reduce((sum, e) => sum + e.sentiment_analysis.overall_sentiment, 0) / events.length,
        previous: 0,
        weeklyChange: -0.3
      },
      categoryIssues: this.mockCategoryAnalysis(events),
      airlinePerformance: this.mockAirlineAnalysis(events),
      platformEngagement: this.mockPlatformAnalysis(events),
      timePatterns: { recent7Days: events.length, last30Days: events.length }
    };

    const patterns = await this.system.recognizePatterns(dataAnalysis);
    const insights = await this.system.generateInsights(patterns, dataAnalysis);
    const prioritized = await this.system.prioritizeInsights(insights);
    
    return prioritized;
  }

  mockCategoryAnalysis(events) {
    const analysis = {};
    
    // Check for baggage mentions
    const baggageEvents = events.filter(e => 
      e.clean_event_text.toLowerCase().includes('baggage') || 
      e.clean_event_text.toLowerCase().includes('bag')
    );
    if (baggageEvents.length > 0) {
      analysis.luggage_handling = {
        mentionCount: baggageEvents.length,
        averageSentiment: baggageEvents.reduce((sum, e) => sum + e.sentiment_analysis.overall_sentiment, 0) / baggageEvents.length,
        recentMentions: baggageEvents.length
      };
    }

    // Check for lounge mentions
    const loungeEvents = events.filter(e => 
      e.clean_event_text.toLowerCase().includes('lounge')
    );
    if (loungeEvents.length > 0) {
      analysis.lounge = {
        mentionCount: loungeEvents.length,
        averageSentiment: loungeEvents.reduce((sum, e) => sum + e.sentiment_analysis.overall_sentiment, 0) / loungeEvents.length,
        recentMentions: loungeEvents.length
      };
    }

    // Check for security mentions
    const securityEvents = events.filter(e => 
      e.clean_event_text.toLowerCase().includes('security')
    );
    if (securityEvents.length > 0) {
      analysis.security = {
        mentionCount: securityEvents.length,
        averageSentiment: securityEvents.reduce((sum, e) => sum + e.sentiment_analysis.overall_sentiment, 0) / securityEvents.length,
        recentMentions: securityEvents.length
      };
    }

    return analysis;
  }

  mockAirlineAnalysis(events) {
    const analysis = {};
    
    const spicejetEvents = events.filter(e => 
      e.clean_event_text.toLowerCase().includes('spicejet')
    );
    if (spicejetEvents.length > 0) {
      analysis.spicejet = {
        mentionCount: spicejetEvents.length,
        averageSentiment: spicejetEvents.reduce((sum, e) => sum + e.sentiment_analysis.overall_sentiment, 0) / spicejetEvents.length,
        recentMentions: spicejetEvents.length
      };
    }

    const vistaraEvents = events.filter(e => 
      e.clean_event_text.toLowerCase().includes('vistara')
    );
    if (vistaraEvents.length > 0) {
      analysis.vistara = {
        mentionCount: vistaraEvents.length,
        averageSentiment: vistaraEvents.reduce((sum, e) => sum + e.sentiment_analysis.overall_sentiment, 0) / vistaraEvents.length,
        recentMentions: vistaraEvents.length
      };
    }

    return analysis;
  }

  mockPlatformAnalysis(events) {
    const analysis = {};
    const platforms = [...new Set(events.map(e => e.platform))];

    platforms.forEach(platform => {
      const platformEvents = events.filter(e => e.platform === platform);
      const totalEngagement = platformEvents.reduce((sum, event) => {
        const metrics = event.engagement_metrics || {};
        return sum + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
      }, 0);

      analysis[platform] = {
        eventCount: platformEvents.length,
        totalEngagement,
        avgEngagement: totalEngagement / platformEvents.length || 0,
        avgSentiment: platformEvents.reduce((sum, e) => sum + e.sentiment_analysis.overall_sentiment, 0) / platformEvents.length
      };
    });

    return analysis;
  }
}

// Run tests
if (import.meta.url === new URL(import.meta.resolve(process.argv[1])).href) {
  const tester = new InsightSystemTester();
  
  tester.testWithSampleData()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      console.log('\n💡 This demonstrates how the agentic system would work with real MongoDB data.');
      console.log('The system can identify patterns, generate insights, and prioritize them for business action.');
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}