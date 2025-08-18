import MetricsCards from "@/components/dashboard/metrics-cards";
import EngagementChart from "@/components/dashboard/engagement-chart";
import PlatformChart from "@/components/dashboard/platform-chart";
import RecentPosts from "@/components/dashboard/recent-posts";
import InsightsPanel from "@/components/dashboard/insights-panel";
import SentimentAnalysis from "@/components/dashboard/sentiment-analysis";

export default function Dashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Social Pulse</h1>
        <p className="text-gray-400">Monitor and analyze social media performance across all platforms</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="mb-8">
        <MetricsCards />
      </div>

      {/* Sentiment Analysis */}
      <SentimentAnalysis />

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <EngagementChart />
        <PlatformChart />
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
