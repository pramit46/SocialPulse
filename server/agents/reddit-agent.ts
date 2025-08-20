import axios from 'axios';
import { BaseAgent } from './base-agent';
import { InsertSocialEvent } from '@shared/schema';

export class RedditAgent extends BaseAgent {
  constructor(credentials?: any) {
    super(credentials);
  }

  validateCredentials(): boolean {
    return !!(this.credentials.reddit_client_id && this.credentials.reddit_client_secret);
  }

  async collectData(query: string): Promise<InsertSocialEvent[]> {
    if (!this.validateCredentials()) {
      throw new Error('Reddit credentials are required');
    }

    try {
      // Get Reddit access token
      const authData = new URLSearchParams({
        grant_type: 'client_credentials',
      });

      const authResponse = await axios.post('https://www.reddit.com/api/v1/access_token', authData, {
        auth: {
          username: this.credentials.reddit_client_id,
          password: this.credentials.reddit_client_secret,
        },
        headers: {
          'User-Agent': 'BLRAnalytics/1.0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const accessToken = authResponse.data.access_token;

      // Search Reddit posts
      const searchResponse = await axios.get(`https://oauth.reddit.com/search`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'BLRAnalytics/1.0',
        },
        params: {
          q: query,
          limit: 20,
          sort: 'relevance',
        },
      });

      const events: InsertSocialEvent[] = [];
      
      for (const post of searchResponse.data.data.children) {
        const postData = post.data;
        
        events.push({
          author_id: postData.author || null,
          author_name: postData.author || null,
          clean_event_text: this.cleanText(postData.selftext || postData.title || ''),
          engagement_metrics: {
            comments: postData.num_comments || 0,
            likes: postData.ups || 0,
            shares: 0, // Reddit doesn't have shares
          },
          event_content: postData.selftext || postData.title || null,
          event_id: postData.id || null,
          event_title: postData.title || null,
          event_url: `https://reddit.com${postData.permalink}`,
          parent_event_id: null,
          platform: 'Reddit',
          timestamp_utc: new Date(postData.created_utc * 1000).toISOString(),
          sentiment_analysis: await this.analyzeSentiment(postData.selftext || postData.title || ''),
          location_focus: this.extractLocationFocus(postData.selftext || postData.title || ''),
          airline_mentioned: this.extractAirlineMention(postData.selftext || postData.title || ''),
        });
      }

      // Store collected events
      await this.storeCollectedEvents('reddit', events);
      
      return events;
    } catch (error) {
      console.error('Reddit data collection error:', error);
      throw new Error('Failed to collect Reddit data');
    }
  }
}