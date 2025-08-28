import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [openSections, setOpenSections] = useState({
    sentiment: true,
    weather: true,
    mood: true,
    wordCloud: true,
    charts: true,
    engagement: true,
    posts: true
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, isOpen, onToggle }: { title: string; isOpen: boolean; onToggle: () => void }) => (
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        className="w-full justify-between p-0 mb-4 text-xl font-semibold text-white hover:text-blue-400"
        onClick={onToggle}
      >
        {title}
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </Button>
    </CollapsibleTrigger>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Social Pulse</h1>
        <p className="text-gray-400">Monitor and analyze social media performance across all platforms</p>
      </div>

      {/* Sentiment Analysis */}
      <Collapsible open={openSections.sentiment} className="mb-8">
        <SectionHeader 
          title="📊 Sentiment Analysis" 
          isOpen={openSections.sentiment} 
          onToggle={() => toggleSection('sentiment')} 
        />
        <CollapsibleContent>
          <SentimentAnalysis />
        </CollapsibleContent>
      </Collapsible>

      {/* Weather Correlation Section */}
      <Collapsible open={openSections.weather} className="mb-8">
        <SectionHeader 
          title="☁️ Weather Impact Analysis" 
          isOpen={openSections.weather} 
          onToggle={() => toggleSection('weather')} 
        />
        <CollapsibleContent>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <WeatherSentimentCorrelation />
            <WeatherAlerts />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Data Mood Visualization */}
      <Collapsible open={openSections.mood} className="mb-8">
        <SectionHeader 
          title="🎭 Data Mood Visualization" 
          isOpen={openSections.mood} 
          onToggle={() => toggleSection('mood')} 
        />
        <CollapsibleContent>
          <DataMoodVisualization />
        </CollapsibleContent>
      </Collapsible>

      {/* Word Cloud */}
      <Collapsible open={openSections.wordCloud} className="mb-8">
        <SectionHeader 
          title="☁️ Word Cloud Analytics" 
          isOpen={openSections.wordCloud} 
          onToggle={() => toggleSection('wordCloud')} 
        />
        <CollapsibleContent>
          <WordCloud />
        </CollapsibleContent>
      </Collapsible>

      {/* Charts */}
      <Collapsible open={openSections.charts} className="mb-8">
        <SectionHeader 
          title="📈 Metrics & Platform Charts" 
          isOpen={openSections.charts} 
          onToggle={() => toggleSection('charts')} 
        />
        <CollapsibleContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MoodMeter />
            <PlatformChart />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Engagement Trends */}
      <Collapsible open={openSections.engagement} className="mb-8">
        <SectionHeader 
          title="📊 Engagement Trends" 
          isOpen={openSections.engagement} 
          onToggle={() => toggleSection('engagement')} 
        />
        <CollapsibleContent>
          <EngagementTrends />
        </CollapsibleContent>
      </Collapsible>

      {/* Recent Posts and Insights */}
      <Collapsible open={openSections.posts} className="mb-8">
        <SectionHeader 
          title="📰 Recent Posts & AI Insights" 
          isOpen={openSections.posts} 
          onToggle={() => toggleSection('posts')} 
        />
        <CollapsibleContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentPosts />
            </div>
            <InsightsPanel />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
