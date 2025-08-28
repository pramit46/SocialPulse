import { AgentManager } from './agents/agent-manager.js';

export class TestServices {
  private agentManager: AgentManager;

  constructor() {
    this.agentManager = new AgentManager();
  }

  async testAllCollectors(): Promise<any> {
    const results = {
      social_media: {},
      news: {},
      summary: {
        total_tested: 0,
        successful: 0,
        failed: 0,
        no_credentials: 0
      }
    };

    // Social Media Tests
    const socialSources = ['twitter', 'reddit', 'facebook'];
    for (const source of socialSources) {
      try {
        results.summary.total_tested++;
        
        // Check if credentials are available
        if (!this.agentManager.validateCredentials(source)) {
          console.log(`⚠️ [${source.toUpperCase()}] No valid credentials available, skipping test`);
          results.social_media[source] = {
            status: 'no_credentials',
            message: 'API credentials not available',
            timestamp: new Date().toISOString()
          };
          results.summary.no_credentials++;
          continue;
        }

        console.log(`🧪 Testing ${source} collector...`);
        const events = await this.agentManager.collectData(source);
        
        results.social_media[source] = {
          status: 'success',
          events_collected: events.length,
          last_test: new Date().toISOString(),
          sample_event: events[0] || null
        };
        results.summary.successful++;
        console.log(`✅ [${source.toUpperCase()}] Test successful - ${events.length} events collected`);
        
      } catch (error) {
        console.error(`❌ [${source.toUpperCase()}] Test failed:`, error);
        results.social_media[source] = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          last_test: new Date().toISOString()
        };
        results.summary.failed++;
      }
    }

    // News Sources Tests (RSS-based)
    const newsSources = [
      { key: 'cnn', rss: 'http://rss.cnn.com/rss/edition.rss' },
      { key: 'inshorts', rss: null } // No RSS available
    ];

    for (const newsSource of newsSources) {
      try {
        results.summary.total_tested++;

        if (!newsSource.rss) {
          console.log(`⚠️ [${newsSource.key.toUpperCase()}] No RSS feed available, skipping test`);
          results.news[newsSource.key] = {
            status: 'no_rss',
            message: 'RSS feed not available for this source',
            timestamp: new Date().toISOString()
          };
          results.summary.no_credentials++;
          continue;
        }

        console.log(`🧪 Testing ${newsSource.key} RSS collector...`);
        
        // Test RSS feed accessibility
        const axios = (await import('axios')).default;
        const response = await axios.get(newsSource.rss, {
          timeout: 10000,
          headers: { 'User-Agent': 'BLRAnalytics/1.0' }
        });

        if (response.status === 200) {
          results.news[newsSource.key] = {
            status: 'success',
            rss_url: newsSource.rss,
            response_size: response.data.length,
            last_test: new Date().toISOString()
          };
          results.summary.successful++;
          console.log(`✅ [${newsSource.key.toUpperCase()}] RSS feed accessible`);
        }

      } catch (error) {
        console.error(`❌ [${newsSource.key.toUpperCase()}] RSS test failed:`, error);
        results.news[newsSource.key] = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          last_test: new Date().toISOString()
        };
        results.summary.failed++;
      }
    }

    // Log summary
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tested: ${results.summary.total_tested}`);
    console.log(`   Successful: ${results.summary.successful}`);
    console.log(`   Failed: ${results.summary.failed}`);
    console.log(`   No Credentials: ${results.summary.no_credentials}`);

    return results;
  }

  async scheduleCollectors(): Promise<void> {
    // Schedule collectors to run every hour
    const cron = (await import('node-cron')).default;
    
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Starting scheduled data collection (hourly)...');
      
      try {
        const sources = ['twitter', 'reddit', 'facebook'];
        const query = "bangalore airport OR bengaluru airport OR kempegowda airport OR indigo OR spicejet OR air india OR vistara";
        
        for (const source of sources) {
          if (this.agentManager.validateCredentials(source)) {
            try {
              const events = await this.agentManager.collectData(source, query);
              console.log(`✅ Scheduled collection: ${source} - ${events.length} events`);
            } catch (error) {
              console.error(`❌ Scheduled collection failed for ${source}:`, error);
            }
          } else {
            console.log(`⚠️ Skipping ${source} - no valid credentials`);
          }
        }
      } catch (error) {
        console.error('❌ Scheduled collection error:', error);
      }
    });

    console.log('⏰ Data collectors scheduled to run every hour');
  }
}

export const testServices = new TestServices();