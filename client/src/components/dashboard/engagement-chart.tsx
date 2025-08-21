import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";

export default function EngagementChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['/api/analytics/charts'],
    select: (data: any) => data?.engagement || []
  });

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="text-gray-400">Loading engagement data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Engagement Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 45 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF" 
              fontSize={11}
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={11}
            />
            <Legend 
              wrapperStyle={{ color: '#D1D5DB', fontSize: '12px' }}
              iconType="line"
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              height={40}
            />
            <Line 
              type="monotone" 
              dataKey="likes" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Likes"
            />
            <Line 
              type="monotone" 
              dataKey="shares" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Shares"
            />
            <Line 
              type="monotone" 
              dataKey="comments" 
              stroke="#F59E0B" 
              strokeWidth={2}
              name="Comments"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
