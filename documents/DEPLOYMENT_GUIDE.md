# Universal Airport Social Media Analytics Dashboard - Deployment Guide

## Overview
This is a comprehensive client-server deployment guide for the Universal Airport Social Media Analytics Dashboard. The application features real-time data collection, AI-powered sentiment analysis, and comprehensive dashboard analytics. **The system is fully configurable for any airport worldwide** through the `config/airport-config.json` file.

## Architecture Overview

### Client-Server Model Components

#### **Unified Application Architecture**
- **Integrated Frontend + Backend**: Single Node.js Express server with embedded Vite dev server
- **React 18 Application** with TypeScript served via Vite integration
- **UI Framework**: Radix UI + shadcn/ui components with Tailwind CSS
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query (React Query) for server state
- **Database Services**: MongoDB Atlas + ChromaDB (vector database)
- **AI Services**: Local Ollama integration for complete data privacy
- **Data Collection**: 5 specialized multi-platform social media agents
- **Real-time Features**: Integrated via unified server architecture

**Note**: This application uses a unified server architecture where Express serves both API endpoints and the frontend via integrated Vite. Do not modify `vite.config.ts` as it's pre-configured for this unified setup.

---

## Pre-Installation Dependencies

### **System Requirements**

#### **Frontend Server Requirements**
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **Memory**: Minimum 2GB RAM
- **Storage**: 5GB available space
- **Ports**: 3000 (or configurable)

#### **Backend Server Requirements**
- **Node.js**: v18 or higher with ESM support
- **Python**: v3.8+ (for ChromaDB)
- **pip**: Latest version
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 20GB available space
- **Ports**: 5000 (API), 8000 (ChromaDB), 11434 (Ollama)

### **External Dependencies**

#### **Database Services**
- **MongoDB Atlas**: Cloud database cluster
- **PostgreSQL**: For session storage (optional)
- **ChromaDB**: Vector database for embeddings

#### **AI/ML Services**
- **Ollama**: Local LLM server for deepseek-r1:8b model
- **Hugging Face API**: For sentiment analysis and embeddings

#### **Social Media APIs**
- **Twitter API v2**: Bearer token required
- **Reddit API**: Client ID and Secret required
- **Facebook Graph API**: Access token required

---

## 🌍 Airport Configuration

### **Configuring for Your Airport**
The system is designed to work with any airport worldwide. Before deployment, configure your target airport:

#### **1. Edit Airport Configuration**
```bash
# Edit the main configuration file
nano config/airport-config.json
```

#### **2. Update Airport Details**
```json
{
  "airport": {
    "code": "LAX",           // Your airport code
    "city": "Los Angeles",   // Primary city name
    "alternateCity": "LA",   // Alternate/short city name
    "airportName": "Los Angeles International Airport",
    "synonyms": ["lax", "los angeles", "los angeles airport"]
  },
  "airlines": {
    "primary": ["american", "delta", "united", "southwest"]  // Local airlines
  }
}
```

#### **3. System Auto-Configuration**
Once updated, the entire system automatically adapts:
- ✅ UI labels update to show your city/airport code
- ✅ Data collection agents filter for your airport
- ✅ ChromaDB collections renamed with your airport slug
- ✅ Chatbot responses localize to your airport
- ✅ Word cloud includes airport-specific terms

---

## Step-by-Step Installation Process

### **Phase 1: Backend Server Setup**

#### **1. Server Environment Setup**
```bash
# Create deployment directory
mkdir social-analytics-backend
cd social-analytics-backend

# Clone or copy backend files
git clone <repository-url> .
# OR copy these directories: server/, shared/, package.json

# Install Node.js dependencies
npm install

# Install system dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install python3 python3-pip curl build-essential

# Install ChromaDB
pip3 install chromadb==3.0.12
```

#### **2. Database Setup**

**MongoDB Atlas:**
```bash
# Create MongoDB Atlas cluster at https://cloud.mongodb.com
# Get connection string in format:
# mongodb+srv://username:password@cluster.mongodb.net/database_name

# Create database: airport_analytics (or use configured airport name)
# Create collections: social_events, users, settings, insights, weather_data
```

**PostgreSQL (Optional - for sessions):**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb social_analytics_sessions
sudo -u postgres createuser analytics_user
sudo -u postgres psql -c "ALTER USER analytics_user PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE social_analytics_sessions TO analytics_user;"
```

#### **3. AI Services Setup**

**Ollama Installation:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
systemctl enable ollama
systemctl start ollama

# Pull required model
ollama pull deepseek-r1:8b

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

**ChromaDB Setup:**
```bash
# ChromaDB will auto-start via the application
# Verify installation
python3 -c "import chromadb; print('ChromaDB installed successfully')"
```

#### **4. Environment Configuration**
Create `.env` file in backend root:
```env
# Database Configuration
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE_NAME=airport_analytics
DATABASE_URL=postgresql://analytics_user:secure_password@localhost:5432/social_analytics_sessions

# AI Services
OLLAMA_API_BASE_URL=http://localhost:11434

# Social Media APIs
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token

# Server Configuration
PORT=5000
NODE_ENV=production
```

#### **5. Backend Application Start**
```bash
# Build the application
npm run build

# Start production server
npm run start

# Verify backend is running
curl http://localhost:5000/api/mongodb/status
```

### **Phase 2: Production Deployment** 

#### **1. Unified Application Deployment**
This application uses a unified architecture where a single Express server serves both the API and frontend via integrated Vite.

**For production deployment:**
```bash
# Build the application (if needed)
npm run build

# Start production server (unified Express + Vite)
npm run start

# For development
npm run dev
```

**Important Notes:**
- ✅ Do not modify `vite.config.ts` - it's pre-configured for unified architecture
- ✅ Single server handles both frontend and API endpoints
- ✅ No separate nginx or frontend server setup required
- ✅ All configuration through `config/airport-config.json`

#### **2. Verify Deployment**
```bash
# Check application is running
curl http://localhost:5000/api/airport-config

# Check AI services
curl http://localhost:5000/api/social-events

# Access web interface
open http://localhost:5000
```

---

## Infrastructure Requirements

### **Minimum Server Specifications**

#### **Application Server (Unified Frontend + Backend)**
- **CPU**: 4 cores (for AI processing and frontend serving)
- **RAM**: 8GB (4GB for Ollama, 2GB for Node.js, 2GB for databases) 
- **Storage**: 50GB SSD (20GB for models, 10GB for databases, 20GB for logs)
- **Network**: 100Mbps uplink
- **OS**: Ubuntu 22.04 LTS or CentOS 8

### **Database Infrastructure**
- **MongoDB Atlas**: M10 cluster minimum (2GB RAM, 10GB storage)
- **PostgreSQL**: 1GB RAM, 5GB storage (if using sessions)
- **ChromaDB**: Embedded with backend server

### **External Service Dependencies**
- **Ollama Models**: deepseek-r1:8b (~5GB)
- **API Rate Limits**: Twitter (300 requests/15min), Reddit (60 requests/min)
- **Backup Storage**: 100GB for data backups

---

## Complete API Endpoints Documentation

### **Core Application APIs**

#### **Contact & Communication**
- `POST /api/contact` - Submit contact form messages
- `POST /api/ava/chat` - Chat with AVA (AI assistant)
- `POST /api/query` - General LLM query processing

#### **Social Media Data**
- `GET /api/social-events` - Retrieve all social media events
- `POST /api/social-events` - Create new social media event
- `POST /api/collect-data` - Initiate data collection from sources
- `GET /api/collector-status` - Check data collection agent status
- `POST /api/test-collectors` - Test data collection agents

#### **User Management**
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/:id` - Delete user by ID

#### **Settings & Configuration**
- `GET /api/settings/:userId` - Get user settings
- `POST /api/settings` - Update user settings

#### **Analytics & Insights**
- `GET /api/analytics/metrics` - Dashboard metrics
- `GET /api/analytics/charts` - Chart data for visualizations
- `GET /api/insights` - AI-generated business insights

#### **Database Management**
- `POST /api/mongodb/connect` - Connect to MongoDB
- `GET /api/mongodb/status` - MongoDB connection status
- `GET /api/mongodb/data-sources` - List available collections
- `GET /api/mongodb/download/:sourceName` - Download collection data (JSON/CSV)
- `POST /api/mongodb/migrate-existing-data` - Migrate legacy data

#### **Weather Analytics**
- `GET /api/weather/conditions` - Current weather conditions
- `GET /api/weather/alerts` - Weather alerts and notifications
- `DELETE /api/weather/alerts` - Clear weather alerts
- `GET /api/weather/correlations` - Weather-sentiment correlations
- `GET /api/weather/forecast` - Weather forecast data
- `POST /api/weather/seed` - Seed sample weather data

#### **Vector Database (ChromaDB)**
- `POST /api/chromadb/populate-embeddings` - Populate vector embeddings

#### **System & Testing**
- `POST /api/migrate-mock-data` - Migrate mock data to production
- `GET /api/ava/verify-user-field` - Verify AVA user field structure
- `POST /api/test/reddit-embeddings` - Test Reddit data embeddings

#### **Static Assets**
- `GET /lib/assets/word-cloud-allowed-list.csv` - Word cloud filter configuration

---

## Application Startup Process

### **Backend Startup Sequence**
1. **Environment Variables**: Load from `.env` file
2. **Database Connections**: Connect to MongoDB Atlas
3. **ChromaDB Initialization**: Start vector database service
4. **Agent Manager**: Initialize social media collection agents
5. **LLM Service**: Connect to Ollama and Hugging Face
6. **Express Server**: Start API server on port 5000
7. **Data Collection**: Auto-start scheduled data collection

### **Frontend Startup Sequence**
1. **Vite Development Server**: Hot module replacement in dev mode
2. **Static File Serving**: Production build serving in production
3. **API Proxy**: Route API calls to backend server
4. **React Application**: Initialize single-page application
5. **Theme Provider**: Setup dark/light theme system
6. **Query Client**: Initialize TanStack Query for state management

### **Production Deployment Commands**
```bash
# Backend
cd social-analytics-backend
npm run build
npm run start

# Frontend  
cd social-analytics-frontend
npm run build
npx serve dist/public -l 3000

# Or with nginx
sudo systemctl start nginx
```

---

## Additional Recommendations

### **Security Considerations**
- **API Rate Limiting**: Implement rate limiting for all endpoints
- **CORS Configuration**: Restrict origins to frontend domain only
- **Environment Variables**: Never commit API keys to version control
- **HTTPS**: Use SSL certificates for production deployment
- **Database Security**: Enable MongoDB Atlas network access restrictions

### **Performance Optimization**
- **CDN**: Use CloudFlare or AWS CloudFront for static assets
- **Caching**: Implement Redis for API response caching
- **Load Balancing**: Use nginx or AWS ALB for multiple backend instances
- **Database Indexing**: Optimize MongoDB queries with proper indexes
- **Connection Pooling**: Configure MongoDB connection pools

### **Monitoring & Logging**
- **Application Monitoring**: Setup logging with Winston or Pino
- **Database Monitoring**: MongoDB Atlas monitoring dashboard
- **Error Tracking**: Integrate Sentry or similar error tracking
- **Performance Monitoring**: Setup New Relic or DataDog
- **Uptime Monitoring**: Use Pingdom or UptimeRobot

### **Backup Strategy**
- **Database Backups**: Daily MongoDB Atlas automated backups
- **Code Backups**: Git repository with automated deployment
- **Configuration Backups**: Environment variables in secure vault
- **Data Export**: Regular exports of social media data collections

This deployment guide provides a complete production-ready setup for the Social Media Analytics Dashboard in a client-server architecture across separate hosts.