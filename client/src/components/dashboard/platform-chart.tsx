import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { mockChartData } from "@/lib/mock-data";

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
  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-semibold text-white">Platform Distribution</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={mockChartData.platforms}
              cx="50%"
              cy="45%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={false}
            >
              {mockChartData.platforms.map((entry, index) => (
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
