import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const platformIcons = {
  Twitter: "fab fa-twitter",
  Reddit: "fab fa-reddit",
  Instagram: "fab fa-instagram",
  Facebook: "fab fa-facebook",
  YouTube: "fab fa-youtube",
};

const platformColors = {
  Twitter: "bg-blue-500",
  Reddit: "bg-orange-500",
  Instagram: "bg-pink-500",
  Facebook: "bg-blue-600",
  YouTube: "bg-red-500",
};

export default function RecentPosts() {
  // Fetch real social events data from API
  const { data: socialEvents, isLoading } = useQuery({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=10');
      if (!response.ok) throw new Error('Failed to fetch social events');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Recent High-Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const posts = socialEvents || [];

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          Recent Posts ({posts.length} collected)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No social media posts collected yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Run data collection from Settings → Data Management to see posts here.
              </p>
            </div>
          ) : (
            posts.map((post: any) => (
              <div key={post.id} className="flex items-start space-x-4 p-4 bg-dark-accent rounded-lg">
                <div className={`w-10 h-10 ${platformColors[post.platform as keyof typeof platformColors] || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                  <i className={`${platformIcons[post.platform as keyof typeof platformIcons] || 'fas fa-globe'} text-white`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium mb-1">{post.event_title || 'Social Media Post'}</p>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{post.clean_event_text || post.event_content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{post.platform || 'Unknown'}</span>
                    <span>{post.engagement_metrics?.likes || 0} likes</span>
                    {post.engagement_metrics?.shares && (
                      <span>{post.engagement_metrics.shares} shares</span>
                    )}
                    {post.engagement_metrics?.comments && (
                      <span>{post.engagement_metrics.comments} comments</span>
                    )}
                    <span>{formatDistanceToNow(new Date(post.timestamp_utc || post.created_at || Date.now()))} ago</span>
                    {post.sentiment_analysis?.overall_sentiment && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.sentiment_analysis.overall_sentiment > 0.1 ? 'bg-green-500/20 text-green-400' :
                        post.sentiment_analysis.overall_sentiment < -0.1 ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {post.sentiment_analysis.overall_sentiment > 0.1 ? '😊 Positive' :
                         post.sentiment_analysis.overall_sentiment < -0.1 ? '😞 Negative' : '😐 Neutral'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
