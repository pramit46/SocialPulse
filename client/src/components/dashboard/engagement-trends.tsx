import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Newspaper } from "lucide-react";

// Mock viral buzz word trends data for each platform
const socialMediaTrends = {
  facebook: [
    { time: '00:00', delay: 15, excellent: 25, comfortable: 12, crowded: 8, efficient: 18 },
    { time: '04:00', delay: 12, excellent: 20, comfortable: 10, crowded: 6, efficient: 15 },
    { time: '08:00', delay: 28, excellent: 45, comfortable: 22, crowded: 18, efficient: 35 },
    { time: '12:00', delay: 35, excellent: 58, comfortable: 28, crowded: 25, efficient: 42 },
    { time: '16:00', delay: 30, excellent: 48, comfortable: 24, crowded: 20, efficient: 38 },
    { time: '20:00', delay: 25, excellent: 52, comfortable: 26, crowded: 15, efficient: 40 },
  ],
  twitter: [
    { time: '00:00', delay: 18, excellent: 22, comfortable: 8, crowded: 12, efficient: 15 },
    { time: '04:00', delay: 14, excellent: 18, comfortable: 6, crowded: 10, efficient: 12 },
    { time: '08:00', delay: 32, excellent: 38, comfortable: 18, crowded: 25, efficient: 28 },
    { time: '12:00', delay: 42, excellent: 48, comfortable: 25, crowded: 32, efficient: 35 },
    { time: '16:00', delay: 35, excellent: 42, comfortable: 20, crowded: 28, efficient: 30 },
    { time: '20:00', delay: 28, excellent: 45, comfortable: 22, crowded: 20, efficient: 32 },
  ],
  reddit: [
    { time: '00:00', delay: 8, excellent: 12, comfortable: 5, crowded: 6, efficient: 8 },
    { time: '04:00', delay: 6, excellent: 10, comfortable: 4, crowded: 4, efficient: 6 },
    { time: '08:00', delay: 15, excellent: 22, comfortable: 12, crowded: 15, efficient: 18 },
    { time: '12:00', delay: 20, excellent: 28, comfortable: 15, crowded: 18, efficient: 22 },
    { time: '16:00', delay: 18, excellent: 25, comfortable: 13, crowded: 16, efficient: 20 },
    { time: '20:00', delay: 12, excellent: 30, comfortable: 16, crowded: 10, efficient: 25 },
  ],
  youtube: [
    { time: '00:00', delay: 4, excellent: 8, comfortable: 3, crowded: 2, efficient: 5 },
    { time: '04:00', delay: 3, excellent: 6, comfortable: 2, crowded: 1, efficient: 4 },
    { time: '08:00', delay: 8, excellent: 15, comfortable: 8, crowded: 6, efficient: 12 },
    { time: '12:00', delay: 12, excellent: 18, comfortable: 10, crowded: 8, efficient: 15 },
    { time: '16:00', delay: 10, excellent: 16, comfortable: 9, crowded: 7, efficient: 13 },
    { time: '20:00', delay: 6, excellent: 20, comfortable: 11, crowded: 4, efficient: 16 },
  ],
  instagram: [
    { time: '00:00', delay: 10, excellent: 15, comfortable: 6, crowded: 8, efficient: 10 },
    { time: '04:00', delay: 8, excellent: 12, comfortable: 5, crowded: 6, efficient: 8 },
    { time: '08:00', delay: 18, excellent: 28, comfortable: 15, crowded: 20, efficient: 22 },
    { time: '12:00', delay: 25, excellent: 35, comfortable: 20, crowded: 25, efficient: 28 },
    { time: '16:00', delay: 22, excellent: 32, comfortable: 18, crowded: 22, efficient: 25 },
    { time: '20:00', delay: 15, excellent: 38, comfortable: 22, crowded: 12, efficient: 30 },
  ]
};

// Mock news trending data for Bangalore airport and airlines
const newsTrends = [
  { time: '00:00', bangalore_airport: 12, indigo: 8, air_india: 5, spicejet: 3, vistara: 4 },
  { time: '04:00', bangalore_airport: 8, indigo: 6, air_india: 3, spicejet: 2, vistara: 3 },
  { time: '08:00', bangalore_airport: 35, indigo: 25, air_india: 15, spicejet: 10, vistara: 12 },
  { time: '12:00', bangalore_airport: 45, indigo: 32, air_india: 22, spicejet: 15, vistara: 18 },
  { time: '16:00', bangalore_airport: 38, indigo: 28, air_india: 18, spicejet: 12, vistara: 15 },
  { time: '20:00', bangalore_airport: 42, indigo: 30, air_india: 20, spicejet: 14, vistara: 16 },
];

export default function EngagementTrends() {
  const [activeTab, setActiveTab] = useState("social");

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Engagement Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-dark-primary">
            <TabsTrigger value="social" className="text-gray-300 data-[state=active]:text-blue-400">
              Social Media
            </TabsTrigger>
            <TabsTrigger value="news" className="text-gray-300 data-[state=active]:text-blue-400">
              <Newspaper className="h-4 w-4 mr-1" />
              News Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="social" className="mt-6">
            <Tabs defaultValue="facebook" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-dark-primary">
                <TabsTrigger value="facebook" className="text-xs text-gray-300 data-[state=active]:text-blue-400">
                  Facebook
                </TabsTrigger>
                <TabsTrigger value="twitter" className="text-xs text-gray-300 data-[state=active]:text-blue-400">
                  Twitter
                </TabsTrigger>
                <TabsTrigger value="reddit" className="text-xs text-gray-300 data-[state=active]:text-blue-400">
                  Reddit
                </TabsTrigger>
                <TabsTrigger value="youtube" className="text-xs text-gray-300 data-[state=active]:text-blue-400">
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="instagram" className="text-xs text-gray-300 data-[state=active]:text-blue-400">
                  Instagram
                </TabsTrigger>
              </TabsList>
              
              {Object.entries(socialMediaTrends).map(([platform, data]) => (
                <TabsContent key={platform} value={platform} className="mt-4">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={formatNumber}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#FFFFFF'
                          }}
                          formatter={(value, name) => [formatNumber(value as number), name]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="excellent" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          name="Excellent"
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="delay" 
                          stroke="#EF4444" 
                          strokeWidth={2}
                          name="Delay"
                          dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="comfortable" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Comfortable"
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="crowded" 
                          stroke="#F59E0B" 
                          strokeWidth={2}
                          name="Crowded"
                          dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="efficient" 
                          stroke="#8B5CF6" 
                          strokeWidth={2}
                          name="Efficient"
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-5 gap-4 text-center">
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-green-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.excellent, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Excellent</p>
                    </div>
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-red-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.delay, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Delay</p>
                    </div>
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-blue-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.comfortable, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Comfortable</p>
                    </div>
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-yellow-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.crowded, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Crowded</p>
                    </div>
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-purple-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.efficient, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Efficient</p>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
          
          <TabsContent value="news" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={newsTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="bangalore_airport" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Bangalore Airport"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="indigo" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="IndiGo"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="air_india" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Air India"
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spicejet" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="SpiceJet"
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vistara" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Vistara"
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-4 text-center">
              <div className="bg-dark-primary p-3 rounded-lg">
                <p className="text-lg font-bold text-blue-400">
                  {newsTrends.reduce((sum, item) => sum + item.bangalore_airport, 0)}
                </p>
                <p className="text-xs text-gray-400">BLR Airport</p>
              </div>
              <div className="bg-dark-primary p-3 rounded-lg">
                <p className="text-lg font-bold text-green-400">
                  {newsTrends.reduce((sum, item) => sum + item.indigo, 0)}
                </p>
                <p className="text-xs text-gray-400">IndiGo</p>
              </div>
              <div className="bg-dark-primary p-3 rounded-lg">
                <p className="text-lg font-bold text-yellow-400">
                  {newsTrends.reduce((sum, item) => sum + item.air_india, 0)}
                </p>
                <p className="text-xs text-gray-400">Air India</p>
              </div>
              <div className="bg-dark-primary p-3 rounded-lg">
                <p className="text-lg font-bold text-red-400">
                  {newsTrends.reduce((sum, item) => sum + item.spicejet, 0)}
                </p>
                <p className="text-xs text-gray-400">SpiceJet</p>
              </div>
              <div className="bg-dark-primary p-3 rounded-lg">
                <p className="text-lg font-bold text-purple-400">
                  {newsTrends.reduce((sum, item) => sum + item.vistara, 0)}
                </p>
                <p className="text-xs text-gray-400">Vistara</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}