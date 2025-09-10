# Vercel Deployment Guide for SocialPulse

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

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy!

## Build Configuration

The `vercel.json` file is already configured to:
- Build the application using `npm run build`
- Serve static files from `dist/public`
- Route all requests through the Express server
- Handle both API routes and static file serving

## Important Notes

- Make sure your MongoDB connection string is accessible from Vercel's servers
- The Ollama API base URL should be publicly accessible
- All environment variables must be set in Vercel dashboard, not in the `.env` file (which is ignored for security)
