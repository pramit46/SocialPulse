import { Card, CardContent } from "@/components/ui/card";
import { Eye, Heart, Share, MessageCircle } from "lucide-react";
import { mockMetrics } from "@/lib/mock-data";

const metrics = [
  {
    title: "Total Views",
    value: mockMetrics.totalViews,
    growth: mockMetrics.viewsGrowth,
    icon: Eye,
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    title: "Total Likes",
    value: mockMetrics.totalLikes,
    growth: mockMetrics.likesGrowth,
    icon: Heart,
    color: "bg-green-500/20 text-green-400",
  },
  {
    title: "Total Shares",
    value: mockMetrics.totalShares,
    growth: mockMetrics.sharesGrowth,
    icon: Share,
    color: "bg-yellow-500/20 text-yellow-400",
  },
  {
    title: "Total Comments",
    value: mockMetrics.totalComments,
    growth: mockMetrics.commentsGrowth,
    icon: MessageCircle,
    color: "bg-purple-500/20 text-purple-400",
  },
];

export default function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="bg-dark-secondary border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${metric.color}`}>
                <metric.icon className="h-6 w-6" />
              </div>
              <span className="text-green-400 text-sm font-medium">{metric.growth}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
            <p className="text-gray-400 text-sm">{metric.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
