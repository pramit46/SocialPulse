import { ChromaClient, Collection } from "chromadb";

export class OllamaLLMService {
  private ollamaToken: string;
  private ollamaBaseUrl: string;
  private chromaClient: ChromaClient | null = null;
  private socialEventsCollection: Collection | null = null;
  // Use tinyllama:latest as the primary model for all tasks
  private modelName = "tinyllama:latest";

  constructor() {
    // Get Ollama base URL from environment (no token needed)
    this.ollamaToken = ""; // Not needed for local Ollama
    this.ollamaBaseUrl = process.env.OLLAMA_API_BASE_URL || "http://localhost:11434";

    // Initialize ChromaDB for vector storage
    try {
      this.chromaClient = new ChromaClient({
        path: "http://localhost:8000", // Default ChromaDB endpoint
      });
      void this.initializeCollection();
    } catch (error: unknown) {
      console.warn(
        "ChromaDB not available, using in-memory storage for embeddings",
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
      const { storage } = await import('./storage');
      const events = await storage.getSocialEvents();
      
      const queryLower = query.toLowerCase();
      const keywords = queryLower.split(' ').filter(word => word.length > 2);
      
      const scoredEvents = events.map(event => {
        const contentLower = event.event_content.toLowerCase();
        let score = 0;
        
        keywords.forEach(keyword => {
          if (contentLower.includes(keyword)) {
            score += keyword.length;
          }
        });
        
        if (contentLower.includes(queryLower)) {
          score += 10;
        }
        
        return { event, score };
      });
      
      const relevantEvents = scoredEvents
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.event.event_content);
        
      console.log(`Found ${relevantEvents.length} relevant events for query: "${query}"`);
      return relevantEvents;
    } catch (error) {
      console.error("In-memory event search error:", error);
      return [];
    }
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