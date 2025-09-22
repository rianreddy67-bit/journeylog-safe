import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, Thermometer, Wind, Eye } from "lucide-react";
import { useEffect, useState } from "react";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return <CloudRain className="h-8 w-8 text-blue-500" />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className="h-8 w-8 text-gray-500" />;
  }
  return <Sun className="h-8 w-8 text-yellow-500" />;
};

// Mock weather data - in production, this would come from a weather API
const mockWeatherData: WeatherData[] = [
  {
    location: "Delhi",
    temperature: 28,
    condition: "Partly Cloudy",
    humidity: 65,
    windSpeed: 12,
    visibility: 8
  },
  {
    location: "Agra",
    temperature: 31,
    condition: "Sunny",
    humidity: 45,
    windSpeed: 8,
    visibility: 10
  },
  {
    location: "Alleppey",
    temperature: 26,
    condition: "Light Rain",
    humidity: 85,
    windSpeed: 15,
    visibility: 6
  }
];

interface WeatherCardProps {
  location?: string;
}

export function WeatherCard({ location = "Delhi" }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchWeather = () => {
      setLoading(true);
      setTimeout(() => {
        const weatherData = mockWeatherData.find(
          data => data.location.toLowerCase() === location.toLowerCase()
        ) || mockWeatherData[0];
        setWeather(weatherData);
        setLoading(false);
      }, 1000);
    };

    fetchWeather();
  }, [location]);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-primary" />
          Weather in {weather.location}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.condition)}
            <div>
              <p className="text-2xl font-bold">{weather.temperature}°C</p>
              <p className="text-sm text-muted-foreground">{weather.condition}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{weather.humidity}%</p>
            <p className="text-xs text-muted-foreground">Humidity</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Wind className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{weather.windSpeed} km/h</p>
            <p className="text-xs text-muted-foreground">Wind</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{weather.visibility} km</p>
            <p className="text-xs text-muted-foreground">Visibility</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}