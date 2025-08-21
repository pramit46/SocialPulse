import { ChromaClient, Collection } from "chromadb";

export class OllamaLLMService {
  private ollamaToken: string;
  private ollamaBaseUrl: string;
  private chromaClient: ChromaClient | null = null;
  private socialEventsCollection: Collection | null = null;
  // Use deepseek-r1:8b as the primary model for all tasks
  //private modelName = "deepseek-r1:8b";
  private modelName = "tinyllama:latest";

  constructor() {
    // Get Ollama base URL from environment (no token needed)
    this.ollamaToken = ""; // Not needed for local Ollama
    this.ollamaBaseUrl = process.env.OLLAMA_API_BASE_URL || "https://968a2b5e264b.ngrok-free.app";

    // Initialize ChromaDB for vector storage
    try {
      this.chromaClient = new ChromaClient({
        path: "http://localhost:8000", // ChromaDB endpoint  
      });
      void this.initializeCollection();
      console.log("✅ ChromaDB connected at port 8000");
    } catch (error: unknown) {
      console.warn(
        "⚠️ ChromaDB not available at port 8000, using in-memory storage for embeddings",
      );
    }
  }

  private async initializeCollection() {
    if (!this.chromaClient) return;
    
    try {
      this.socialEventsCollection =
        await this.chromaClient.getOrCreateCollection({
          name: "bangalore_airport_social_events",
          metadata: {
            description:
              "Social media events related to Bangalore airport and airlines",
          },
        });
    } catch (error) {
      console.error("Failed to initialize ChromaDB collection:", error);
    }
  }

  async analyzeSentiment(text: string): Promise<any> {
    try {
      const prompt = `Analyze the sentiment of this text about Bangalore airport or airline services. Return only valid JSON with this structure:
{
  "overall_sentiment": <number between -1 and 1>,
  "sentiment_score": <confidence score between 0 and 1>,
  "categories": {
    "ease_of_booking": <sentiment score or null>,
    "check_in": <sentiment score or null>,
    "luggage_handling": <sentiment score or null>,
    "security": <sentiment score or null>,
    "lounge": <sentiment score or null>,
    "amenities": <sentiment score or null>,
    "communication": <sentiment score or null>
  }
}

Text to analyze: "${text}"

JSON Response:`;

      const response = await this.callOllamaAPI("/api/generate", {
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        }
      });

      if (response?.response) {
        try {
          // Extract JSON from response
          const jsonMatch = response.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error("Failed to parse Ollama sentiment response:", parseError);
          return this.getPlaceholderSentiment();
        }
      }
    } catch (error) {
      console.error("Ollama sentiment analysis error:", error);
    }
    return this.getPlaceholderSentiment();
  }

  async generateChatResponse(
    query: string,
    context: string[] = [],
    sessionId: string = 'default'
  ): Promise<string> {
    try {
      // Sanitize the input query first
      const sanitizedQuery = this.sanitizeText(query);
      if (!sanitizedQuery) {
        return "I didn't receive a clear message. Could you please try again?";
      }

      console.log(`🤖 [AVA] Analyzing query: "${sanitizedQuery}" | Session: ${sessionId}`);

      // Get previous context from MongoDB
      const { mongoService } = await import('./mongodb');
      const previousContext = await mongoService.getAvaContext(sessionId);
      console.log(`🧠 [AVA] Previous context: ${previousContext ? JSON.stringify(previousContext) : 'None'}`);

      // Check if this is a response to a previous internet search request
      if (previousContext?.waitingForInternetConsent) {
        const normalized = sanitizedQuery.toLowerCase().trim();
        const positiveResponses = ['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', 'fine', 'go ahead', 'proceed', 'continue'];
        const isPositive = positiveResponses.some(positive => normalized.includes(positive));
        console.log(`🔄 [AVA] User response to internet search consent: ${isPositive ? 'APPROVED' : 'DENIED'} | Response: "${normalized}"`);
        
        if (isPositive) {
          // Clear the context and perform internet search
          await mongoService.storeAvaContext(sessionId, { waitingForInternetConsent: false });
          console.log(`🌐 [AVA] Performing internet search for: "${previousContext.originalQuery}"`);
          return `I would search the internet for information about "${previousContext.originalQuery}" at Bangalore airport, but this feature is currently being developed. In the meantime, I can help you with passenger experiences, airline performance, and sentiment analysis from our existing social media data. What specific aspect would you like to explore?`;
        } else {
          // Clear the context and provide alternative
          await mongoService.storeAvaContext(sessionId, { waitingForInternetConsent: false });
          console.log(`❌ [AVA] Internet search declined by user`);
          return `No problem! I can help with other aspects of Bangalore airport like passenger experiences, airline services, security processes, or flight information. What would you like to know?`;
        }
      }

      // Step 1: Understand the query intent using reasoning
      const queryIntent = await this.analyzeQueryIntent(sanitizedQuery);
      console.log(`🧠 [AVA] Query intent: ${queryIntent.type} | Topic: ${queryIntent.topic}`);

      // Step 2: Handle different intent types appropriately
      switch (queryIntent.type) {
        case 'greeting':
          return "Hello! 👋 I'm AVA, your Bangalore airport analytics assistant. I can help you with information about airport experiences, airline performance, passenger feedback, and current trends. What would you like to know?";
          
        case 'general_conversation':
          return "I'm AVA, specialized in Bangalore airport and airline analytics. I can help you understand passenger experiences, airport services, airline performance, and sentiment trends from real social media data. What specific airport or airline topic would you like to explore?";
          
        case 'out_of_scope':
          return `I focus specifically on Bangalore airport and airline analytics. For questions about "${queryIntent.topic}", I'd recommend checking with a general assistant. However, I can help with airport facilities, airline experiences, flight information, and passenger sentiment analysis. Anything airport-related you'd like to know?`;
          
        case 'airport_specific':
          // For airport queries, use RAG with targeted search
          const relevantEvents = await this.searchSimilarEvents(sanitizedQuery, 5);
          
          if (relevantEvents.length === 0) {
            // Store context for internet search consent
            await mongoService.storeAvaContext(sessionId, {
              waitingForInternetConsent: true,
              originalQuery: sanitizedQuery,
              queryIntent: queryIntent
            });
            console.log(`📝 [AVA] Stored context for internet search consent | Session: ${sessionId}`);
            
            return `I don't have specific social media data about "${queryIntent.topic}" at Bangalore airport right now. Our system tracks passenger experiences including delays, luggage handling, security, check-in, lounges, and airline services. 

Would you like me to search the internet for current information about "${queryIntent.topic}" at Bangalore airport? Please reply with "yes" if you'd like me to look for this information online.`;
          }
          
          // Generate contextual response with found data
          return await this.generateContextualResponse(sanitizedQuery, relevantEvents, queryIntent);
          
        default:
          // Fallback to general search
          const events = await this.searchSimilarEvents(sanitizedQuery);
          return await this.generateContextualResponse(sanitizedQuery, events, queryIntent);
      }
    } catch (error) {
      console.error("Chat response generation error:", error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }

  // New method: Analyze query intent for proper reasoning
  private async analyzeQueryIntent(query: string): Promise<{type: string, topic: string, confidence: number}> {
    const queryLower = query.toLowerCase().trim();
    
    // Remove punctuation for better matching
    const cleanQuery = queryLower.replace(/[^\w\s]/g, '').trim();
    
    // Greeting patterns (more flexible)
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(cleanQuery)) {
      return { type: 'greeting', topic: 'greeting', confidence: 1.0 };
    }
    
    // General conversation starters (more flexible to handle punctuation)
    const conversationStarters = [
      'how are you', 'how are you doing', 'what can you do', 'who are you', 
      'help', 'whats up', 'how do you do', 'what are you', 'tell me about yourself'
    ];
    
    if (conversationStarters.some(starter => cleanQuery === starter || cleanQuery.includes(starter))) {
      return { type: 'general_conversation', topic: 'capabilities', confidence: 1.0 };
    }
    
    // Airport and airline specific topics
    const airportTerms = ['airport', 'flight', 'airline', 'terminal', 'baggage', 'luggage', 'security', 'check-in', 'boarding', 'lounge', 'delay', 'punctual', 'gate'];
    const airlineNames = ['indigo', 'spicejet', 'air india', 'vistara', 'bangalore airport', 'bengaluru airport', 'kempegowda'];
    
    const hasAirportTerms = airportTerms.some(term => queryLower.includes(term));
    const hasAirlineNames = airlineNames.some(airline => queryLower.includes(airline));
    
    if (hasAirportTerms || hasAirlineNames) {
      // Extract specific topic
      let topic = 'general_airport';
      if (queryLower.includes('store') || queryLower.includes('shop')) topic = 'stores_shopping';
      else if (queryLower.includes('food') || queryLower.includes('restaurant')) topic = 'food_dining';
      else if (queryLower.includes('baggage') || queryLower.includes('luggage')) topic = 'baggage_handling';
      else if (queryLower.includes('security')) topic = 'security_screening';
      else if (queryLower.includes('delay')) topic = 'flight_delays';
      else if (queryLower.includes('lounge')) topic = 'airport_lounges';
      
      return { type: 'airport_specific', topic, confidence: 0.9 };
    }
    
    // Out of scope topics (weather, politics, sports, etc.)
    const outOfScopeTerms = ['weather', 'politics', 'sports', 'movie', 'music', 'cooking', 'recipe'];
    if (outOfScopeTerms.some(term => queryLower.includes(term))) {
      const topic = outOfScopeTerms.find(term => queryLower.includes(term)) || 'general';
      return { type: 'out_of_scope', topic, confidence: 0.8 };
    }
    
    // If query is very short and doesn't contain airport terms, treat as general conversation
    if (cleanQuery.length < 20 && !hasAirportTerms && !hasAirlineNames) {
      return { type: 'general_conversation', topic: 'capabilities', confidence: 0.5 };
    }
    
    // Default: treat as potential airport query with low confidence
    return { type: 'airport_specific', topic: 'general_inquiry', confidence: 0.3 };
  }

  // Enhanced contextual response generation
  private async generateContextualResponse(query: string, events: string[], intent: any): Promise<string> {
    if (events.length === 0) {
      return `I couldn't find specific social media data related to "${intent.topic}". Our system tracks passenger experiences about Bangalore airport including delays, airline services, baggage handling, security processes, and facility feedback. Try asking about these specific topics!`;
    }

    const contextText = events.slice(0, 3).join('\n\n'); // Limit to top 3 most relevant
    const eventCount = events.length;

    return `Based on ${eventCount} recent social media post${eventCount > 1 ? 's' : ''} about ${intent.topic}, here's what passengers are saying:

${contextText.split('\n').map(line => line.trim()).filter(line => line.length > 10).slice(0, 3).map(line => `• ${line}`).join('\n')}

This data comes from real social media posts about Bangalore airport and airline experiences.`;
  }

  async storeEventEmbedding(
    eventId: string,
    text: string,
    metadata: any,
  ): Promise<void> {
    if (!this.socialEventsCollection) {
      return;
    }
    try {
      const embedding = await this.generateEmbedding(text);
      if (embedding) {
        await this.socialEventsCollection.add({
          ids: [eventId],
          embeddings: [embedding],
          metadatas: [metadata],
          documents: [text],
        });
      }
    } catch (error) {
      console.error("Failed to store event embedding:", error);
    }
  }

  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await this.callOllamaAPI("/api/embeddings", {
        model: this.modelName,
        prompt: text
      });

      return response?.embedding || null;
    } catch (error) {
      console.error("Ollama embedding generation error:", error);
      return null;
    }
  }

  async searchSimilarEvents(
    query: string,
    limit: number = 5,
  ): Promise<string[]> {
    if (!this.socialEventsCollection) {
      console.log("ChromaDB collection not available, searching in-memory storage");
      return this.searchInMemoryEvents(query, limit);
    }
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        console.log("Could not generate embedding, falling back to text search");
        return this.searchInMemoryEvents(query, limit);
      }
      const results = await this.socialEventsCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
      });
      return (results.documents?.[0] || []).filter((doc): doc is string => doc !== null);
    } catch (error) {
      console.error("Similarity search error:", error);
      return this.searchInMemoryEvents(query, limit);
    }
  }

  private async callOllamaAPI(endpoint: string, payload: any): Promise<any> {
    try {
      const url = `${this.ollamaBaseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // No authorization needed for local Ollama

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Ollama API call error:", error);
      throw error;
    }
  }

  private getPlaceholderSentiment(): any {
    // Return null instead of mock data when Ollama fails
    return {
      overall_sentiment: 0,
      sentiment_score: 0,
      categories: {
        ease_of_booking: null,
        check_in: null,
        luggage_handling: null,
        security: null,
        lounge: null,
        amenities: null,
        communication: null,
      },
    };
  }

  // Sanitize text to remove invalid characters
  private sanitizeText(text: string): string {
    if (!text) return "";
    
    return text
      .replace(/\uFFFD/g, '') // Unicode replacement character
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
      .replace(/[\uD800-\uDFFF]/g, '') // Surrogate pairs (invalid unicode)
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
      .normalize('NFC')
      .trim();
  }

  // Fallback text search when vector search is unavailable
  private async searchInMemoryEvents(query: string, limit: number = 5): Promise<string[]> {
    try {
      // Get social events from MongoDB instead of storage (which has mock data)
      const { mongoService } = await import('./mongodb');
      if (!mongoService.isConnectionActive()) {
        console.log("📊 MongoDB not connected - no search data available");
        return [];
      }

      const events = await mongoService.getAllSocialEvents();
      console.log(`🔍 Searching through ${events.length} social media events for: "${query}"`);

      if (events.length === 0) {
        return [];
      }

      // Enhanced text matching with better relevance scoring
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(' ').filter(term => term.length > 2);
      
      const scoredEvents = events
        .filter(event => {
          const content = (event.event_content || event.clean_event_text || '').toLowerCase();
          // Filter for airport/airline related content
          return content.includes('airport') || 
                 content.includes('airline') ||
                 content.includes('flight') ||
                 content.includes('bangalore') ||
                 content.includes('bengaluru') ||
                 queryTerms.some(term => content.includes(term));
        })
        .map(event => {
          const content = event.event_content || event.clean_event_text || '';
          const score = this.calculateTextRelevance(content, queryLower);
          return { content, score, event };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // For amenities queries, prioritize relevant content
      if (queryLower.includes('amenities') || queryLower.includes('facilities')) {
        const amenityKeywords = ['lounge', 'wifi', 'food', 'restaurant', 'shop', 'toilet', 'charging', 'seating'];
        const amenityEvents = scoredEvents.filter(item => 
          amenityKeywords.some(keyword => item.content.toLowerCase().includes(keyword))
        );
        if (amenityEvents.length > 0) {
          console.log(`📈 Found ${amenityEvents.length} amenity-specific events`);
          return amenityEvents.map(item => item.content);
        }
      }

      console.log(`📈 Found ${scoredEvents.length} relevant events for context`);
      return scoredEvents.map(item => item.content);

    } catch (error) {
      console.error('Error searching in-memory events:', error);
      return [];
    }
  }

  private calculateTextRelevance(text: string, query: string): number {
    const textLower = text.toLowerCase();
    let score = 0;
    
    // Exact query match gets high score
    if (textLower.includes(query)) score += 10;
    
    // Key airport terms
    const airportTerms = ['bangalore airport', 'bengaluru airport', 'kempegowda', 'blr'];
    airportTerms.forEach(term => {
      if (textLower.includes(term)) score += 5;
    });
    
    // Airline mentions
    const airlines = ['indigo', 'spicejet', 'air india', 'vistara'];
    airlines.forEach(airline => {
      if (textLower.includes(airline)) score += 3;
    });
    
    // Service terms
    const services = ['security', 'luggage', 'baggage', 'lounge', 'check-in', 'boarding'];
    services.forEach(service => {
      if (textLower.includes(service)) score += 2;
    });
    
    return score;
  }

  // Generate contextual response from found social media data
  async generateResponseFromData(query: string, relevantEvents: string[]): Promise<string> {
    if (relevantEvents.length === 0) {
      return "I couldn't find relevant social media data for your query.";
    }

    const eventSample = relevantEvents.slice(0, 3);
    const totalEvents = relevantEvents.length;
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    eventSample.forEach(event => {
      const eventLower = event.toLowerCase();
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'smooth', 'efficient', 'quick', 'helpful', 'clean', 'comfortable'];
      const negativeWords = ['bad', 'terrible', 'awful', 'delay', 'slow', 'crowded', 'dirty', 'rude', 'lost', 'cancelled'];
      
      const hasPositive = positiveWords.some(word => eventLower.includes(word));
      const hasNegative = negativeWords.some(word => eventLower.includes(word));
      
      if (hasPositive) positiveCount++;
      if (hasNegative) negativeCount++;
    });
    
    let sentimentSummary = "";
    if (positiveCount > negativeCount) {
      sentimentSummary = "The feedback is generally positive.";
    } else if (negativeCount > positiveCount) {
      sentimentSummary = "The feedback shows some concerns.";
    } else {
      sentimentSummary = "The feedback is mixed.";
    }
    
    return `Based on ${totalEvents} recent social media posts related to your query, here's what I found:\n\n${sentimentSummary}\n\nRecent passenger experiences:\n• ${eventSample.join('\n• ')}\n\nThis data comes from actual social media posts about Bangalore airport and airline experiences.`;
  }

  // Helper method to detect positive responses for internet search consent
  private isPositiveResponse(response: string): boolean {
    const normalized = response.toLowerCase().trim();
    const positiveResponses = ['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', 'fine', 'go ahead', 'proceed', 'continue'];
    console.log(`🔍 [AVA-CONSENT] Checking if "${normalized}" is positive response`);
    const isPositive = positiveResponses.some(positive => normalized.includes(positive));
    console.log(`✅ [AVA-CONSENT] Result: ${isPositive ? 'POSITIVE' : 'NEGATIVE'}`);
    return isPositive;
  }

  // Internet search method (placeholder for now)
  private async performInternetSearch(query: string): Promise<string> {
    console.log(`🌐 [AVA-INTERNET] Performing internet search for: "${query}"`);
    // For now, return a placeholder response
    return `I would search the internet for information about "${query}" at Bangalore airport, but this feature is currently being developed. In the meantime, I can help you with passenger experiences, airline performance, and sentiment analysis from our existing social media data. What specific aspect would you like to explore?`;
  }
}

export const llmService = new OllamaLLMService();