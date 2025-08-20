import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CloudRain, AlertTriangle, Sun, Wind, Thermometer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type WeatherAlert = {
  id: string;
  type: 'warning' | 'info' | 'success';
  condition: string;
  message: string;
  impact: string;
  icon: React.ReactNode;
  color: string;
};


export default function WeatherAlerts() {
  // Fetch weather conditions from MongoDB
  const { data: weatherConditions, isLoading: conditionsLoading } = useQuery({
    queryKey: ['/api/weather/conditions'],
    queryFn: async () => {
      const response = await fetch('/api/weather/conditions');
      if (!response.ok) throw new Error('Failed to fetch weather conditions');
      return response.json();
    },
    refetchInterval: 300000, // 5 minutes
  });

  // Fetch weather alerts from MongoDB
  const { data: storedAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/weather/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/weather/alerts');
      if (!response.ok) throw new Error('Failed to fetch weather alerts');
      return response.json();
    },
    refetchInterval: 300000, // 5 minutes
  });

  // Fetch social events to correlate with weather
  const { data: socialEvents } = useQuery({
    queryKey: ['/api/social-events'],
    queryFn: async () => {
      const response = await fetch('/api/social-events?limit=50');
      if (!response.ok) throw new Error('Failed to fetch social events');
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const isLoading = conditionsLoading || alertsLoading;

  // Get current weather from latest conditions
  const currentWeather = useMemo(() => {
    if (!weatherConditions || weatherConditions.length === 0) {
      return {
        temperature: 28,
        condition: 'partly_cloudy',
        humidity: 72,
        windSpeed: 15,
        visibility: 8,
        pressure: 1013,
        uvIndex: 6
      };
    }
    // Get the most recent weather condition
    const latest = weatherConditions.sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest;
  }, [weatherConditions]);

  // Process weather alerts from MongoDB and generate dynamic alerts
  const weatherAlerts: WeatherAlert[] = useMemo(() => {
    if (!storedAlerts || storedAlerts.length === 0) return [];
    
    // Convert stored alerts to display format
    const alerts: WeatherAlert[] = storedAlerts
      .filter((alert: any) => alert.isActive)
      .map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        condition: alert.condition,
        message: alert.message,
        impact: alert.impact,
        icon: getAlertIcon(alert.condition),
        color: getAlertColor(alert.type)
      }));
    
    // Add dynamic alerts based on current weather
    if (currentWeather.temperature > 35) {
      alerts.push({
        id: 'temp-high',
        type: 'warning',
        condition: 'Extreme Heat',
        message: 'High temperature may affect passenger comfort',
        impact: 'Increased complaints about AC, longer wait times outdoors',
        icon: <Thermometer className="h-4 w-4" />,
        color: 'red'
      });
    } else if (currentWeather.temperature < 15) {
      alerts.push({
        id: 'temp-low',
        type: 'info',
        condition: 'Cold Weather',
        message: 'Cooler temperatures detected',
        impact: 'Potential impact on outdoor activities',
        icon: <Wind className="h-4 w-4" />,
        color: 'blue'
      });
    }
    
    // Visibility-based alerts
    if (currentWeather.visibility < 5) {
      alerts.push({
        id: 'visibility-low',
        type: 'warning',
        condition: 'Low Visibility',
        message: 'Poor visibility may cause flight delays',
        impact: 'Expect increased delay complaints and passenger frustration',
        icon: <CloudRain className="h-4 w-4" />,
        color: 'yellow'
      });
    }
    
    // Wind-based alerts
    if (currentWeather.windSpeed > 25) {
      alerts.push({
        id: 'wind-high',
        type: 'warning',
        condition: 'Strong Winds',
        message: 'High wind speeds may affect operations',
        impact: 'Possible ground delays and passenger safety concerns',
        icon: <Wind className="h-4 w-4" />,
        color: 'orange'
      });
    }
    
    // Humidity-based alerts
    if (currentWeather.humidity > 85) {
      alerts.push({
        id: 'humidity-high',
        type: 'info',
        condition: 'High Humidity',
        message: 'High humidity levels detected',
        impact: 'May affect passenger comfort in outdoor areas',
        icon: <CloudRain className="h-4 w-4" />,
        color: 'blue'
      });
    }
    
    // Good weather alert
    if (currentWeather.temperature >= 20 && currentWeather.temperature <= 30 && 
        currentWeather.visibility >= 8 && currentWeather.windSpeed < 20) {
      alerts.push({
        id: 'weather-good',
        type: 'success',
        condition: 'Favorable Conditions',
        message: 'Excellent weather for airport operations',
        impact: 'Expect positive passenger sentiment and smooth operations',
        icon: <Sun className="h-4 w-4" />,
        color: 'green'
      });
    }
    
    return alerts;
  }, [storedAlerts, currentWeather]);

  // Helper functions for alert icons and colors
  const getAlertIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'high winds': case 'strong winds': return <Wind className="h-4 w-4" />;
      case 'extreme heat': case 'high temperature': return <Thermometer className="h-4 w-4" />;
      case 'low visibility': case 'fog': return <CloudRain className="h-4 w-4" />;
      case 'favorable conditions': return <Sun className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'red';
      case 'success': return 'green';
      case 'info': return 'blue';
      default: return 'yellow';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-dark-secondary border-dark-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Weather Alerts & Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px]">
              <div className="animate-pulse text-gray-400">Loading weather alerts...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'success': return 'default';
      default: return 'default';
    }
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-500/20 text-red-400';
      case 'yellow': return 'bg-yellow-500/20 text-yellow-400';
      case 'orange': return 'bg-orange-500/20 text-orange-400';
      case 'green': return 'bg-green-500/20 text-green-400';
      case 'blue': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Weather Alerts & Impact
          </CardTitle>
          <p className="text-sm text-gray-400">
            Real-time weather monitoring for airport operations
          </p>
        </CardHeader>
        <CardContent>
          {/* Current Weather Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-primary p-3 rounded-lg text-center">
              <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-400" />
              <p className="text-xl font-bold text-white">{currentWeather.temperature}°C</p>
              <p className="text-xs text-gray-400">Temperature</p>
            </div>
            <div className="bg-dark-primary p-3 rounded-lg text-center">
              <Wind className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="text-xl font-bold text-white">{currentWeather.windSpeed} km/h</p>
              <p className="text-xs text-gray-400">Wind Speed</p>
            </div>
            <div className="bg-dark-primary p-3 rounded-lg text-center">
              <CloudRain className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-xl font-bold text-white">{currentWeather.humidity}%</p>
              <p className="text-xs text-gray-400">Humidity</p>
            </div>
            <div className="bg-dark-primary p-3 rounded-lg text-center">
              <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-xl font-bold text-white">{currentWeather.visibility} km</p>
              <p className="text-xs text-gray-400">Visibility</p>
            </div>
          </div>
          
          {/* Weather Alerts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white mb-3">Active Weather Alerts</h3>
            {weatherAlerts.length === 0 ? (
              <div className="text-center py-6">
                <Sun className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p className="text-gray-400">No weather alerts at this time</p>
                <p className="text-xs text-gray-500 mt-1">Monitoring conditions continuously</p>
              </div>
            ) : (
              weatherAlerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)} className="border-dark-border bg-dark-primary">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {alert.icon}
                    </div>
                    <div className="flex-1">
                      <AlertTitle className="text-white flex items-center gap-2">
                        {alert.condition}
                        <Badge className={getBadgeColor(alert.color)}>
                          {alert.type.toUpperCase()}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="text-gray-300 mt-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="mt-2 p-2 bg-dark-secondary rounded text-xs text-gray-400">
                        <strong>Expected Impact:</strong> {alert.impact}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
          
          {/* Weather Impact Summary */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Weather Impact Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-gray-300 font-medium">Flight Operations</p>
                <p className="text-gray-400">
                  {currentWeather.visibility >= 8 && currentWeather.windSpeed < 25 
                    ? "Normal operations expected" 
                    : "Potential delays possible"}
                </p>
              </div>
              <div>
                <p className="text-gray-300 font-medium">Passenger Comfort</p>
                <p className="text-gray-400">
                  {currentWeather.temperature >= 20 && currentWeather.temperature <= 32 
                    ? "Comfortable conditions" 
                    : "May affect outdoor comfort"}
                </p>
              </div>
              <div>
                <p className="text-gray-300 font-medium">Social Sentiment</p>
                <p className="text-gray-400">
                  {weatherAlerts.some(alert => alert.type === 'success') 
                    ? "Positive feedback expected" 
                    : "Monitor for weather-related complaints"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}