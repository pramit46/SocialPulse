# Social Media Analytics Dashboard

## Overview

This is a full-stack social media analytics application built with a React frontend and an Express backend. The application provides a comprehensive dashboard for monitoring social media activity across multiple platforms, managing social events data, user settings configuration, and contact management. It features a modern dark-themed UI with interactive charts, metrics tracking, and platform-specific analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with custom shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom dark theme variables and responsive design
- **Charts**: Recharts library for data visualization (compact line charts, pie charts with proper legends)
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Data Storage**: In-memory storage implementation with the option for future database integration
- **API Design**: RESTful endpoints for social events, contact messages, settings, analytics, and data collection
- **Validation**: Zod schemas ensure request validation and type safety
- **Development**: Hot module replacement with Vite integration for seamless development
- **AI Integration**: Hugging Face API is used for language model inference:
  - **Sentiment Analysis**: `nlptown/bert-base-multilingual-uncased-sentiment`
  - **Chatbot**: `meta-llama/Llama-2-7b-chat-hf`
  - **Embeddings**: `Qwen/Qwen3-Embedding-0.6B`
- **Vector Storage**: ChromaDB is integrated for semantic search and event similarity

### Data Collection Services
- **Real-time Collection**: Integrated APIs for Twitter, Reddit, and news sources
- **Social Media Sources**: Twitter, Reddit, Facebook, YouTube, Instagram, Vimeo, TikTok, Tumblr
- **News Sources**: CNN, AajTak, WION, Zee News, NDTV via RSS feeds
- **Credential Management**: API keys are stored as base64-encoded strings in local configuration files
- **Sentiment Analysis**: LLM-powered sentiment scoring with categorization for specific airport services
- **Airport Focus**: Bangalore airport and airline-specific data filtering (IndiGo, SpiceJet, Air India, Vistara)

### Data Storage Solutions
- **Current Implementation**: Uses in-memory Map data structures for rapid prototyping
- **Database Ready**: Drizzle ORM is configured for PostgreSQL with defined schema support
- **Schema Design**: Enhanced tables include sentiment analysis, airline mentions, and location focus
- **Migration Support**: Drizzle Kit facilitates database schema management and migrations
- **Vector Embeddings**: ChromaDB stores high-quality text embeddings for semantic search

### AI and Machine Learning
- **Sentiment Analysis**: Powered by Hugging Face’s `nlptown/bert-base-multilingual-uncased-sentiment` model for multilingual sentiment scoring.
- **Chatbot**: Intelligent, context-aware responses generated via Hugging Face’s `meta-llama/Llama-2-7b-chat-hf`.
- **Embedding Storage**: Utilizes the Hugging Face model `Qwen/Qwen3-Embedding-0.6B` for generating text embeddings.
- **Service Categories**: Booking, check-in, luggage, security, lounge, amenities, and communication.
- **Fallback System**: Placeholder responses are provided when API keys are missing or configurations are incomplete.

### Authentication and Authorization
- **Current State**: No authentication implemented (development phase)
- **Session Management**: Express session configuration is available for future use
- **Security**: Basic CORS and request parsing middleware in place
- **API Key Management**: API keys are securely managed as base64-encoded strings in local config files

### External Dependencies
- **Database**: Neon PostgreSQL (configured but not currently used)
- **AI Services**: Hugging Face API for modern language models and embedding generation
- **Social APIs**: Twitter API v2, Reddit OAuth, and RSS-based news feeds
- **UI Libraries**: Extensive use of Radix UI components along with custom shadcn/ui components
- **Development Tools**: Integrated with Vite and containerized for development (Ubuntu 24.04.2 LTS)
- **Data Processing**: Cheerio for RSS parsing and Axios for HTTP requests
- **Vector Database**: ChromaDB for efficient semantic search functionality

## Running the Application

To start the application on Ubuntu 24.04.2 LTS, run the following commands in the integrated terminal:

```bash
cd /workspaces/SocialPulse
npm install
npm run build
npm start
$BROWSER http://localhost:3000
```

---

*Updated to reflect current model integrations and configuration management using Hugging Face API with base64-encoded keys.*