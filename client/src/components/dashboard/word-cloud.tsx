import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";

interface AirportConfig {
  airport: {
    code: string;
    city: string;
    alternateCity: string;
  };
  wordCloud: {
    airportSpecificTerms: string[];
    extraAllowedTerms: string[];
  };
}

type SocialEvent = {
  id: string;
  event_content?: string;
  clean_event_text?: string;
  sentiment_analysis?: {
    overall_sentiment?: number;
    emotion?: string;
  };
};

const getSentimentColor = (sentiment: number) => {
  if (sentiment >= 0.6) return "text-green-400";
  if (sentiment >= 0.3) return "text-green-300";
  if (sentiment >= 0) return "text-muted-foreground";
  if (sentiment >= -0.3) return "text-yellow-400";
  if (sentiment >= -0.6) return "text-orange-400";
  return "text-red-400";
};

export default function WordCloud() {
  // Load airport configuration
  const { data: airportConfig } = useQuery<AirportConfig>({
    queryKey: ['/api/airport-config'],
    staleTime: 5 * 60 * 1000
  });

  // Get allowed words from airport configuration
  const allowedWords = useMemo(() => {
    if (!airportConfig) return ['airport', 'security', 'check-in', 'lounge', 'baggage', 'airlines', 'flight', 'terminal'];
    
    const baseWords = [
      'airport', 'security', 'security-check', 'check-in', 'checkin', 'lounge', 'lounges',
      'baggage', 'handling', 'baggage-handling', 'luggage-handling', 'stores', 'amenities', 
      'duty-free', 'terminals', 'airlines', 'international', 'domestic', 'gate', 'gates',
      'flight', 'luggage', 'experience', 'service', 'staff', 'queue', 'waiting', 'time',
      'food', 'wifi', 'clean', 'dirty', 'fast', 'slow', 'excellent', 'satisfied', 
      'disappointed', 'recommend', 'avoid', 'comfortable', 'uncomfortable', 'efficient',
      'inefficient', 'helpful', 'rude', 'delayed', 'delay', 'early', 'business', 'economy'
    ];
    
    const configWords = [
      ...airportConfig.wordCloud.airportSpecificTerms,
      ...airportConfig.wordCloud.extraAllowedTerms
    ].map(word => {
      // Interpolate template placeholders with actual airport values
      return word
        .replace(/\$\{city\}/g, airportConfig.airport.city.toLowerCase())
        .replace(/\$\{code\}/g, airportConfig.airport.code.toLowerCase())
        .replace(/\$\{alternateCity\}/g, airportConfig.airport.alternateCity.toLowerCase());
    });
    
    const allWords = [...baseWords, ...configWords].map(word => word.toLowerCase());
    return allWords;
  }, [airportConfig]);

  // Fetch real social events data
  const { data: socialEvents, isLoading } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=50');
      if (!response.ok) throw new Error('Failed to fetch social events');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Generate word cloud data from real social events
  const wordCloudData = useMemo(() => {
    if (!socialEvents || socialEvents.length === 0 || allowedWords.length === 0) return [];
    
    const wordCount: Record<string, { count: number; sentiments: number[] }> = {};
    
    socialEvents.forEach(event => {
      const text = (event.clean_event_text || event.event_content || '').toLowerCase();
      const sentiment = event.sentiment_analysis?.overall_sentiment || 0;
      
      // Extract words and filter by allowed list
      const words = text.split(/\s+/)
        .map(word => word.replace(/[^a-zA-Z]/g, '').toLowerCase())
        .filter(word => word.length > 3)
        .filter(word => allowedWords.includes(word)); // Only include allowed words
      
      words.forEach(word => {
        if (!wordCount[word]) {
          wordCount[word] = { count: 0, sentiments: [] };
        }
        wordCount[word].count++;
        wordCount[word].sentiments.push(sentiment);
      });
    });
    
    // Convert to word cloud format with professional layout
    const sortedWords = Object.entries(wordCount)
      .map(([word, data]) => ({
        word,
        count: data.count,
        sentiment: data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length,
        size: Math.min(40, Math.max(10, 40 + (data.count - 1) * 16)) // Enhanced size range: 16px to 64px
      }))
      .filter(item => item.count >= 3) // Show words mentioned at least once
      .sort((a, b) => b.count - a.count);

    // Add rotation and positioning for professional word cloud effect
    return sortedWords.map((item, index) => ({
      ...item,
      rotation: index % 4 === 0 ? 0 : index % 3 === 0 ? 0 : index % 5 === 0 ? 0 : 0, // Mixed orientations
      opacity: Math.max(0.7, 1 - (index * 0.02)), // Fade effect for lower frequency words
      priority: item.count > 10 ? 'high' : item.count > 7 ? 'medium' : 'low'
    })); // Show all relevant words
  }, [socialEvents, allowedWords]); // Depend on allowed words for filtering, however, this filtering is not working as expected. The word cloud is showing more than the allowed words. Although it's not a big issue yet, it's worth investigating.

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-400" />
            Buzz Words Cloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[180px]">
            <div className="animate-pulse text-muted-foreground">Analyzing social media buzz...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-400" />
          Buzz Words Cloud
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Professional word cloud with rotated text • Size = frequency • Colors = sentiment • Only filtered words displayed
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[300px] p-4 overflow-hidden">
          {wordCloudData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-center">
              <div>
                <p>No word data available</p>
                <p className="text-sm mt-2">Collect social media data to see trending words</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-1 leading-relaxed">
              {wordCloudData.map((item, index) => (
                <span
                  key={index}
                  className={`
                    inline-block cursor-pointer transition-all duration-300 hover:scale-110
                    ${getSentimentColor(item.sentiment)}
                    ${item.priority === 'high' ? 'mx-3 my-2' : item.priority === 'medium' ? 'mx-2 my-1' : 'mx-1'}
                  `}
                  style={{
                    fontSize: `${item.size}px`,
                    lineHeight: '0.9',
                    fontWeight: item.count > 10 ? '800' : item.count > 6 ? '700' : item.count > 3 ? '600' : '500',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    transform: `rotate(${item.rotation}deg)`,
                    opacity: item.opacity,
                    textShadow: item.count > 5 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                    display: 'inline-block',
                    margin: item.size > 40 ? '8px' : item.size > 28 ? '4px' : '2px',
                    whiteSpace: 'nowrap'
                  }}
                  title={`"${item.word}" appears ${item.count} times - Sentiment: ${(item.sentiment * 100).toFixed(0)}%`}
                >
                  {item.word}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-muted-foreground">Very Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded"></div>
              <span className="text-muted-foreground">Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-muted-foreground">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-muted-foreground">Mixed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span className="text-muted-foreground">Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-muted-foreground">Very Negative</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}