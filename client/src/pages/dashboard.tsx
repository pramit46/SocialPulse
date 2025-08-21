import WordCloud from "@/components/dashboard/word-cloud";
import PlatformChart from "@/components/dashboard/platform-chart";
import RecentPosts from "@/components/dashboard/recent-posts";
import InsightsPanel from "@/components/dashboard/insights-panel";
import SentimentAnalysis from "@/components/dashboard/sentiment-analysis";
import EngagementTrends from "@/components/dashboard/engagement-trends";
import DataMoodVisualization from "@/components/dashboard/data-mood";
import MoodMeter from "@/components/dashboard/mood-meter";
import WeatherSentimentCorrelation from "@/components/dashboard/weather-sentiment-correlation";
import WeatherAlerts from "@/components/dashboard/weather-alerts";
import WeatherForecastPanel from "@/components/dashboard/weather-forecast-panel";

export default function Dashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Social Pulse</h1>
        <p className="text-gray-400">Monitor and analyze social media performance across all platforms</p>
      </div>

      {/* Sentiment Analysis */}
      <SentimentAnalysis />

      {/* Weather Correlation Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">☁️ Weather Impact Analysis</h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <WeatherSentimentCorrelation />
          <WeatherAlerts />
          <WeatherForecastPanel />
        </div>
      </div>

      {/* Data Mood Visualization */}
      <div className="mb-8">
        <DataMoodVisualization />
      </div>

      {/* Charts and Analytics */}
      <div className="mb-8">
        <WordCloud />       
      </div>

      {/* Mood Meter and Engagement Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <MoodMeter />
        <PlatformChart />        
      </div>

      {/* Engagement Trends */}
      <div className="mb-8">
        <EngagementTrends />
      </div>

      {/* Recent Posts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentPosts />
        </div>
        <InsightsPanel />
      </div>
    </div>
  );
}
