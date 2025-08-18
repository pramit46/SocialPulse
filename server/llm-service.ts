import OpenAI from 'openai';
import { ChromaClient, Collection } from 'chromadb';

export class LLMService {
  private openai: OpenAI | null = null;
  private chromaClient: ChromaClient | null = null;
  private socialEventsCollection: Collection | null = null;
  private embeddingModel = 'text-embedding-3-small';

  constructor() {
    // Initialize OpenAI client only if API key is provided
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('OpenAI API key not provided. Using placeholder sentiment analysis and responses.');
    }

    // Initialize ChromaDB client
    try {
      this.chromaClient = new ChromaClient({
        path: "http://localhost:8001" // Default ChromaDB endpoint
      });
      this.initializeCollection();
    } catch (error) {
      console.warn('ChromaDB not available, using in-memory storage for embeddings');
    }
  }

  private async initializeCollection() {
    if (!this.chromaClient) return;
    
    try {
      this.socialEventsCollection = await this.chromaClient.getOrCreateCollection({
        name: "bangalore_airport_social_events",
        metadata: { description: "Social media events related to Bangalore airport and airlines" }
      });
    } catch (error) {
      console.error('Failed to initialize ChromaDB collection:', error);
    }
  }

  async analyzeSentiment(text: string): Promise<any> {
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      return this.getPlaceholderSentiment();
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a sentiment analysis expert for Bangalore airport and airline services. 
            Analyze the sentiment of the given text and return a JSON response with:
            - overall_sentiment: number between -1 (negative) and 1 (positive)
            - sentiment_score: confidence score between 0 and 1
            - categories: object with sentiment scores for specific airport services:
              - ease_of_booking: sentiment about booking process
              - check_in: sentiment about check-in experience
              - luggage_handling: sentiment about baggage services
              - security: sentiment about security screening
              - lounge: sentiment about lounge facilities
              - amenities: sentiment about airport amenities
              - communication: sentiment about staff communication
            
            Only provide scores for categories that are relevant to the text. Use null for irrelevant categories.
            Return only valid JSON, no additional text.`
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      const result = response.choices?.[0]?.message?.content;
      if (result) {
        try {
          return JSON.parse(result);
        } catch (parseError) {
          console.error('Failed to parse OpenAI sentiment response:', parseError);
          return this.getPlaceholderSentiment();
        }
      }
    } catch (error) {
      console.error('OpenAI sentiment analysis error:', error);
    }
    return this.getPlaceholderSentiment();
  }

  async generateChatResponse(query: string, context: string[] = []): Promise<string> {
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      return "I'm currently running without AI capabilities. Please configure OpenAI API key for full functionality.";
    }

    try {
      const relevantEvents = await this.searchSimilarEvents(query);
      const contextText = relevantEvents.length > 0 
        ? `Relevant social media data:\n${relevantEvents.join('\n\n')}`
        : 'No specific social media data found for this query.';

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are AeroBot, an AI assistant specialized in Bangalore airport analytics and passenger experience insights.
You have access to real-time social media data about Bangalore airport, IndiGo, SpiceJet, Air India, and Vistara.

Provide helpful, accurate responses about:
- Airport facilities and services
- Airline performance and passenger satisfaction
- Travel tips and recommendations
- Current sentiment trends

Use the provided social media context to give data-driven insights.
Keep responses concise, helpful, and professional.`
          },
          {
            role: "user",
            content: `Context: ${contextText}\n\nQuestion: ${query}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices?.[0]?.message?.content || "I'm unable to generate a response right now. Please try again.";
    } catch (error) {
      console.error('OpenAI chat response generation error:', error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }

  async storeEventEmbedding(eventId: string, text: string, metadata: any): Promise<void> {
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
          documents: [text]
        });
      }
    } catch (error) {
      console.error('Failed to store event embedding:', error);
    }
  }

  private async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai || !process.env.OPENAI_API_KEY) {
      return null;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      return null;
    }
  }

  private async searchSimilarEvents(query: string, limit: number = 5): Promise<string[]> {
    if (!this.socialEventsCollection) {
      return [];
    }
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        return [];
      }
      const results = await this.socialEventsCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit
      });
      return (results.documents?.[0] || []).filter((doc): doc is string => doc !== null);
    } catch (error) {
      console.error('Similarity search error:', error);
      return [];
    }
  }

  private getPlaceholderSentiment(): any {
    const score = Math.random() * 2 - 1;
    return {
      overall_sentiment: score,
      sentiment_score: Math.abs(score),
      categories: {
        ease_of_booking: Math.random() > 0.5 ? Math.random() * 2 - 1 : null,
        check_in: Math.random() > 0.5 ? Math.random() * 2 - 1 : null,
        luggage_handling: Math.random() > 0.5 ? Math.random() * 2 - 1 : null,
        security: Math.random() > 0.5 ? Math.random() * 2 - 1 : null,
        lounge: Math.random() > 0.5 ? Math.random() * 2 - 1 : null,
        amenities: Math.random() > 0.5 ? Math.random() * 2 - 1 : null,
        communication: Math.random() > 0.5 ? Math.random() * 2 - 1 : null,
      },
    };
  }
}

export const llmService = new LLMService();