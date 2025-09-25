import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, lat, lon } = await req.json();
    
    if (!location && (!lat || !lon)) {
      throw new Error('Location name or coordinates are required');
    }

    let weatherData;
    
    if (lat && lon) {
      // Use coordinates for weather data
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
      );
      weatherData = await response.json();
    } else {
      // Geocode location first, then get weather
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
      }
      
      const { latitude, longitude } = geoData.results[0];
      
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
      );
      weatherData = await weatherResponse.json();
    }

    // Map weather codes to descriptions
    const getWeatherDescription = (code: number) => {
      const weatherCodes: { [key: number]: string } = {
        0: 'Clear sky',
        1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        66: 'Light freezing rain', 67: 'Heavy freezing rain',
        71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
      };
      return weatherCodes[code] || 'Unknown';
    };

    // Process the weather data
    const current = weatherData.current_weather;
    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    const processedData = {
      location: location || `${lat}, ${lon}`,
      current: {
        temperature: current.temperature,
        weather_code: current.weather_code,
        description: getWeatherDescription(current.weather_code),
        wind_speed: current.windspeed,
        wind_direction: current.winddirection,
        time: current.time
      },
      hourly_forecast: hourly.time.slice(0, 24).map((time: string, index: number) => ({
        time,
        temperature: hourly.temperature_2m[index],
        humidity: hourly.relative_humidity_2m[index],
        precipitation_probability: hourly.precipitation_probability[index],
        weather_code: hourly.weather_code[index],
        description: getWeatherDescription(hourly.weather_code[index])
      })),
      daily_forecast: daily.time.map((date: string, index: number) => ({
        date,
        max_temperature: daily.temperature_2m_max[index],
        min_temperature: daily.temperature_2m_min[index],
        precipitation: daily.precipitation_sum[index],
        weather_code: daily.weather_code[index],
        description: getWeatherDescription(daily.weather_code[index])
      })),
      alerts: generateWeatherAlerts(weatherData)
    };

    return new Response(
      JSON.stringify(processedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in weather service:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateWeatherAlerts(weatherData: any) {
  const alerts = [];
  const daily = weatherData.daily;
  
  // Check for severe weather conditions
  for (let i = 0; i < daily.weather_code.length; i++) {
    const code = daily.weather_code[i];
    const date = daily.time[i];
    const maxTemp = daily.temperature_2m_max[i];
    const precipitation = daily.precipitation_sum[i];
    
    // Thunderstorm alert
    if (code >= 95 && code <= 99) {
      alerts.push({
        type: 'severe_weather',
        severity: 'high',
        title: 'Thunderstorm Warning',
        description: `Thunderstorms expected on ${date}. Stay indoors and avoid outdoor activities.`,
        date
      });
    }
    
    // Heavy precipitation alert
    if (precipitation > 20) {
      alerts.push({
        type: 'heavy_rain',
        severity: 'medium',
        title: 'Heavy Precipitation Alert',
        description: `Heavy rain expected on ${date} (${precipitation.toFixed(1)}mm). Consider indoor activities.`,
        date
      });
    }
    
    // Extreme temperature alerts
    if (maxTemp > 35) {
      alerts.push({
        type: 'extreme_heat',
        severity: 'medium',
        title: 'High Temperature Warning',
        description: `Very hot weather expected on ${date} (${maxTemp.toFixed(1)}°C). Stay hydrated and avoid midday sun.`,
        date
      });
    }
    
    if (maxTemp < -10) {
      alerts.push({
        type: 'extreme_cold',
        severity: 'medium',
        title: 'Cold Weather Warning',
        description: `Very cold weather expected on ${date} (${maxTemp.toFixed(1)}°C). Dress warmly and limit outdoor exposure.`,
        date
      });
    }
  }
  
  return alerts;
}