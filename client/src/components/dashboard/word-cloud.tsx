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
        setAllowedWords(['airport','security','security-check','frisk','frisking','kia','kempegowda','check-in','checkin','lounge','lounges','baggage','handling','baggage-handling','luggage-handling','stores','amenities','duty-free','cab','bus','vajra','Vayu','Vayu-Vajra','World-class','worst','terrible','terrific','bad','good','nice','awesome','pleasant','great','best','worse','better','good-to-have','weather','city','far','close','near','road','communication','transport','highway','decoration','decor','terminal','terminals','T1','T2','airlines','Vistara','AirIndia','Air-India','Air-India Express','Express','Indigo','Spicejet','International','Domestic','Gate','Gates','first','last','late','delayed','delay','early','very','night','day','Business','Economy','flight','luggage','experience','service','staff','queue','waiting','time','food','wifi','clean','dirty','fast','slow','excellent','satisfied','disappointed','recommend','avoid','comfortable','uncomfortable','efficient','inefficient','helpful','rude']);
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
    
    // Convert to word cloud format with professional layout
    const sortedWords = Object.entries(wordCount)
      .map(([word, data]) => ({
        word,
        count: data.count,
        sentiment: data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length,
        size: Math.min(40, Math.max(16, 16 + (data.count - 1) * 8)) // Enhanced size range: 16px to 64px
      }))
      .filter(item => item.count >= 5) // Show words mentioned at least once
      .sort((a, b) => b.count - a.count);

    // Add rotation and positioning for professional word cloud effect
    return sortedWords.map((item, index) => ({
      ...item,
      rotation: index % 4 === 0 ? 0 : index % 3 === 0 ? 0 : index % 5 === 0 ? 0 : 0, // Mixed orientations
      opacity: Math.max(0.7, 1 - (index * 0.02)), // Fade effect for lower frequency words
      priority: item.count > 10 ? 'high' : item.count > 7 ? 'medium' : 'low'
    })); // Show all relevant words
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
          Professional word cloud with rotated text • Size = frequency • Colors = sentiment • All filtered words displayed
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative min-h-[300px] p-4 overflow-hidden">
          {wordCloudData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-center">
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