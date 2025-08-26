import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";

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
  if (sentiment >= 0) return "text-gray-300";
  if (sentiment >= -0.3) return "text-yellow-400";
  if (sentiment >= -0.6) return "text-orange-400";
  return "text-red-400";
};

export default function WordCloud() {
  const [allowedWords, setAllowedWords] = useState<string[]>([]);

  // Fetch allowed words from CSV
  useEffect(() => {
    const fetchAllowedWords = async () => {
      try {
        const response = await fetch('/lib/assets/word-cloud-allowed-list.csv');
        if (response.ok) {
          const csvText = await response.text();
          const words = csvText.split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0);
          setAllowedWords(words);
        }
      } catch (error) {
        console.error('Failed to fetch allowed words:', error);
        // Fallback to basic airport-related words
        setAllowedWords(['airport', 'flight', 'delay', 'security', 'luggage', 'service', 'staff', 'queue', 'food', 'lounge']);
      }
    };
    fetchAllowedWords();
  }, []);

  // Fetch real social events data
  const { data: socialEvents, isLoading } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=100');
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
        .filter(word => word.length > 2)
        .filter(word => allowedWords.includes(word)); // Only include allowed words
      
      words.forEach(word => {
        if (!wordCount[word]) {
          wordCount[word] = { count: 0, sentiments: [] };
        }
        wordCount[word].count++;
        wordCount[word].sentiments.push(sentiment);
      });
    });
    
    // Convert to word cloud format with dramatic size differences
    return Object.entries(wordCount)
      .map(([word, data]) => ({
        word,
        count: data.count,
        sentiment: data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length,
        size: Math.min(48, Math.max(14, 14 + (data.count - 1) * 6)) // Dramatic size scaling: 14px to 48px
      }))
      .filter(item => item.count >= 1) // Show words mentioned at least once
      .sort((a, b) => b.count - a.count)
      .slice(0, 25); // Maximum 25 words
  }, [socialEvents, allowedWords]);

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-400" />
            Buzz Words Cloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[180px]">
            <div className="animate-pulse text-gray-400">Analyzing social media buzz...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-400" />
          Buzz Words Cloud
        </CardTitle>
        <p className="text-sm text-gray-400">
          Word size shows frequency • Colors indicate sentiment (green = positive, red = negative)
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 items-center justify-center min-h-[120px] p-2">
          {wordCloudData.length === 0 ? (
            <div className="text-gray-400 text-center">
              <p>No word data available</p>
              <p className="text-sm mt-2">Collect social media data to see trending words</p>
            </div>
          ) : (
            wordCloudData.map((item, index) => (
            <span
              key={index}
              className={`
                inline-block mr-2 mb-1 cursor-pointer transition-all duration-200
                ${getSentimentColor(item.sentiment)}
                hover:opacity-80
              `}
              style={{
                fontSize: `${item.size}px`,
                lineHeight: '1.0',
                fontWeight: item.count > 8 ? '700' : item.count > 5 ? '600' : item.count > 3 ? '500' : '400',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              title={`"${item.word}" appears ${item.count} times - Sentiment: ${(item.sentiment * 100).toFixed(0)}%`}
            >
              {item.word}
            </span>
          )))}
        </div>
        
        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-dark-border">
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-gray-400">Very Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded"></div>
              <span className="text-gray-400">Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-gray-400">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-gray-400">Mixed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span className="text-gray-400">Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-gray-400">Very Negative</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}