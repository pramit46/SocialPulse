import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AirportConfig {
  airport: {
    code: string;
    city: string;
    synonyms: string[];
    locationSlug: string;
  };
  airlines: {
    primary: string[];
  };
}

type SocialEvent = {
  id: string;
  platform?: string;
  event_content?: string;
  clean_event_text?: string;
  sentiment_analysis?: {
    overall_sentiment?: number;
    emotion?: string;
  };
  airline_mentions?: string[];
  location_tags?: string[];
};

const getSentimentColor = (value: number) => {
  if (value >= 0.5) return "text-green-400";
  if (value >= 0) return "text-yellow-400";
  return "text-red-400";
};

const getSentimentLabel = (value: number) => {
  if (value >= 0.7) return "Very Positive";
  if (value >= 0.3) return "Positive";
  if (value >= -0.3) return "Neutral";
  if (value >= -0.7) return "Negative";
  return "Very Negative";
};

const formatSentimentValue = (value: number) => {
  return (value * 100).toFixed(0) + "%";
};

export default function SentimentAnalysis() {
  const [isVisible, setIsVisible] = useState(true);
  
  // Load airport configuration
  const { data: airportConfig } = useQuery<AirportConfig>({
    queryKey: ['/api/airport-config'],
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch real social events data
  const { data: socialEvents, isLoading } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=200');
      if (!response.ok) throw new Error('Failed to fetch social events');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Calculate real sentiment data from MongoDB
  const sentimentData = useMemo(() => {
    if (!socialEvents || socialEvents.length === 0 || !airportConfig) {
      return {
        [airportConfig?.airport.locationSlug || 'airport']: { overall_sentiment: 0, categories: {} },
        airlines: {}
      };
    }
    
    // Airport sentiment analysis using configurable synonyms
    const airportSynonyms = airportConfig.airport.synonyms.map(s => s.toLowerCase());
    const airportEvents = socialEvents.filter(event => {
      const text = (event.clean_event_text || event.event_content || '').toLowerCase();
      return airportSynonyms.some(synonym => text.includes(synonym)) ||
             (event.location_tags && event.location_tags.some(tag => 
               airportSynonyms.some(synonym => tag.toLowerCase().includes(synonym))));
    });
    
    const airportSentiments = airportEvents
      .map(event => event.sentiment_analysis?.overall_sentiment || 0)
      .filter(s => s !== 0);
    
    const avgAirportSentiment = airportSentiments.length > 0 
      ? airportSentiments.reduce((sum, s) => sum + s, 0) / airportSentiments.length 
      : 0;
    
    // Category-based sentiment for airport
    const categories: Record<string, number> = {
      security: 0,
      baggage: 0,
      staff: 0,
      facilities: 0,
      food: 0
    };
    
    Object.keys(categories).forEach(category => {
      const categoryEvents = airportEvents.filter(event => {
        const text = (event.clean_event_text || event.event_content || '').toLowerCase();
        return text.includes(category);
      });
      const sentiments = categoryEvents
        .map(event => event.sentiment_analysis?.overall_sentiment || 0)
        .filter(s => s !== 0);
      categories[category] = sentiments.length > 0 
        ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length 
        : 0;
    });
    
    // Airline sentiment analysis using configurable airlines
    const airlines = airportConfig.airlines.primary;
    const airlineData: Record<string, { sentiment: number; mentions: number }> = {};
    
    airlines.forEach(airline => {
      const airlineEvents = socialEvents.filter(event => {
        const text = (event.clean_event_text || event.event_content || '').toLowerCase();
        return text.includes(airline.toLowerCase()) || 
               (event.airline_mentions && event.airline_mentions.some(mention => 
                 mention.toLowerCase().includes(airline.toLowerCase())));
      });
      
      const sentiments = airlineEvents
        .map(event => event.sentiment_analysis?.overall_sentiment || 0)
        .filter(s => s !== 0);
      
      airlineData[airline] = {
        sentiment: sentiments.length > 0 
          ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length 
          : 0,
        mentions: airlineEvents.length
      };
    });
    
    return {
      [airportConfig.airport.locationSlug]: {
        overall_sentiment: avgAirportSentiment,
        categories
      },
      airlines: airlineData
    };
  }, [socialEvents, airportConfig]);

  if (!isVisible) {
    return (
      <div className="mb-8">
        <Button 
          onClick={() => setIsVisible(true)}
          variant="outline"
          className="border-dark-border text-gray-400 hover:text-white hover:bg-dark-accent"
        >
          <Eye className="h-4 w-4 mr-2" />
          Show Sentiment Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Sentiment Analysis</h2>
          <p className="text-gray-400 text-sm">AI-powered sentiment insights for {airportConfig?.airport.city || 'Airport'}</p>
        </div>
        {/* <Button 
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
          
          className="text-gray-400 hover:text-white"
        >
          <EyeOff className="h-4 w-4" />
        </Button> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Sentiment */}
        <Card className="bg-dark-secondary border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">{airportConfig?.airport.city || 'Airport'} Overall</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              {(() => {
                const locationKey = airportConfig?.airport.locationSlug || 'airport';
                const locationData = sentimentData[locationKey] as { overall_sentiment: number; categories: Record<string, number> } || { overall_sentiment: 0, categories: {} };
                return (
                  <>
                    <div className={`text-4xl font-bold mb-2 ${getSentimentColor(locationData.overall_sentiment)}`}>
                      {formatSentimentValue(locationData.overall_sentiment)}
                    </div>
                    <div className="text-gray-400">
                      {getSentimentLabel(locationData.overall_sentiment)}
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="space-y-3">
              {(() => {
                const locationKey = airportConfig?.airport.locationSlug || 'airport';
                const locationData = sentimentData[locationKey] as { overall_sentiment: number; categories: Record<string, number> } || { overall_sentiment: 0, categories: {} };
                return Object.entries(locationData.categories).map(([category, value]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-gray-300 capitalize">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getSentimentColor(value)}`}>
                        {formatSentimentValue(value)}
                      </span>
                      <div className="w-16 h-2 bg-dark-accent rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            value >= 0.5 ? 'bg-green-400' : 
                            value >= 0 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.abs(value) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Airlines Sentiment */}
        <Card className="bg-dark-secondary border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Airlines Sentiment Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(sentimentData.airlines).map(([airline, data]) => (
                <div key={airline} className="flex justify-between items-center p-3 bg-dark-accent rounded-lg">
                  <div>
                    <div className="font-medium text-white capitalize">
                      {airline.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-400">
                      {data.mentions} mentions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getSentimentColor(data.sentiment)}`}>
                      {formatSentimentValue(data.sentiment)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getSentimentLabel(data.sentiment)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="animate-pulse text-gray-400 text-center py-4">
                Loading sentiment analysis...
              </div>
            ) : (
              <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="text-sm text-blue-400 font-medium mb-1">
                  AI Insight
                </div>
                <div className="text-xs text-gray-300">
                  {Object.values(sentimentData.airlines).some(a => a.mentions > 0) 
                    ? `Analysis based on ${Object.values(sentimentData.airlines).reduce((sum, a) => sum + a.mentions, 0)} real social media mentions` 
                    : 'No airline mentions found in recent data. Collect more social media data for insights.'
                  }
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}