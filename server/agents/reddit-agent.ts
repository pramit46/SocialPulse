import axios from 'axios';
import { BaseAgent } from './base-agent';
import { InsertSocialEvent } from '@shared/schema';

export class RedditAgent extends BaseAgent {
  constructor(credentials?: any) {
    super(credentials);
  }

  validateCredentials(): boolean {
    // Check both passed credentials and environment variables
    const clientId = this.credentials?.reddit_client_id || process.env.REDDIT_CLIENT_ID;
    const clientSecret = this.credentials?.reddit_client_secret || process.env.REDDIT_CLIENT_SECRET;
    return !!(clientId && clientSecret);
  }

  async collectData(query: string): Promise<InsertSocialEvent[]> {
    if (!this.validateCredentials()) {
      throw new Error('Reddit credentials are required');
    }

    try {
      console.log('📡 Starting comprehensive Reddit data collection...');
      
      // Get Reddit access token  
      const clientId = this.credentials?.reddit_client_id || process.env.REDDIT_CLIENT_ID;
      const clientSecret = this.credentials?.reddit_client_secret || process.env.REDDIT_CLIENT_SECRET;
      
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const authResponse = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials&scope=read',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'BangaloreAirportAnalytics/1.0'
          }
        }
      );

      const accessToken = authResponse.data.access_token;
      console.log('✅ Reddit access token obtained');

      // Enhanced search terms for comprehensive coverage
      const searches = [
        'Bangalore airport OR Bengaluru airport OR Kempegowda airport OR BLR airport',
        'IndiGo Bangalore OR Indigo Bengaluru OR 6E Bangalore',
        'SpiceJet Bangalore OR SpiceJet Bengaluru',
        'Air India Bangalore OR Air India Bengaluru',
        'Vistara Bangalore OR Vistara Bengaluru',
        query // Include original query
      ];

      const allPosts = [];
      let totalProcessed = 0;

      for (const searchTerm of searches) {
        console.log(`🔍 Searching Reddit for: "${searchTerm}"`);
        
        try {
          const response = await axios.get(`https://oauth.reddit.com/search?q=${encodeURIComponent(searchTerm)}&type=link&sort=new&limit=20`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'BangaloreAirportAnalytics/1.0'
            }
          });

          if (response.data?.data?.children) {
            const posts = response.data.data.children;
            allPosts.push(...posts);
            console.log(`   Found ${posts.length} posts for "${searchTerm}"`);
          }
        } catch (searchError) {
          console.warn(`⚠️ Search failed for "${searchTerm}":`, searchError.message);
        }
      }

      console.log(`📊 Total Reddit posts collected: ${allPosts.length}`);
      
      const events: InsertSocialEvent[] = [];
      
      for (const post of allPosts) {
        const postData = post.data;
        totalProcessed++;
        
        console.log(`📝 Processing post ${totalProcessed}/${allPosts.length}: "${(postData.title || '').substring(0, 50)}..."`);
        
        const eventText = postData.selftext || postData.title || '';
        
        // Enhanced sentiment analysis with error handling
        let sentimentResult = null;
        try {
          sentimentResult = await this.analyzeSentiment(eventText);
          console.log(`✅ Sentiment analyzed for post ${totalProcessed}`);
        } catch (sentError) {
          console.warn(`⚠️ Sentiment analysis failed for post ${totalProcessed}:`, sentError.message);
          sentimentResult = {
            overall_sentiment: 0,
            sentiment_score: 0.5,
            categories: {
              ease_of_booking: null,
              check_in: null,
              luggage_handling: null,
              security: null,
              lounge: null,
              amenities: null,
              communication: null
            }
          };
        }
        
        const eventData: InsertSocialEvent = {
          author_id: postData.author || null,
          author_name: postData.author || null,
          clean_event_text: this.cleanText(eventText),
          engagement_metrics: {
            comments: postData.num_comments || 0,
            likes: postData.ups || 0,
            shares: 0, // Reddit doesn't have shares
          },
          event_content: eventText,
          event_id: postData.id || null,
          event_title: postData.title || null,
          event_url: `https://reddit.com${postData.permalink}`,
          parent_event_id: null,
          platform: 'Reddit',
          timestamp_utc: new Date(postData.created_utc * 1000).toISOString(),
          sentiment_analysis: sentimentResult,
          location_focus: this.extractLocationFocus(eventText),
          airline_mentioned: this.extractAirlineMention(eventText),
        };
        
        events.push(eventData);
        console.log(`✅ Processed post ${totalProcessed}/${allPosts.length} (${postData.id})`);
      }

      console.log(`📊 Reddit collection completed:\n   ✅ Successfully processed: ${events.length} posts\n   📈 Success rate: ${(events.length / allPosts.length * 100).toFixed(1)}%`);

      // Store collected events
      await this.storeCollectedEvents('reddit', events);
      
      return events;
    } catch (error) {
      console.error('❌ Reddit data collection error:', error);
      throw new Error('Failed to collect Reddit data');
    }
  }
}