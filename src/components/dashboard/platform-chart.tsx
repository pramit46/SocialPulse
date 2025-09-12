import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type SocialEvent = {
  id: string;
  platform?: string;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-dark-primary border border-dark-border rounded-lg p-3 shadow-lg">
        <p className="text-white font-medium">{data.name}</p>
        <p className="text-blue-400">
          {data.value}% of total engagement
        </p>
      </div>
    );
  }
  return null;
};

export default function PlatformChart() {
  // Fetch real social events data
  const { data: socialEvents, isLoading } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=200');
      if (!response.ok) throw new Error('Failed to fetch social events');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Generate platform distribution from real data
  const platformData = useMemo(() => {
    if (!socialEvents || socialEvents.length === 0) return [];
    
    const platformCount: Record<string, number> = {};
    socialEvents.forEach(event => {
      const platform = event.platform || 'Unknown';
      platformCount[platform] = (platformCount[platform] || 0) + 1;
    });
    
    const total = Object.values(platformCount).reduce((sum, count) => sum + count, 0);
    
    const colors: Record<string, string> = {
      Twitter: '#1DA1F2',
      Reddit: '#FF4500',
      Facebook: '#1877F2',
      Instagram: '#E4405F',
      YouTube: '#FF0000',
      TikTok: '#000000',
      LinkedIn: '#0A66C2',
      Snapchat: '#FFFC00',
      Unknown: '#6B7280'
    };
    
    return Object.entries(platformCount)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
        count,
        color: colors[name] || '#6B7280'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 platforms
  }, [socialEvents]);

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold text-white">Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-pulse text-gray-400">Loading platforms...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (platformData.length === 0) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold text-white">Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-gray-400 text-center">
              <p>No platform data available</p>
              <p className="text-xs mt-2">Collect social media data to see distribution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold text-white">Platform Distribution</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={platformData}
              cx="50%"
              cy="45%"
              outerRadius={65}
              fill="#8884d8"
              dataKey="value"
              label={false}
            >
              {platformData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#D1D5DB', fontSize: '12px' }}
              iconType="circle"
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              height={35}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
