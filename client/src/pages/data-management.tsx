import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Cloud, RotateCw, Download, Settings, Play, CheckCircle, AlertCircle } from "lucide-react";
import { mockSocialEvents } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { dataSources, DataSourceCredentials } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Mock collection status for demonstration
const collectionStatus = {
  isCollecting: false,
  lastCollection: new Date().toISOString(),
  recordsCollected: 1247,
  errors: 0,
  platforms: {
    twitter: { status: 'active', lastSync: '2 min ago', records: 547 },
    reddit: { status: 'active', lastSync: '5 min ago', records: 700 },
    facebook: { status: 'error', lastSync: '3 days ago', records: 0 },
    youtube: { status: 'inactive', lastSync: 'Never', records: 0 },
    instagram: { status: 'inactive', lastSync: 'Never', records: 0 },
  }
};

// Dynamic data stats that update based on collection status
const getDataStats = () => {
  const totalRecords = collectionStatus.recordsCollected.toLocaleString();
  const activePlatforms = Object.values(collectionStatus.platforms).filter(p => p.status === 'active').length;
  const lastSyncTime = Math.min(...Object.values(collectionStatus.platforms)
    .filter(p => p.status === 'active')
    .map(p => p.lastSync === '2 min ago' ? 2 : p.lastSync === '5 min ago' ? 5 : 60));
  
  return {
    totalRecords: totalRecords,
    storageUsed: `${Math.round(collectionStatus.recordsCollected * 0.68 / 1000)} GB`, // Approximate calculation
    lastSync: `${lastSyncTime} min`,
    activePlatforms
  };
};

const dataStats = getDataStats();

// Mock connection status for demonstration - showing Twitter and Reddit as working
const connectionStatus = {
  twitter: true,
  reddit: true,
  facebook: false,
  youtube: false,
  instagram: false,
  vimeo: false,
  tiktok: false,
  tumblr: false,
  cnn: false,
  aajtak: false,
  wion: false,
  zee_news: false,
  ndtv: false,
};

export default function DataManagement() {
  const [credentials, setCredentials] = useState<DataSourceCredentials>({});
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());
  const [isCollecting, setIsCollecting] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dataCollectionMutation = useMutation({
    mutationFn: async ({ source, credentials: creds }: { source: string; credentials: DataSourceCredentials }) => {
      return apiRequest('POST', '/api/collect-data', { source, credentials: creds });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Data Collection Started",
        description: `Successfully started collecting data from ${variables.source}`,
      });
      setConnectedSources(prev => new Set([...Array.from(prev), variables.source]));
      queryClient.invalidateQueries({ queryKey: ['/api/social-events'] });
    },
    onError: (error, variables) => {
      toast({
        title: "Collection Failed",
        description: `Failed to collect data from ${variables.source}: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      setIsCollecting(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(variables.source);
        return newSet;
      });
    },
  });

  const handleConnect = async (source: string) => {
    setIsCollecting(prev => new Set([...Array.from(prev), source]));
    await dataCollectionMutation.mutateAsync({ source, credentials });
  };

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest("GET", "/api/social-events");
      const data = await response.json();
      
      if (data && data.length > 0) {
        const csvData = convertToCSV(data);
        downloadCSV(csvData, `bangalore-airport-data-${new Date().toISOString().split('T')[0]}.csv`);
        
        toast({
          title: "Export Complete",
          description: "Your data has been downloaded successfully.",
        });
      } else {
        toast({
          title: "No Data",
          description: "No data available for export.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Data Management</h1>
        <p className="text-gray-400">Bangalore Airport social media data collection and analytics storage</p>
      </div>

      {/* Data Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-dark-secondary border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{dataStats.totalRecords}</h3>
            <p className="text-gray-400 text-sm">Total Records</p>
            <p className="text-green-400 text-xs mt-2">+15.2% this month</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-secondary border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Cloud className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{dataStats.storageUsed}</h3>
            <p className="text-gray-400 text-sm">Storage Used</p>
            <p className="text-yellow-400 text-xs mt-2">78% of quota</p>
          </CardContent>
        </Card>

        <Card className="bg-dark-secondary border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <RotateCw className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{dataStats.lastSync}</h3>
            <p className="text-gray-400 text-sm">Last Sync</p>
            <p className="text-green-400 text-xs mt-2">All platforms active</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Status */}
      <Card className="bg-dark-secondary border-dark-border mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <RotateCw className={`h-5 w-5 ${collectionStatus.isCollecting ? 'animate-spin text-green-400' : 'text-blue-400'}`} />
            Collection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{collectionStatus.recordsCollected.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Records Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{Object.values(collectionStatus.platforms).filter(p => p.status === 'active').length}</p>
              <p className="text-sm text-gray-400">Active Sources</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{collectionStatus.errors}</p>
              <p className="text-sm text-gray-400">Errors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{new Date(collectionStatus.lastCollection).toLocaleTimeString()}</p>
              <p className="text-sm text-gray-400">Last Sync</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Connections */}
      <Card className="bg-dark-secondary border-dark-border mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Data Source Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="social" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-dark-primary">
              <TabsTrigger value="social" className="text-gray-300 data-[state=active]:text-blue-400">
                Social Media
              </TabsTrigger>
              <TabsTrigger value="news" className="text-gray-300 data-[state=active]:text-blue-400">
                News Sources
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="social" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dataSources.socialMedia.map((source) => (
                  <div key={source.key} className="p-4 border border-dark-border rounded-lg bg-dark-primary">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{source.name}</h3>
                      {connectedSources.has(source.key) ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-dark-border hover:bg-dark-secondary"
                          disabled={isCollecting.has(source.key)}
                        >
                          {isCollecting.has(source.key) ? (
                            <>
                              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                              Collecting...
                            </>
                          ) : connectedSources.has(source.key) ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Recollect
                            </>
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-dark-secondary border-dark-border">
                        <DialogHeader>
                          <DialogTitle className="text-white">Connect to {source.name}</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Enter your credentials to collect data from {source.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {source.credentialFields.map((field) => (
                            <div key={field} className="space-y-2">
                              <Label htmlFor={field} className="text-white">
                                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <Input
                                id={field}
                                type={field.includes('secret') || field.includes('token') ? 'password' : 'text'}
                                placeholder={`Enter your ${field.replace(/_/g, ' ')}`}
                                value={credentials[field as keyof DataSourceCredentials] || ''}
                                onChange={(e) => handleCredentialChange(field, e.target.value)}
                                className="bg-dark-primary border-dark-border text-white"
                              />
                            </div>
                          ))}
                          <Button
                            onClick={() => handleConnect(source.key)}
                            disabled={isCollecting.has(source.key)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {isCollecting.has(source.key) ? (
                              <>
                                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                Starting Collection...
                              </>
                            ) : (
                              'Start Collection'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="news" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataSources.news.map((source) => (
                  <div key={source.key} className="p-4 border border-dark-border rounded-lg bg-dark-primary">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{source.name}</h3>
                      {connectedSources.has(source.key) ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-dark-border hover:bg-dark-secondary"
                          disabled={isCollecting.has(source.key)}
                        >
                          {isCollecting.has(source.key) ? (
                            <>
                              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                              Collecting...
                            </>
                          ) : connectedSources.has(source.key) ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Recollect
                            </>
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-dark-secondary border-dark-border">
                        <DialogHeader>
                          <DialogTitle className="text-white">Connect to {source.name}</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Configure data collection from {source.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {source.credentialFields.map((field) => (
                            <div key={field} className="space-y-2">
                              <Label htmlFor={field} className="text-white">
                                {field.includes('rss') ? 'RSS Feed URL (optional)' : 
                                 field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              <Input
                                id={field}
                                type="text"
                                placeholder={field.includes('rss') ? 'Leave empty to use default RSS feed' : 
                                           `Enter your ${field.replace(/_/g, ' ')}`}
                                value={credentials[field as keyof DataSourceCredentials] || ''}
                                onChange={(e) => handleCredentialChange(field, e.target.value)}
                                className="bg-dark-primary border-dark-border text-white"
                              />
                            </div>
                          ))}
                          <Button
                            onClick={() => handleConnect(source.key)}
                            disabled={isCollecting.has(source.key)}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {isCollecting.has(source.key) ? (
                              <>
                                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                                Starting Collection...
                              </>
                            ) : (
                              'Start Collection'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Schema and Recent Records */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Data Schema */}
        <Card className="bg-dark-secondary border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Data Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">author_id</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">author_name</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">clean_event_text</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">engagement_metrics</span>
                <span className="text-yellow-400">struct</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-gray-500">├ comments</span>
                <span className="text-green-400">long</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-gray-500">├ likes</span>
                <span className="text-green-400">long</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-gray-500">└ shares</span>
                <span className="text-green-400">long</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">event_content</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">event_id</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">platform</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">timestamp_utc</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">sentiment_analysis</span>
                <span className="text-yellow-400">struct</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-gray-500">├ overall_sentiment</span>
                <span className="text-green-400">float</span>
              </div>
              <div className="flex justify-between pl-4">
                <span className="text-gray-500">└ categories</span>
                <span className="text-yellow-400">struct</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">location_focus</span>
                <span className="text-blue-400">string</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">airline_mentioned</span>
                <span className="text-blue-400">string</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Data Records */}
        <Card className="xl:col-span-2 bg-dark-secondary border-dark-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-white">Recent Data Records</CardTitle>
              <Button 
                onClick={handleExport}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left py-3 text-gray-400 font-medium">Event ID</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Platform</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Author</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Airline</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Sentiment</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSocialEvents.map((record) => (
                    <tr key={record.id} className="border-b border-dark-border/50">
                      <td className="py-3 text-gray-300">{record.event_id}</td>
                      <td className="py-3">
                        <Badge 
                          variant="secondary" 
                          className="bg-blue-500/20 text-blue-400"
                        >
                          {record.platform}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-300">{record.author_name}</td>
                      <td className="py-3 text-gray-300">
                        {record.airline_mentioned ? (
                          <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                            {record.airline_mentioned?.replace(/_/g, ' ')}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        {record.sentiment_analysis ? (
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              record.sentiment_analysis.overall_sentiment >= 0.5 ? 'bg-green-400' :
                              record.sentiment_analysis.overall_sentiment >= 0 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <span className="text-gray-300 text-xs">
                              {(record.sentiment_analysis.overall_sentiment * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(record.timestamp_utc || record.created_at || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
