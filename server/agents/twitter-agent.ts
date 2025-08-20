import { TwitterApi } from 'twitter-api-v2';
import { BaseAgent } from './base-agent';
import { InsertSocialEvent } from '@shared/schema';

export class TwitterAgent extends BaseAgent {
  constructor(credentials?: any) {
    super(credentials);
  }

  validateCredentials(): boolean {
    const bearerToken = this.credentials?.twitter_bearer_token || process.env.TWITTER_BEARER_TOKEN;
    return !!bearerToken;
  }

  async collectData(query: string): Promise<InsertSocialEvent[]> {
    if (!this.validateCredentials()) {
      throw new Error('Twitter Bearer Token is required');
    }

    try {
      const bearerToken = this.credentials?.twitter_bearer_token || process.env.TWITTER_BEARER_TOKEN;
      const client = new TwitterApi(bearerToken);
      const tweets = await client.v2.search(query, {
        max_results: 20,
        'tweet.fields': ['public_metrics', 'created_at', 'author_id'],
        'user.fields': ['username'],
        expansions: ['author_id'],
      });

      const events: InsertSocialEvent[] = [];
      
      for (const tweet of tweets.data?.data || []) {
        const author = tweets.includes?.users?.find(u => u.id === tweet.author_id);
        
        events.push({
          author_id: tweet.author_id || null,
          author_name: author?.username ? `@${author.username}` : null,
          clean_event_text: this.cleanText(tweet.text || ''),
          engagement_metrics: {
            comments: tweet.public_metrics?.reply_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            shares: tweet.public_metrics?.retweet_count || 0,
          },
          event_content: tweet.text || null,
          event_id: tweet.id || null,
          event_title: null,
          event_url: `https://twitter.com/i/web/status/${tweet.id}`,
          parent_event_id: null,
          platform: 'Twitter',
          timestamp_utc: tweet.created_at || new Date().toISOString(),
          sentiment_analysis: await this.analyzeSentiment(tweet.text || ''),
          location_focus: this.extractLocationFocus(tweet.text || ''),
          airline_mentioned: this.extractAirlineMention(tweet.text || ''),
        });
      }

      // Store collected events
      await this.storeCollectedEvents('twitter', events);
      
      return events;
    } catch (error) {
      console.error('Twitter data collection error:', error);
      throw new Error('Failed to collect Twitter data');
    }
  }
}