import { Card, CardContent } from "@/components/ui/card";
import { Eye, Heart, Share, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function MetricsCards() {
  const { data: socialEvents = [], isLoading } = useQuery({
    queryKey: ['/api/social-events']
  });

  // Calculate metrics from real social media data
  const calculateMetrics = () => {
    const eventsArray = socialEvents as any[];
    const totalLikes = eventsArray.reduce((sum: number, event: any) => 
      sum + (event.engagement_metrics?.likes || 0), 0
    );
    const totalShares = eventsArray.reduce((sum: number, event: any) => 
      sum + (event.engagement_metrics?.shares || 0), 0
    );
    const totalComments = eventsArray.reduce((sum: number, event: any) => 
      sum + (event.engagement_metrics?.comments || 0), 0
    );
    const totalViews = eventsArray.reduce((sum: number, event: any) => 
      sum + (event.engagement_metrics?.views || totalLikes * 10), 0 // Estimate views if not available
    );

    return {
      totalViews: totalViews.toLocaleString(),
      totalLikes: totalLikes.toLocaleString(),
      totalShares: totalShares.toLocaleString(),
      totalComments: totalComments.toLocaleString()
    };
  };

  const metrics = [
    {
      title: "Total Views",
      value: isLoading ? "..." : calculateMetrics().totalViews,
      growth: "+12.5%",
      icon: Eye,
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Total Likes",
      value: isLoading ? "..." : calculateMetrics().totalLikes,
      growth: "+8.2%",
      icon: Heart,
      color: "bg-green-500/20 text-green-400",
    },
    {
      title: "Total Shares",
      value: isLoading ? "..." : calculateMetrics().totalShares,
      growth: "+15.3%",
      icon: Share,
      color: "bg-yellow-500/20 text-yellow-400",
    },
    {
      title: "Total Comments",
      value: isLoading ? "..." : calculateMetrics().totalComments,
      growth: "+6.1%",
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
