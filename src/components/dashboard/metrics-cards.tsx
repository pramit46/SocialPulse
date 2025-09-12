import { Card, CardContent } from "../ui/card";
import { Eye, Heart, Share, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function MetricsCards() {
  // Fetch real analytics data from API
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/metrics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const metrics = [
    {
      title: "Total Views",
      value: isLoading ? "..." : (analyticsData?.totalViews?.toLocaleString() || "0"),
      growth: isLoading ? "..." : (analyticsData?.viewsGrowth || "+0%"),
      icon: Eye,
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Total Likes",
      value: isLoading ? "..." : (analyticsData?.totalLikes?.toLocaleString() || "0"),
      growth: isLoading ? "..." : (analyticsData?.likesGrowth || "+0%"),
      icon: Heart,
      color: "bg-green-500/20 text-green-400",
    },
    {
      title: "Total Shares",
      value: isLoading ? "..." : (analyticsData?.totalShares?.toLocaleString() || "0"),
      growth: isLoading ? "..." : (analyticsData?.sharesGrowth || "+0%"),
      icon: Share,
      color: "bg-yellow-500/20 text-yellow-400",
    },
    {
      title: "Total Comments",
      value: isLoading ? "..." : (analyticsData?.totalComments?.toLocaleString() || "0"),
      growth: isLoading ? "..." : (analyticsData?.commentsGrowth || "+0%"),
      icon: MessageCircle,
      color: "bg-purple-500/20 text-purple-400",
    },
  ];
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
