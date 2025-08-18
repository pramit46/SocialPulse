import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Newspaper } from "lucide-react";

// Mock engagement trends data for each platform
const socialMediaTrends = {
  facebook: [
    { time: '00:00', engagement: 120, likes: 80, shares: 25, comments: 15 },
    { time: '04:00', engagement: 95, likes: 65, shares: 18, comments: 12 },
    { time: '08:00', engagement: 310, likes: 200, shares: 75, comments: 35 },
    { time: '12:00', engagement: 445, likes: 280, shares: 110, comments: 55 },
    { time: '16:00', engagement: 380, likes: 240, shares: 95, comments: 45 },
    { time: '20:00', engagement: 520, likes: 340, shares: 125, comments: 55 },
  ],
  twitter: [
    { time: '00:00', engagement: 85, likes: 60, shares: 15, comments: 10 },
    { time: '04:00', engagement: 65, likes: 45, shares: 12, comments: 8 },
    { time: '08:00', engagement: 220, likes: 150, shares: 45, comments: 25 },
    { time: '12:00', engagement: 380, likes: 250, shares: 85, comments: 45 },
    { time: '16:00', engagement: 290, likes: 190, shares: 65, comments: 35 },
    { time: '20:00', engagement: 410, likes: 270, shares: 95, comments: 45 },
  ],
  reddit: [
    { time: '00:00', engagement: 45, likes: 35, shares: 5, comments: 5 },
    { time: '04:00', engagement: 30, likes: 22, shares: 4, comments: 4 },
    { time: '08:00', engagement: 125, likes: 85, shares: 25, comments: 15 },
    { time: '12:00', engagement: 185, likes: 125, shares: 35, comments: 25 },
    { time: '16:00', engagement: 155, likes: 105, shares: 30, comments: 20 },
    { time: '20:00', engagement: 220, likes: 150, shares: 45, comments: 25 },
  ],
  youtube: [
    { time: '00:00', engagement: 25, likes: 20, shares: 3, comments: 2 },
    { time: '04:00', engagement: 15, likes: 12, shares: 2, comments: 1 },
    { time: '08:00', engagement: 65, likes: 50, shares: 10, comments: 5 },
    { time: '12:00', engagement: 95, likes: 70, shares: 15, comments: 10 },
    { time: '16:00', engagement: 80, likes: 60, shares: 12, comments: 8 },
    { time: '20:00', engagement: 110, likes: 85, shares: 15, comments: 10 },
  ],
  instagram: [
    { time: '00:00', engagement: 55, likes: 45, shares: 6, comments: 4 },
    { time: '04:00', engagement: 35, likes: 28, shares: 4, comments: 3 },
    { time: '08:00', engagement: 145, likes: 110, shares: 20, comments: 15 },
    { time: '12:00', engagement: 210, likes: 160, shares: 30, comments: 20 },
    { time: '16:00', engagement: 180, likes: 135, shares: 25, comments: 20 },
    { time: '20:00', engagement: 250, likes: 190, shares: 35, comments: 25 },
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
                          dataKey="engagement" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          name="Total Engagement"
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="likes" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Likes"
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="shares" 
                          stroke="#F59E0B" 
                          strokeWidth={2}
                          name="Shares"
                          dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="comments" 
                          stroke="#EF4444" 
                          strokeWidth={2}
                          name="Comments"
                          dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-blue-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.engagement, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Total Engagement</p>
                    </div>
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-green-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.likes, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Total Likes</p>
                    </div>
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-yellow-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.shares, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Total Shares</p>
                    </div>
                    <div className="bg-dark-primary p-3 rounded-lg">
                      <p className="text-lg font-bold text-red-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.comments, 0))}
                      </p>
                      <p className="text-xs text-gray-400">Total Comments</p>
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