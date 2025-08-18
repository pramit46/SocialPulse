import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { mockChartData } from "@/lib/mock-data";

export default function PlatformChart() {
  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Platform Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={mockChartData.platforms}
              cx="50%"
              cy="35%"
              outerRadius={75}
              fill="#8884d8"
              dataKey="value"
              label={false}
            >
              {mockChartData.platforms.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend 
              wrapperStyle={{ color: '#D1D5DB', fontSize: '12px' }}
              iconType="circle"
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              height={60}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
