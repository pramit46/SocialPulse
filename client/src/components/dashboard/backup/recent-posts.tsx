import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockSocialEvents } from "@/lib/mock-data";
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
  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Recent High-Performing Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockSocialEvents.map((post) => (
            <div key={post.id} className="flex items-start space-x-4 p-4 bg-dark-accent rounded-lg">
              <div className={`w-10 h-10 ${platformColors[post.platform as keyof typeof platformColors]} rounded-lg flex items-center justify-center`}>
                <i className={`${platformIcons[post.platform as keyof typeof platformIcons]} text-white`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium mb-1">{post.event_title}</p>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{post.clean_event_text}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{post.platform}</span>
                  <span>{post.engagement_metrics?.likes} likes</span>
                  {post.engagement_metrics?.shares && (
                    <span>{post.engagement_metrics.shares} shares</span>
                  )}
                  {post.engagement_metrics?.comments && (
                    <span>{post.engagement_metrics.comments} comments</span>
                  )}
                  <span>{formatDistanceToNow(new Date(post.timestamp_utc || post.created_at || 0))} ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
