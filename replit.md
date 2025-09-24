# Social Media Analytics Dashboard

## Overview

This is a full-stack social media analytics application built specifically for monitoring Bangalore airport and airline services across multiple platforms. The system combines React-based frontend with an Express backend, featuring real-time data collection, AI-powered sentiment analysis, and comprehensive dashboard analytics. The application focuses on tracking social media mentions for major Indian airlines (IndiGo, SpiceJet, Air India, Vistara) and provides insights into passenger experiences at Bangalore airport.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (September 2025)

### Latest Configuration Enhancement:
- **Complete Configurability Achievement**: Successfully transformed the system from hardcoded Bangalore-specific to fully configurable universal airport system
- **Centralized Search Configuration**: Added comprehensive searchTerms section to airport-config.json with platform-specific search queries, travel keywords, and user agent strings
- **Dynamic Agent Configuration**: All agent files (reddit-agent.ts, cnn-agent.ts, twitter-agent.ts, facebook-agent.ts) now use AirportConfigHelper methods instead of hardcoded search terms
- **LLM Service Configuration**: Updated llm-service.ts to use dynamic airport references and configurable location keywords throughout chatbot responses
- **Data Collection Centralization**: Replaced all hardcoded User-Agent strings in data-collection.ts with configurable values
- **TypeScript Interface Updates**: Enhanced AirportConfig interface to support new search configuration structure with helper methods

### Previous Enhanced Features:
- **RAG System Complete**: Built proper Retrieval-Augmented Generation using scraped social media data from ChromaDB and in-memory storage
- **MongoDB Integration**: Full database service with source-specific collections (twitter, reddit, facebook, cnn, wion, etc.) and automatic data storage
- **Data Export System**: Download functionality for MongoDB collections in both JSON and CSV formats via Data Management page
- **Chat UI Improvements**: Fixed chat bubble expansion, added auto-focus input field, improved word wrapping for long messages
- **Anti-Hallucination Protection**: AVA chatbot searches actual social media posts before responding, clearly states when no relevant data exists
- **User Management System**: Full RBAC (Role-Based Access Control) with super admin (Pramit), admin, editor, and viewer roles
- **Automatic Data Collection**: Collection starts immediately when API credentials are provided, with automatic MongoDB storage
- **Hugging Face Integration**: Complete migration from OpenAI to Hugging Face API for sentiment analysis and chat responses

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing without unnecessary bloat
- **State Management**: TanStack Query (React Query) for efficient server state management, caching, and data synchronization
- **UI Components**: Radix UI primitives with shadcn/ui components providing accessible, customizable design system
- **Styling**: Tailwind CSS with custom dark theme implementation and responsive design patterns
- **Data Visualization**: Recharts library for interactive charts including line charts, pie charts with proper legends and responsive containers
- **Build Tool**: Vite for fast development server and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using TypeScript and ES modules
- **API Design**: RESTful endpoints serving social events, contact messages, settings, analytics data, data collection services, user management, and LLM query processing
- **Data Validation**: Zod schemas ensuring type-safe request validation and runtime type checking
- **Development Environment**: Hot module replacement integration with Vite for seamless full-stack development
- **User Management**: RBAC system with secure user creation, deletion, and role management
- **LLM Integration**: Intelligent query processing endpoint routing unknown requests to Hugging Face models

### AI and Machine Learning Integration
- **Sentiment Analysis**: Hugging Face API integration using `nlptown/bert-base-multilingual-uncased-sentiment` model for multilingual sentiment scoring
- **Chatbot Service**: Meta Llama 2 7B Chat model (`meta-llama/Llama-2-7b-chat-hf`) for conversational AI functionality
- **Text Embeddings**: Qwen3 Embedding model (`Qwen/Qwen3-Embedding-0.6B`) for semantic text representation
- **Vector Storage**: ChromaDB integration for storing and querying text embeddings, enabling semantic search and event similarity analysis
- **Airport-Specific Analysis**: Custom sentiment categorization for specific airport services including check-in, security, luggage handling, and lounge experiences

### Data Collection Services
- **Multi-Platform Integration**: Automated data collection from Twitter, Reddit, Facebook, YouTube, Instagram, Vimeo, TikTok, and Tumblr
- **News Aggregation**: RSS feed integration for Indian news sources (CNN, AajTak, WION, Zee News, NDTV)
- **Credential Management**: Secure API key storage using base64 encoding with local configuration files
- **Real-time Processing**: Continuous data collection with immediate sentiment analysis and airline/location tagging
- **Focus Filtering**: Bangalore airport and major Indian airline-specific content filtering and categorization

### Data Storage Solutions
- **Current Implementation**: In-memory Map-based storage for rapid development and prototyping
- **Database Architecture**: Drizzle ORM configured for PostgreSQL with comprehensive schema definitions
- **Schema Design**: Enhanced database tables supporting sentiment analysis results, airline mentions, location focus, and engagement metrics
- **Migration Support**: Drizzle Kit integration for database schema management and version control
- **Vector Database**: ChromaDB for high-dimensional text embeddings and semantic search capabilities

## External Dependencies

### AI and Machine Learning Services
- **Hugging Face API**: Primary AI service for sentiment analysis, chatbot functionality, and text embeddings
- **ChromaDB**: Vector database for semantic search and text similarity operations

### Social Media APIs
- **Twitter API v2**: Tweet collection and engagement metrics
- **Reddit API**: Post and comment data from aviation-related subreddits
- **RSS Feeds**: News article collection from major Indian news outlets

### Database and Storage
- **PostgreSQL**: Primary database (configured via Drizzle ORM)
- **Neon Database**: Serverless PostgreSQL provider integration

### Development and Build Tools
- **Vite**: Build tool and development server
- **Replit Integration**: Development environment with cartographer plugin and error overlay
- **TypeScript**: Type system for both frontend and backend code

### UI and Visualization Libraries
- **Radix UI**: Accessible component primitives
- **Recharts**: Chart and data visualization library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Authentication and Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (configured but not actively used in current implementation)