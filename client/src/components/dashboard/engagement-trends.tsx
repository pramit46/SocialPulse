import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AirportConfig {
  airport: {
    code: string;
    city: string;
    locationSlug: string;
  };
}

type SocialEvent = {
  id: string;
  platform?: string;
  timestamp_utc?: string;
  created_at?: string;
  event_content?: string;
  clean_event_text?: string;
  engagement_metrics?: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
};


export default function EngagementTrends() {
  const [activeTab, setActiveTab] = useState("social");
  
  // Load airport configuration
  const { data: airportConfig } = useQuery<AirportConfig>({
    queryKey: ['/api/airport-config'],
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch real social events data
  const { data: socialEvents, isLoading } = useQuery<SocialEvent[]>({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=500');
      if (!response.ok) throw new Error('Failed to fetch social events');
      return response.json();
    },
    refetchInterval: 30000,
  });
  
  // Generate engagement trends from real data
  const engagementData = useMemo(() => {
    if (!socialEvents || socialEvents.length === 0) return { socialMediaTrends: {}, newsTrends: [] };
    
    // Group events by platform and hour
    const platforms = ['Twitter', 'Reddit', 'Facebook', 'YouTube', 'Instagram'];
    const timeSlots = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    
    const socialMediaTrends: Record<string, any[]> = {};
    
    platforms.forEach(platform => {
      const platformEvents = socialEvents.filter(event => 
        event.platform?.toLowerCase() === platform.toLowerCase()
      );
      
      socialMediaTrends[platform.toLowerCase()] = timeSlots.map(time => {
        const hour = parseInt(time.split(':')[0]);
        const eventsInTimeSlot = platformEvents.filter(event => {
          const eventDate = new Date(event.timestamp_utc || event.created_at || Date.now());
          const eventHour = eventDate.getHours();
          return Math.abs(eventHour - hour) <= 2; // 4-hour window
        });
        
        // Analyze keywords in this time slot
        const keywords = ['delay', 'excellent', 'comfortable', 'crowded', 'efficient'];
        const keywordCounts: Record<string, number> = {};
        
        keywords.forEach(keyword => {
          keywordCounts[keyword] = eventsInTimeSlot.filter(event => {
            const text = (event.clean_event_text || event.event_content || '').toLowerCase();
            return text.includes(keyword);
          }).length;
        });
        
        return {
          time,
          ...keywordCounts
        };
      });
    });
    
    // News trends (simplified for now)
    const newsTrends = timeSlots.map(time => ({
      time,
      [`${airportConfig?.airport.locationSlug || 'airport'}`]: Math.floor(Math.random() * 30) + 10,
      indigo: Math.floor(Math.random() * 20) + 5,
      air_india: Math.floor(Math.random() * 15) + 3,
      spicejet: Math.floor(Math.random() * 10) + 2,
      vistara: Math.floor(Math.random() * 12) + 3
    }));
    
    return { socialMediaTrends, newsTrends };
  }, [socialEvents]);

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Engagement Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="social" className="text-muted-foreground data-[state=active]:text-blue-400">
              Social Media
            </TabsTrigger>
            <TabsTrigger value="news" className="text-muted-foreground data-[state=active]:text-blue-400">
              <Newspaper className="h-4 w-4 mr-1" />
              News Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="social" className="mt-6">
            <Tabs defaultValue="facebook" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-muted">
                <TabsTrigger value="facebook" className="text-xs text-muted-foreground data-[state=active]:text-blue-400">
                  Facebook
                </TabsTrigger>
                <TabsTrigger value="twitter" className="text-xs text-muted-foreground data-[state=active]:text-blue-400">
                  Twitter
                </TabsTrigger>
                <TabsTrigger value="reddit" className="text-xs text-muted-foreground data-[state=active]:text-blue-400">
                  Reddit
                </TabsTrigger>
                <TabsTrigger value="youtube" className="text-xs text-muted-foreground data-[state=active]:text-blue-400">
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="instagram" className="text-xs text-muted-foreground data-[state=active]:text-blue-400">
                  Instagram
                </TabsTrigger>
              </TabsList>
              
              {Object.entries(engagementData.socialMediaTrends).map(([platform, data]) => (
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
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-lg font-bold text-green-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.excellent, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Excellent</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-lg font-bold text-red-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.delay, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Delay</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-lg font-bold text-blue-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.comfortable, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Comfortable</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-lg font-bold text-yellow-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.crowded, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Crowded</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-lg font-bold text-purple-400">
                        {formatNumber(data.reduce((sum, item) => sum + item.efficient, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">Efficient</p>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
          
          <TabsContent value="news" className="mt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData.newsTrends}>
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
                    dataKey={`${airportConfig?.airport.locationSlug || 'airport'}`} 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name={`${airportConfig?.airport.city || 'Airport'}`}
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
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-lg font-bold text-blue-400">
                  {engagementData.newsTrends.reduce((sum, item) => sum + item[`${airportConfig?.airport.locationSlug || 'airport'}`], 0)}
                </p>
                <p className="text-xs text-muted-foreground">{airportConfig?.airport.code || 'Airport'}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-lg font-bold text-green-400">
                  {engagementData.newsTrends.reduce((sum, item) => sum + item.indigo, 0)}
                </p>
                <p className="text-xs text-muted-foreground">IndiGo</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-lg font-bold text-yellow-400">
                  {engagementData.newsTrends.reduce((sum, item) => sum + item.air_india, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Air India</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-lg font-bold text-red-400">
                  {engagementData.newsTrends.reduce((sum, item) => sum + item.spicejet, 0)}
                </p>
                <p className="text-xs text-muted-foreground">SpiceJet</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-lg font-bold text-purple-400">
                  {engagementData.newsTrends.reduce((sum, item) => sum + item.vistara, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Vistara</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}