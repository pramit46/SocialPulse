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
  const { data: socialEvents = [], isLoading } = useQuery({
    queryKey: ['/api/social-events']
  });

  // Get top performing posts (sorted by engagement)
  const topPosts = (socialEvents as any[])
    .sort((a: any, b: any) => {
      const aEngagement = (a.engagement_metrics?.likes || 0) + (a.engagement_metrics?.shares || 0) + (a.engagement_metrics?.comments || 0);
      const bEngagement = (b.engagement_metrics?.likes || 0) + (b.engagement_metrics?.shares || 0) + (b.engagement_metrics?.comments || 0);
      return bEngagement - aEngagement;
    })
    .slice(0, 5); // Show top 5 posts

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Recent High-Performing Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-gray-400 text-center py-4">Loading posts...</div>
        ) : (
          <div className="space-y-4">
            {topPosts.map((post: any) => (
              <div key={post._id || post.event_id} className="flex items-start space-x-4 p-4 bg-dark-accent rounded-lg">
                <div className={`w-10 h-10 ${platformColors[post.platform as keyof typeof platformColors] || 'bg-gray-500'} rounded-lg flex items-center justify-center`}>
                  <i className={`${platformIcons[post.platform as keyof typeof platformIcons] || 'fas fa-globe'} text-white`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium mb-1">{post.event_title || 'Social Media Post'}</p>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{post.clean_event_text || post.event_content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{post.platform}</span>
                    <span>{post.engagement_metrics?.likes || 0} likes</span>
                    {post.engagement_metrics?.shares && (
                      <span>{post.engagement_metrics.shares} shares</span>
                    )}
                    {post.engagement_metrics?.comments && (
                      <span>{post.engagement_metrics.comments} comments</span>
                    )}
                    <span>{formatDistanceToNow(new Date(post.timestamp_utc || post.created_at || Date.now()))} ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
