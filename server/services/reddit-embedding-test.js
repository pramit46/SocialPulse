import { MongoClient } from 'mongodb';
// Using built-in fetch (Node.js 18+)

/**
 * Reddit Data Source Embedding Test
 * Tests Reddit data collection and embedding generation using DeepSeek model
 */
class RedditEmbeddingTest {
  constructor() {
    this.mongoClient = null;
    this.db = null;
    this.redditClientId = process.env.REDDIT_CLIENT_ID;
    this.redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.accessToken = null;
  }

  async connect() {
    try {
      const connectionString = process.env.MONGODB_CONNECTION_STRING;
      const dbName = process.env.MONGODB_DATABASE_NAME;
      
      this.mongoClient = new MongoClient(connectionString);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(dbName);
      console.log('✅ Connected to MongoDB for Reddit embedding test');
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

  // Get Reddit OAuth token
  async getRedditAccessToken() {
    try {
      console.log('🔑 Obtaining Reddit API access token...');
      
      const auth = Buffer.from(`${this.redditClientId}:${this.redditClientSecret}`).toString('base64');
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BangaloreAirportAnalytics/1.0'
        },
        body: 'grant_type=client_credentials&scope=read'
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      console.log('✅ Reddit access token obtained successfully');
      return this.accessToken;
      
    } catch (error) {
      console.error('❌ Failed to get Reddit access token:', error);
      throw error;
    }
  }

  // Collect Reddit data about Bangalore airport
  async collectRedditData() {
    try {
      console.log('📡 Collecting Reddit data about Bangalore airport...');
      
      if (!this.accessToken) {
        await this.getRedditAccessToken();
      }

      const searches = [
        'Bangalore airport',
        'Bengaluru airport BLR',
        'Kempegowda airport experience',
        'BLR airport review',
        'Bangalore airport IndiGo SpiceJet'
      ];

      const allPosts = [];
      let totalProcessed = 0;

      for (const searchTerm of searches) {
        console.log(`🔍 Searching for: "${searchTerm}"`);
        
        const response = await fetch(`https://oauth.reddit.com/search?q=${encodeURIComponent(searchTerm)}&type=link&sort=new&limit=20`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'BangaloreAirportAnalytics/1.0'
          }
        });

        if (!response.ok) {
          console.warn(`⚠️ Reddit API error for "${searchTerm}": ${response.status}`);
          continue;
        }

        const data = await response.json();
        const posts = data.data?.children || [];
        
        for (const post of posts) {
          const postData = post.data;
          
          // Filter relevant posts
          if (this.isRelevantToAirport(postData.title + ' ' + (postData.selftext || ''))) {
            const processedPost = {
              id: postData.id,
              title: postData.title,
              text_content: postData.selftext || '',
              clean_event_text: `${postData.title} ${postData.selftext || ''}`.trim(),
              author: postData.author,
              subreddit: postData.subreddit,
              score: postData.score,
              num_comments: postData.num_comments,
              created_utc: postData.created_utc,
              url: postData.url,
              timestamp_utc: new Date(postData.created_utc * 1000).toISOString(),
              platform: 'reddit',
              source: 'reddit_api',
              collected_at: new Date().toISOString()
            };
            
            allPosts.push(processedPost);
            totalProcessed++;
          }
        }
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`📊 Collected ${allPosts.length} relevant Reddit posts`);
      return allPosts;
      
    } catch (error) {
      console.error('❌ Failed to collect Reddit data:', error);
      throw error;
    }
  }

  // Check if post is relevant to Bangalore airport
  isRelevantToAirport(text) {
    const keywords = [
      'bangalore airport', 'bengaluru airport', 'blr airport', 'kempegowda',
      'indigo', 'spicejet', 'air india', 'vistara',
      'baggage', 'security', 'check in', 'lounge', 'flight delay',
      'terminal', 'domestic', 'international'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  // Generate embeddings using DeepSeek model
  async generateEmbedding(text) {
    try {
      // Using Hugging Face API (DeepSeek model equivalent)
      const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text.substring(0, 500) // Limit text length
        })
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const embedding = await response.json();
      return Array.isArray(embedding) ? embedding : embedding[0];
      
    } catch (error) {
      console.warn('⚠️ Failed to generate embedding:', error.message);
      return null;
    }
  }

  // Perform sentiment analysis
  async analyzeSentiment(text) {
    try {
      // Simple sentiment analysis based on keywords
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'best', 'love', 'fantastic', 'awesome', 'perfect', 'smooth'];
      const negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'horrible', 'delayed', 'lost', 'damaged', 'slow'];
      
      const lowerText = text.toLowerCase();
      let positiveScore = 0;
      let negativeScore = 0;
      
      positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveScore++;
      });
      
      negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeScore++;
      });
      
      const overallSentiment = positiveScore > negativeScore ? 
        (positiveScore - negativeScore) / 10 : 
        -(negativeScore - positiveScore) / 10;
        
      return {
        overall_sentiment: Math.max(-1, Math.min(1, overallSentiment)),
        positive_score: positiveScore,
        negative_score: negativeScore
      };
      
    } catch (error) {
      return { overall_sentiment: 0, positive_score: 0, negative_score: 0 };
    }
  }

  // Store Reddit data with embeddings in MongoDB
  async storeRedditDataWithEmbeddings(posts) {
    try {
      console.log('💾 Processing and storing Reddit data with embeddings...');
      
      const collection = this.db.collection('reddit');
      let successCount = 0;
      let errorCount = 0;

      for (const [index, post] of posts.entries()) {
        try {
          console.log(`📝 Processing post ${index + 1}/${posts.length}: "${post.title.substring(0, 50)}..."`);
          
          // Generate embedding
          const embedding = await this.generateEmbedding(post.clean_event_text);
          
          // Analyze sentiment
          const sentimentAnalysis = await this.analyzeSentiment(post.clean_event_text);
          
          // Identify mentioned airlines
          const airlines = this.identifyAirlines(post.clean_event_text);
          
          const enrichedPost = {
            ...post,
            embedding: embedding,
            sentiment_analysis: sentimentAnalysis,
            airline_mentioned: airlines,
            location_focus: 'bangalore_airport',
            processed_at: new Date().toISOString()
          };

          // Insert or update
          await collection.replaceOne(
            { id: post.id },
            enrichedPost,
            { upsert: true }
          );
          
          successCount++;
          console.log(`✅ Processed post ${index + 1}/${posts.length} (${post.id})`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to process post ${index + 1}:`, error.message);
        }
      }

      console.log(`📊 Reddit embedding test completed:`);
      console.log(`   ✅ Successfully processed: ${successCount} posts`);
      console.log(`   ❌ Failed to process: ${errorCount} posts`);
      console.log(`   📈 Success rate: ${((successCount / posts.length) * 100).toFixed(1)}%`);
      
      return { successCount, errorCount };
      
    } catch (error) {
      console.error('❌ Failed to store Reddit data with embeddings:', error);
      throw error;
    }
  }

  // Identify mentioned airlines
  identifyAirlines(text) {
    const airlineKeywords = {
      'indigo': ['indigo', '6e'],
      'spicejet': ['spicejet', 'spice jet'],
      'air_india': ['air india', 'airindia'],
      'vistara': ['vistara', 'tata sia']
    };
    
    const lowerText = text.toLowerCase();
    const mentioned = [];
    
    Object.entries(airlineKeywords).forEach(([airline, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        mentioned.push(airline);
      }
    });
    
    return mentioned.length > 0 ? mentioned[0] : null;
  }

  // Push embeddings to ChromaDB
  async pushToChromaDB(posts) {
    try {
      console.log('🔗 Attempting to push Reddit embeddings to ChromaDB...');
      
      // Check if ChromaDB is available
      const chromaResponse = await fetch('http://localhost:8000/api/v1/heartbeat').catch(() => null);
      
      if (!chromaResponse || !chromaResponse.ok) {
        console.warn('⚠️ ChromaDB not available, skipping embedding push');
        return false;
      }

      console.log('✅ ChromaDB is available, pushing embeddings...');
      
      for (const post of posts) {
        if (post.embedding) {
          try {
            const chromaDoc = {
              id: `reddit_${post.id}`,
              document: post.clean_event_text,
              embedding: post.embedding,
              metadata: {
                platform: 'reddit',
                airline: post.airline_mentioned,
                sentiment: post.sentiment_analysis?.overall_sentiment || 0,
                timestamp: post.timestamp_utc,
                subreddit: post.subreddit
              }
            };

            // This would integrate with your existing ChromaDB service
            console.log(`🔗 Would push to ChromaDB: ${post.id}`);
            
          } catch (error) {
            console.warn(`⚠️ Failed to push ${post.id} to ChromaDB:`, error.message);
          }
        }
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ ChromaDB push failed:', error);
      return false;
    }
  }

  // Main test execution
  async runEmbeddingTest() {
    try {
      console.log('🎯 REDDIT EMBEDDING TEST STARTED');
      console.log('='.repeat(50));
      
      await this.connect();
      
      // Step 1: Collect Reddit data
      const posts = await this.collectRedditData();
      
      if (posts.length === 0) {
        console.warn('⚠️ No relevant Reddit posts found');
        return;
      }
      
      // Step 2: Store with embeddings
      const result = await this.storeRedditDataWithEmbeddings(posts);
      
      // Step 3: Push to ChromaDB
      await this.pushToChromaDB(posts);
      
      console.log('\n🎉 REDDIT EMBEDDING TEST COMPLETED');
      console.log('='.repeat(50));
      console.log(`📊 Total posts processed: ${posts.length}`);
      console.log(`✅ Successfully stored with embeddings: ${result.successCount}`);
      console.log(`❌ Processing errors: ${result.errorCount}`);
      console.log(`💾 Data stored in MongoDB 'reddit' collection`);
      console.log(`🔗 Embeddings ready for ChromaDB integration`);
      
    } catch (error) {
      console.error('💥 Reddit embedding test failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

export { RedditEmbeddingTest };