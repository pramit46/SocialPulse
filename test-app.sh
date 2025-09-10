#!/bin/bash

echo "🔍 Testing SocialPulse Application..."

# Test local build
echo "📦 Testing local build..."
npm run start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test API endpoints
echo "🔗 Testing API endpoints..."
curl -s http://localhost:5000/api/health && echo "✅ Health check passed" || echo "❌ Health check failed"
curl -s http://localhost:5000/api/social-events > /dev/null && echo "✅ Social events endpoint working" || echo "❌ Social events endpoint failed"
curl -s http://localhost:5000/api/insights > /dev/null && echo "✅ Insights endpoint working" || echo "❌ Insights endpoint failed"

# Test static files
curl -s http://localhost:5000/ > /dev/null && echo "✅ Static files serving" || echo "❌ Static files failed"

# Clean up
kill $SERVER_PID 2>/dev/null

echo "🎯 Local testing complete!"
echo ""
echo "📋 Next steps for Vercel deployment:"
echo "1. Commit and push your changes"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Deploy to Vercel"
echo ""
echo "🔧 If the app still shows a blank screen on Vercel:"
echo "- Check browser console for JavaScript errors"
echo "- Verify API endpoints are responding"
echo "- Check network tab for failed requests"
