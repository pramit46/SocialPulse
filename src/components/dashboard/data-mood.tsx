import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Cell, PieChart, Pie } from 'recharts';
import { Smile, Meh, Frown, TrendingUp, TrendingDown, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { useMemo } from "react";

interface SocialEvent {
  id: string;
  event_content: string;
  platform: string;
  timestamp_utc: string;
  sentiment_analysis: {
    overall_sentiment: number;
    sentiment_score: number;
  };
  airline_mentioned: string | null;
}

export default function DataMoodVisualization() {
  const { data: socialEvents = [] } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events']
  });

  // Process data for mood visualization
  const moodData = useMemo(() => {
    if (!socialEvents.length) return null;

    // Calculate overall mood score (-1 to 1)
    const totalSentiment = socialEvents.reduce((sum, event) => {
      return sum + (event.sentiment_analysis?.overall_sentiment || 0);
    }, 0);
    const averageMood = totalSentiment / socialEvents.length;

    // Categorize sentiments
    const positive = socialEvents.filter(event => 
      (event.sentiment_analysis?.overall_sentiment || 0) > 0.2
    ).length;
    const neutral = socialEvents.filter(event => {
      const sentiment = event.sentiment_analysis?.overall_sentiment || 0;
      return sentiment >= -0.2 && sentiment <= 0.2;
    }).length;
    const negative = socialEvents.filter(event => 
      (event.sentiment_analysis?.overall_sentiment || 0) < -0.2
    ).length;

    // Create hourly mood trend (last 24 hours simulation)
    const hourlyMood = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEvents = socialEvents.filter(event => {
        const eventHour = new Date(event.timestamp_utc || (event as any).created_at);
        return eventHour.getHours() === hour.getHours();
      });
      
      let hourMood = 0;
      if (hourEvents.length > 0) {
        hourMood = hourEvents.reduce((sum, event) => 
          sum + (event.sentiment_analysis?.overall_sentiment || 0), 0
        ) / hourEvents.length;
      }

      hourlyMood.push({
        time: hour.getHours() + ':00',
        mood: Math.max(-1, Math.min(1, hourMood)),
        events: hourEvents.length,
        label: `${hour.getHours()}:00`
      });
    }

    // Platform mood breakdown
    const platformMood = ['Twitter', 'Instagram', 'Reddit'].map(platform => {
      const platformEvents = socialEvents.filter(event => event.platform === platform);
      if (platformEvents.length === 0) return { platform, mood: 0, count: 0 };
      
      const avgMood = platformEvents.reduce((sum, event) => 
        sum + (event.sentiment_analysis?.overall_sentiment || 0), 0
      ) / platformEvents.length;
      
      return {
        platform,
        mood: Math.max(-1, Math.min(1, avgMood)),
        count: platformEvents.length
      };
    });

    // Airline mood comparison
    const airlineMood = ['indigo', 'air_india', 'spicejet', 'vistara'].map(airline => {
      const airlineEvents = socialEvents.filter(event => 
        event.airline_mentioned === airline
      );
      if (airlineEvents.length === 0) return { airline, mood: 0, count: 0 };
      
      const avgMood = airlineEvents.reduce((sum, event) => 
        sum + (event.sentiment_analysis?.overall_sentiment || 0), 0
      ) / airlineEvents.length;
      
      return {
        airline: airline.charAt(0).toUpperCase() + airline.slice(1).replace('_', ' '),
        mood: Math.max(-1, Math.min(1, avgMood)),
        count: airlineEvents.length
      };
    }).filter(item => item.count > 0);

    return {
      overall: {
        mood: averageMood,
        positive,
        neutral,
        negative,
        total: socialEvents.length
      },
      hourly: hourlyMood,
      platforms: platformMood,
      airlines: airlineMood
    };
  }, [socialEvents]);

  if (!moodData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Data Mood
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Loading sentiment data...</p>
        </CardContent>
      </Card>
    );
  }

  // Determine mood icon and color
  const getMoodIcon = (mood: number) => {
    if (mood > 0.2) return <Smile className="h-5 w-5 text-green-500" />;
    if (mood < -0.2) return <Frown className="h-5 w-5 text-red-500" />;
    return <Meh className="h-5 w-5 text-yellow-500" />;
  };

  const getMoodColor = (mood: number) => {
    if (mood > 0.2) return 'text-green-500';
    if (mood < -0.2) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getMoodLabel = (mood: number) => {
    if (mood > 0.4) return 'Very Positive';
    if (mood > 0.2) return 'Positive';
    if (mood > -0.2) return 'Neutral';
    if (mood > -0.4) return 'Negative';
    return 'Very Negative';
  };

  // Colors for sentiment distribution
  const sentimentColors = ['#22c55e', '#eab308', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overall Mood Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Overall Data Mood
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getMoodIcon(moodData.overall.mood)}
              <span className={`text-2xl font-bold ${getMoodColor(moodData.overall.mood)}`}>
                {getMoodLabel(moodData.overall.mood)}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Based on {moodData.overall.total} social media posts
            </p>
          </div>

          {/* Sentiment Distribution */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <ThumbsUp className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-green-500">{moodData.overall.positive}</p>
              <p className="text-xs text-gray-500">Positive</p>
            </div>
            <div>
              <Meh className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-yellow-500">{moodData.overall.neutral}</p>
              <p className="text-xs text-gray-500">Neutral</p>
            </div>
            <div>
              <ThumbsDown className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-red-500">{moodData.overall.negative}</p>
              <p className="text-xs text-gray-500">Negative</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mood Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mood Trend (24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={moodData.hourly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[-1, 1]} />
              <Tooltip 
                formatter={(value: number) => [getMoodLabel(value), 'Mood']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="mood" 
                stroke="#8884d8" 
                fillOpacity={0.6}
                fill="url(#moodGradient)"
              />
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="50%" stopColor="#eab308" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Platform Mood Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {moodData.platforms.map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{platform.platform}</span>
                  <Badge variant="secondary" className="text-xs">
                    {platform.count} posts
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {getMoodIcon(platform.mood)}
                  <span className={`text-sm ${getMoodColor(platform.mood)}`}>
                    {getMoodLabel(platform.mood)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Airline Mood Comparison */}
      {moodData.airlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Airline Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moodData.airlines.map((airline) => (
                <div key={airline.airline} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{airline.airline}</span>
                    <Badge variant="secondary" className="text-xs">
                      {airline.count} mentions
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getMoodIcon(airline.mood)}
                    <span className={`text-sm ${getMoodColor(airline.mood)}`}>
                      {getMoodLabel(airline.mood)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}