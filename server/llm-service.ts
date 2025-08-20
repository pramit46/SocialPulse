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
    this.ollamaBaseUrl = process.env.OLLAMA_API_BASE_URL || "http://localhost:11434";

    // Initialize ChromaDB for vector storage - Use in-memory approach for now
    console.log("🔧 Using in-memory vector storage for embeddings (ChromaDB alternative)");
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
      }, {
        timeout: 180000 // 3 minutes timeout for sentiment analysis
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
  ): Promise<string> {
    try {
      // Sanitize the input query first
      const sanitizedQuery = this.sanitizeText(query);
      if (!sanitizedQuery) {
        return "I didn't receive a clear message. Could you please try again?";
      }

      const relevantEvents = await this.searchSimilarEvents(sanitizedQuery);
      const contextText =
        relevantEvents.length > 0
          ? `Relevant social media data:\n${relevantEvents.join("\n\n")}`
          : "No specific social media data found for this query.";

      const prompt = `You are AeroBot, an AI assistant specialized in Bangalore airport analytics and passenger experience insights.
You have access to real-time social media data about Bangalore airport, IndiGo, SpiceJet, Air India, and Vistara.

Provide helpful, accurate responses about:
- Airport facilities and services
- Airline performance and passenger satisfaction  
- Travel tips and recommendations
- Current sentiment trends

Use the provided social media context to give data-driven insights.
Keep responses concise, helpful, and professional.

Context: ${contextText}

Question: ${sanitizedQuery}

Response:`;

      const response = await this.callOllamaAPI("/api/generate", {
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }, {
        timeout: 180000 // 3 minutes timeout for chat responses
      });

      return response?.response || "I'm unable to generate a response right now. Please try again.";
    } catch (error) {
      console.error("Ollama chat response generation error:", error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
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

      // Simple text matching for now (will replace with proper embeddings later)
      const queryLower = query.toLowerCase();
      const scoredEvents = events
        .filter(event => {
          const content = (event.event_content || event.clean_event_text || '').toLowerCase();
          return content.includes(queryLower) || 
                 content.includes('airport') || 
                 content.includes('airline') ||
                 content.includes('flight');
        })
        .map(event => ({
          content: event.event_content || event.clean_event_text || '',
          score: this.calculateTextRelevance(event.event_content || event.clean_event_text || '', queryLower)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(event => event.content);

      console.log(`📈 Found ${scoredEvents.length} relevant events for context`);
      return scoredEvents;

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
}

export const llmService = new OllamaLLMService();