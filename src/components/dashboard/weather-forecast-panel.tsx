import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plane, Cloud, Sun, CloudRain, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface WeatherForecast {
  _id: string;
  date: string;
  time: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  flightImpact: string;
  affectedFlights: number;
}

const weatherIcons = {
  sunny: <Sun className="h-4 w-4 text-yellow-400" />,
  partly_cloudy: <Cloud className="h-4 w-4 text-gray-400" />,
  cloudy: <Cloud className="h-4 w-4 text-gray-500" />,
  rainy: <CloudRain className="h-4 w-4 text-blue-400" />,
  heavy_rain: <CloudRain className="h-4 w-4 text-blue-600" />,
  foggy: <Cloud className="h-4 w-4 text-gray-600" />
};

const getImpactColor = (impact: string) => {
  switch (impact.toLowerCase()) {
    case 'minimal': return 'bg-green-500/20 text-green-400';
    case 'moderate': return 'bg-yellow-500/20 text-yellow-400';
    case 'significant': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

export default function WeatherForecastPanel() {
  const { data: weatherForecasts = [], isLoading } = useQuery({
    queryKey: ['/api/weather/forecast'],
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-dark-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather vs Flight Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get next 3 forecast periods
  const upcomingForecasts = weatherForecasts.slice(0, 3);

  return (
    <Card className="bg-dark-secondary border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather vs Flight Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingForecasts.length === 0 ? (
            <div className="text-center py-6">
              <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-gray-400">No forecast data available</p>
              <p className="text-xs text-gray-500 mt-1">Weather monitoring in progress</p>
            </div>
          ) : (
            upcomingForecasts.map((forecast: WeatherForecast) => (
              <div key={forecast._id} className="bg-dark-accent rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {weatherIcons[forecast.condition as keyof typeof weatherIcons] || weatherIcons.partly_cloudy}
                    <div>
                      <p className="text-white font-medium">{forecast.date} at {forecast.time}</p>
                      <p className="text-sm text-gray-400">{forecast.temperature}°C • {forecast.condition.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <Badge className={getImpactColor(forecast.flightImpact)}>
                    {forecast.flightImpact}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Humidity</p>
                    <p className="text-gray-300">{forecast.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Wind Speed</p>
                    <p className="text-gray-300">{forecast.windSpeed} km/h</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Visibility</p>
                    <p className="text-gray-300">{forecast.visibility} km</p>
                  </div>
                </div>
                
                {forecast.affectedFlights > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Plane className="h-4 w-4 text-orange-400" />
                    <span className="text-gray-300">
                      {forecast.affectedFlights} flights potentially affected
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}