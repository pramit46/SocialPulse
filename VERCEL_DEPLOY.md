# Vercel Deployment Guide for SocialPulse

## Fixed Issues ✅

- **TypeScript compilation errors** - Fixed missing imports and type declarations
- **Bundle size optimization** - Moved heavy dependencies to optionalDependencies
- **Serverless compatibility** - Created lightweight API handler for Vercel
- **Static file serving** - Properly configured for production deployment
- **Build dependencies** - Moved Vite and build tools to regular dependencies for Vercel

## Environment Variables Required

In your Vercel dashboard, add these environment variables:

```
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
OLLAMA_API_BASE_URL=your_ollama_api_url
MONGODB_CONNECTION_STRING=your_mongodb_connection_string
MONGODB_DATABASE_NAME=your_database_name
NODE_ENV=production
```

## Deployment Steps

1. **Commit and push these changes** to your GitHub repository
2. **Set the environment variables** in Vercel dashboard  
3. **Deploy!** - Vercel will automatically use the optimized configuration

## Build Configuration

The `vercel.json` file is configured to:
- Build the application using `npm run build`
- Use lightweight serverless function (reduced bundle size)
- Serve static files from `dist/public`
- Route all requests through the optimized Express server
- Handle both API routes and static file serving

## Optimizations Made

- **Fixed build dependencies** - Moved Vite, esbuild, and PostCSS to dependencies
- **Excluded ChromaDB** from serverless deployment (too heavy for Vercel)
- **Moved optional dependencies** to reduce function size
- **Simplified API routes** for core functionality only
- **Fixed TypeScript errors** for clean compilation
- **Optimized imports** to reduce bundle overhead

## Important Notes

- Some advanced features (ChromaDB, AI insights) are disabled in production
- The core functionality (dashboard, MongoDB, basic APIs) works fully
- Make sure your MongoDB connection string is accessible from Vercel's servers
- The Ollama API base URL should be publicly accessible
- All environment variables must be set in Vercel dashboard, not in the `.env` file

## Core Features Available in Production

✅ **Dashboard** - Full React application  
✅ **MongoDB Integration** - Data storage and retrieval  
✅ **Contact Forms** - Message handling  
✅ **Social Events API** - Basic data endpoints  
✅ **Health Checks** - System status monitoring  

## Disabled for Serverless

❌ **ChromaDB** - Vector database (too heavy)  
❌ **AI Insight Generation** - OpenAI integration  
❌ **Real-time Data Collection** - Background agents  
❌ **WebSocket Support** - Real-time features

## Build Dependencies in Production

The following build tools are now in regular dependencies for Vercel compatibility:
- `vite` - Frontend build tool
- `esbuild` - Server bundling
- `@vitejs/plugin-react` - React support
- `autoprefixer` - CSS processing
- `postcss` - CSS processing
- `tailwindcss` - Styling framework
