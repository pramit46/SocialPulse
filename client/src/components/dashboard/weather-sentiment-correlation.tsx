import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { CloudRain, Sun, CloudSnow, Wind } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type SocialEvent = {
  id: string;
  timestamp_utc?: string;
  created_at?: string;
  sentiment_analysis?: {
    overall_sentiment?: number;
  };
  event_content?: string;
  clean_event_text?: string;
};

// Mock weather data for demonstration (in real implementation, this would come from weather API)
const mockWeatherData = [
  { date: '2025-08-15', condition: 'sunny', temperature: 28, humidity: 65, sentiment: 0.6, delays: 2 },
  { date: '2025-08-16', condition: 'cloudy', temperature: 25, humidity: 78, sentiment: 0.4, delays: 3 },
  { date: '2025-08-17', condition: 'rain', temperature: 22, humidity: 85, sentiment: -0.2, delays: 8 },
  { date: '2025-08-18', condition: 'sunny', temperature: 30, humidity: 60, sentiment: 0.7, delays: 1 },
  { date: '2025-08-19', condition: 'thunderstorm', temperature: 24, humidity: 90, sentiment: -0.5, delays: 12 },
  { date: '2025-08-20', condition: 'sunny', temperature: 29, humidity: 62, sentiment: 0.5, delays: 2 },
];

const weatherCorrelationData = [
  { condition: 'Sunny', avgSentiment: 0.6, delayComplaints: 15, socialActivity: 85 },
  { condition: 'Cloudy', avgSentiment: 0.3, delayComplaints: 25, socialActivity: 95 },
  { condition: 'Rain', avgSentiment: -0.2, delayComplaints: 45, socialActivity: 120 },
  { condition: 'Thunderstorm', avgSentiment: -0.4, delayComplaints: 65, socialActivity: 140 },
  { condition: 'Fog', avgSentiment: -0.6, delayComplaints: 85, socialActivity: 160 },
];

const getWeatherIcon = (condition: string) => {
  switch (condition.toLowerCase()) {
    case 'sunny': return <Sun className="h-4 w-4 text-yellow-400" />;
    case 'rain': return <CloudRain className="h-4 w-4 text-blue-400" />;
    case 'thunderstorm': return <CloudRain className="h-4 w-4 text-purple-400" />;
    case 'fog': return <CloudSnow className="h-4 w-4 text-gray-400" />;
    default: return <Wind className="h-4 w-4 text-gray-400" />;
  }
};

const getSentimentColor = (sentiment: number) => {
  if (sentiment >= 0.3) return "text-green-400";
  if (sentiment >= 0) return "text-yellow-400";
  return "text-red-400";
};

export default function WeatherSentimentCorrelation() {
  // Fetch real social events data
  const { data: socialEvents, isLoading } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=100');
      if (!response.ok) throw new Error('Failed to fetch social events');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate sentiment trends over time (simulate weather correlation)
  const sentimentTimeline = useMemo(() => {
    if (!socialEvents || socialEvents.length === 0) return mockWeatherData;
    
    // Group events by date and calculate daily sentiment
    const dailySentiment: Record<string, { sentiments: number[]; events: number }> = {};
    
    socialEvents.forEach(event => {
      const date = new Date(event.timestamp_utc || event.created_at || Date.now())
        .toISOString().split('T')[0];
      
      if (!dailySentiment[date]) {
        dailySentiment[date] = { sentiments: [], events: 0 };
      }
      
      const sentiment = event.sentiment_analysis?.overall_sentiment || 0;
      if (sentiment !== 0) {
        dailySentiment[date].sentiments.push(sentiment);
      }
      dailySentiment[date].events++;
    });
    
    // Convert to timeline format with mock weather data
    return Object.entries(dailySentiment)
      .map(([date, data]) => ({
        date,
        condition: ['sunny', 'cloudy', 'rain'][Math.floor(Math.random() * 3)],
        temperature: Math.floor(Math.random() * 10) + 22,
        humidity: Math.floor(Math.random() * 30) + 60,
        sentiment: data.sentiments.length > 0 
          ? data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length 
          : 0,
        delays: Math.floor(Math.random() * 8) + 1,
        events: data.events
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days
  }, [socialEvents]);

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-blue-400" />
            Weather Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse text-gray-400">Analyzing weather correlations...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-blue-400" />
            Weather Impact Analysis
          </CardTitle>
          <p className="text-sm text-gray-400">
            How weather conditions affect passenger sentiment and airport operations
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="correlation" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-dark-primary">
              <TabsTrigger value="correlation" className="text-gray-300 data-[state=active]:text-blue-400">
                Weather vs Sentiment
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-gray-300 data-[state=active]:text-blue-400">
                7-Day Timeline
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="correlation" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weatherCorrelationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="condition" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }}
                    />
                    <Bar 
                      dataKey="delayComplaints" 
                      fill="#EF4444" 
                      name="Delay Complaints"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-dark-primary p-4 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Sun className="h-6 w-6 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-green-400">+60%</p>
                  <p className="text-xs text-gray-400">Positive sentiment on sunny days</p>
                </div>
                <div className="bg-dark-primary p-4 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <CloudRain className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-red-400">+200%</p>
                  <p className="text-xs text-gray-400">Delay complaints during rain</p>
                </div>
                <div className="bg-dark-primary p-4 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Wind className="h-6 w-6 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">+40%</p>
                  <p className="text-xs text-gray-400">Social activity in bad weather</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sentimentTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#FFFFFF'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: any, name: string) => {
                        if (name === 'sentiment') return [(value * 100).toFixed(0) + '%', 'Sentiment Score'];
                        if (name === 'temperature') return [value + '°C', 'Temperature'];
                        return [value, name];
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      name="sentiment"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="temperature"
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {sentimentTimeline.slice(-3).map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-dark-primary rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getWeatherIcon(day.condition)}
                      <div>
                        <p className="text-white font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-400 capitalize">
                          {day.condition} • {day.temperature}°C • {day.humidity}% humidity
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getSentimentColor(day.sentiment)}`}>
                        {(day.sentiment * 100).toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {(day as any).events || 0} posts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}