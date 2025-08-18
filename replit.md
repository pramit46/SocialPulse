# Social Media Analytics Dashboard

## Overview

This is a full-stack social media analytics application built with React frontend and Express backend. The application provides a comprehensive dashboard for monitoring social media activity across multiple platforms, managing social events data, user settings configuration, and contact management. It features a modern dark-themed UI with interactive charts, metrics tracking, and platform-specific analytics.

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
- **Data Storage**: In-memory storage implementation with interface for future database integration
- **API Design**: RESTful endpoints for social events, contact messages, settings, analytics, and data collection
- **Validation**: Zod schemas for request validation and type safety
- **Development**: Hot module replacement with Vite integration for seamless development
- **AI Integration**: OpenAI GPT-3.5-turbo for sentiment analysis and chatbot responses
- **Vector Storage**: ChromaDB integration for semantic search and event similarity

### Data Collection Services
- **Real-time Collection**: Integrated APIs for Twitter, Reddit, and news sources
- **Social Media Sources**: Twitter, Reddit, Facebook, YouTube, Instagram, Vimeo, TikTok, Tumblr
- **News Sources**: CNN, AajTak, WION, Zee News, NDTV with RSS feed support
- **Credential Management**: Secure API key and token handling for external services
- **Sentiment Analysis**: LLM-powered sentiment scoring with airport service categorization
- **Airport Focus**: Bangalore airport and airline-specific data filtering (IndiGo, SpiceJet, Air India, Vistara)

### Data Storage Solutions
- **Current Implementation**: Memory-based storage with Map data structures for rapid prototyping
- **Database Ready**: Drizzle ORM configured for PostgreSQL with schema definitions
- **Schema Design**: Enhanced tables with sentiment analysis, airline mentions, and location focus
- **Migration Support**: Drizzle Kit for database schema management and migrations
- **Vector Embeddings**: ChromaDB for semantic search and content similarity

### AI and Machine Learning
- **Sentiment Analysis**: OpenAI GPT-3.5-turbo with airport service categorization
- **Chatbot**: AeroBot AI assistant with context-aware responses
- **Embedding Storage**: ChromaDB for vector similarity search
- **Service Categories**: Booking, check-in, luggage, security, lounge, amenities, communication
- **Fallback System**: Placeholder responses when API keys are not configured

### Authentication and Authorization
- **Current State**: No authentication implemented (development phase)
- **Session Management**: Express session configuration present for future implementation
- **Security**: Basic CORS and request parsing middleware configured
- **API Key Management**: Environment variable support for OpenAI and social media APIs

### External Dependencies
- **Database**: Neon PostgreSQL (configured but not actively used)
- **AI Services**: OpenAI API for GPT-3.5-turbo and text embeddings
- **Social APIs**: Twitter API v2, Reddit OAuth, RSS parsing
- **UI Libraries**: Extensive Radix UI component library with tabs, dialogs, and forms
- **Development Tools**: Replit-specific plugins for cloud development environment
- **Data Processing**: Cheerio for RSS parsing, Axios for HTTP requests
- **Vector Database**: ChromaDB for semantic search capabilities

The application follows a modular architecture with clear separation between client and server code, shared schema definitions, and a component-based UI structure. The system now includes real data collection capabilities, AI-powered sentiment analysis, and intelligent chatbot functionality while maintaining scalability with proper TypeScript typing throughout.