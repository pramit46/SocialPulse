import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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

const getSentimentBg = (sentiment: number) => {
  if (sentiment >= 0.6) return "bg-green-400/5 hover:bg-green-400/10";
  if (sentiment >= 0.3) return "bg-green-300/5 hover:bg-green-300/10";
  if (sentiment >= 0) return "bg-gray-300/5 hover:bg-gray-300/10";
  if (sentiment >= -0.3) return "bg-yellow-400/5 hover:bg-yellow-400/10";
  if (sentiment >= -0.6) return "bg-orange-400/5 hover:bg-orange-400/10";
  return "bg-red-400/5 hover:bg-red-400/10";
};

export default function WordCloud() {
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
    if (!socialEvents || socialEvents.length === 0) return [];
    
    const wordCount: Record<string, { count: number; sentiments: number[] }> = {};
    
    socialEvents.forEach(event => {
      const text = (event.clean_event_text || event.event_content || '').toLowerCase();
      const sentiment = event.sentiment_analysis?.overall_sentiment || 0;
      
      // Extract meaningful words (filter common words)
      const words = text.split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'what', 'when', 'where', 'will', 'there', 'their', 'would', 'could', 'should', 'about', 'after', 'before', 'during', 'while', 'under', 'over', 'through'].includes(word))
        .filter(word => word.match(/^[a-zA-Z]+$/)); // Only alphabetic words
      
      words.forEach(word => {
        if (!wordCount[word]) {
          wordCount[word] = { count: 0, sentiments: [] };
        }
        wordCount[word].count++;
        wordCount[word].sentiments.push(sentiment);
      });
    });
    
    // Convert to word cloud format and sort by frequency
    return Object.entries(wordCount)
      .map(([word, data]) => ({
        word,
        count: data.count,
        sentiment: data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length,
        size: Math.min(32, Math.max(10, Math.log2(data.count + 1) * 8)) // Logarithmic scaling based on occurrence frequency
      }))
      .filter(item => item.count >= 2) // Only show words mentioned at least twice
      .sort((a, b) => b.count - a.count)
      .slice(0, 25); // Top 25 words
  }, [socialEvents]);

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
            <div
              key={index}
              className={`
                inline-block px-2 py-0.5 rounded cursor-pointer transition-all duration-200
                ${getSentimentColor(item.sentiment)} 
                ${getSentimentBg(item.sentiment)}
                hover:scale-110 hover:shadow-lg
              `}
              style={{
                fontSize: `${Math.max(10, item.size * 0.7)}px`,
                lineHeight: '1.2',
                fontWeight: item.size > 20 ? '500' : '400'
              }}
              title={`"${item.word}" - ${item.count} mentions - Sentiment: ${(item.sentiment * 100).toFixed(0)}%`}
            >
              {item.word}
            </div>
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