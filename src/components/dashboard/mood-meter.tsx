import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Heart, Zap, CloudLightning, Sun, Cloud } from "lucide-react";
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

export default function MoodMeter() {
  const { data: socialEvents = [] } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events']
  });

  const moodMetrics = useMemo(() => {
    if (!socialEvents.length) return null;

    const sentiments = socialEvents.map(event => 
      event.sentiment_analysis?.overall_sentiment || 0
    );

    const totalSentiment = sentiments.reduce((sum, sentiment) => sum + sentiment, 0);
    const averageMood = totalSentiment / sentiments.length;

    // Calculate mood intensity (0-100)
    const moodIntensity = Math.round(((averageMood + 1) / 2) * 100);
    
    // Recent mood trend (last vs previous half)
    const halfPoint = Math.floor(socialEvents.length / 2);
    const recentHalf = sentiments.slice(0, halfPoint);
    const previousHalf = sentiments.slice(halfPoint);
    
    const recentAvg = recentHalf.length ? 
      recentHalf.reduce((sum, s) => sum + s, 0) / recentHalf.length : 0;
    const previousAvg = previousHalf.length ? 
      previousHalf.reduce((sum, s) => sum + s, 0) / previousHalf.length : 0;
    
    const trendDirection = recentAvg > previousAvg ? 'up' : 
                          recentAvg < previousAvg ? 'down' : 'stable';

    // Emotional categories
    const emotions = {
      joy: sentiments.filter(s => s > 0.6).length,
      satisfaction: sentiments.filter(s => s > 0.2 && s <= 0.6).length,
      neutral: sentiments.filter(s => s >= -0.2 && s <= 0.2).length,
      frustration: sentiments.filter(s => s >= -0.6 && s < -0.2).length,
      anger: sentiments.filter(s => s < -0.6).length,
    };

    return {
      averageMood,
      moodIntensity,
      trendDirection,
      emotions,
      totalEvents: socialEvents.length
    };
  }, [socialEvents]);

  if (!moodMetrics) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Heart className="h-5 w-5 text-pink-400" />
            Passenger Mood Meter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Analyzing passenger emotions...</p>
        </CardContent>
      </Card>
    );
  }

  // Determine mood visual elements
  const getMoodData = (mood: number) => {
    if (mood > 0.4) return {
      color: 'from-green-400 to-emerald-600',
      icon: <Sun className="h-8 w-8 text-yellow-400" />,
      label: 'Delighted',
      description: 'Passengers are having excellent experiences!',
      bgColor: 'from-green-900/20 to-emerald-900/30'
    };
    if (mood > 0.1) return {
      color: 'from-blue-400 to-cyan-600',
      icon: <Cloud className="h-8 w-8 text-blue-400" />,
      label: 'Satisfied',
      description: 'Generally positive passenger feedback',
      bgColor: 'from-blue-900/20 to-cyan-900/30'
    };
    if (mood > -0.1) return {
      color: 'from-yellow-400 to-orange-500',
      icon: <CloudLightning className="h-8 w-8 text-yellow-500" />,
      label: 'Mixed',
      description: 'Balanced mix of experiences reported',
      bgColor: 'from-yellow-900/20 to-orange-900/30'
    };
    if (mood > -0.4) return {
      color: 'from-orange-500 to-red-500',
      icon: <Zap className="h-8 w-8 text-orange-500" />,
      label: 'Concerned',
      description: 'Some passenger concerns noted',
      bgColor: 'from-orange-900/20 to-red-900/30'
    };
    return {
      color: 'from-red-500 to-pink-600',
      icon: <CloudLightning className="h-8 w-8 text-red-500" />,
      label: 'Upset',
      description: 'Significant passenger frustrations detected',
      bgColor: 'from-red-900/20 to-pink-900/30'
    };
  };

  const moodData = getMoodData(moodMetrics.averageMood);

  return (
    <Card className={`bg-gradient-to-br ${moodData.bgColor} border-purple-500/20`}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-400" />
            <span className="text-sm font-semibold">Passenger Mood</span>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-white/10 text-white border-white/20 text-xs"
          >
            {moodMetrics.totalEvents}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-2">
        {/* Main Mood Display */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="scale-75">{moodData.icon}</div>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{moodData.label}</h3>
          <p className="text-gray-300 text-xs mb-3">{moodData.description}</p>
          
          {/* Mood Intensity Bar */}
          <div className="relative">
            <Progress 
              value={moodMetrics.moodIntensity} 
              className="h-3 bg-gray-700"
            />
            <div className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${moodData.color} opacity-80`} 
                 style={{ width: `${moodMetrics.moodIntensity}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Very Negative</span>
            <span className="text-white font-medium">{moodMetrics.moodIntensity}%</span>
            <span>Very Positive</span>
          </div>
        </div>

        {/* Emotion Breakdown - Compact */}
        <div className="grid grid-cols-5 gap-1 text-center">
          <div>
            <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-1 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{moodMetrics.emotions.joy}</span>
            </div>
            <p className="text-xs text-gray-400">Joy</p>
          </div>
          <div>
            <div className="w-6 h-6 bg-blue-500 rounded-full mx-auto mb-1 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{moodMetrics.emotions.satisfaction}</span>
            </div>
            <p className="text-xs text-gray-400">Happy</p>
          </div>
          <div>
            <div className="w-6 h-6 bg-yellow-500 rounded-full mx-auto mb-1 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{moodMetrics.emotions.neutral}</span>
            </div>
            <p className="text-xs text-gray-400">Neutral</p>
          </div>
          <div>
            <div className="w-6 h-6 bg-orange-500 rounded-full mx-auto mb-1 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{moodMetrics.emotions.frustration}</span>
            </div>
            <p className="text-xs text-gray-400">Upset</p>
          </div>
          <div>
            <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-1 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{moodMetrics.emotions.anger}</span>
            </div>
            <p className="text-xs text-gray-400">Angry</p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10">
          <span className="text-gray-400 text-sm">Recent trend:</span>
          <Badge 
            variant={moodMetrics.trendDirection === 'up' ? 'default' : 
                    moodMetrics.trendDirection === 'down' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {moodMetrics.trendDirection === 'up' ? '📈 Improving' : 
             moodMetrics.trendDirection === 'down' ? '📉 Declining' : '➡️ Stable'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}