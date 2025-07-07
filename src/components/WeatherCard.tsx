import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';

interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
  }>;
}

interface WeatherCardProps {
  startDate: string;
  endDate: string;
  location?: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ startDate, endDate, location }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('storm')) {
      return <CloudRain className="h-5 w-5" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud className="h-5 w-5" />;
    }
    return <Sun className="h-5 w-5" />;
  };

  // Mock weather data for demo - in production, integrate with weather API
  useEffect(() => {
    if (!location) return;
    
    setLoading(true);
    const timeout = setTimeout(() => {
      // Mock weather data
      setWeather({
        location: location || 'Trip Location',
        current: {
          temp: 22,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12
        },
        forecast: [
          { date: startDate, high: 24, low: 12, condition: 'Sunny', precipitation: 0 },
          { date: endDate, high: 20, low: 8, condition: 'Partly Cloudy', precipitation: 10 }
        ]
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [location, startDate, endDate]);

  if (!location) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          Add a location to your trip to see weather forecasts
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
        {getWeatherIcon(weather?.current.condition || '')}
        <span className="ml-2">Weather Forecast</span>
      </h3>
      
      {weather && (
        <div className="space-y-4">
          {/* Current Weather */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {weather.current.temp}°C
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {weather.current.condition}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Droplets className="h-4 w-4 mr-1" />
                {weather.current.humidity}%
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Wind className="h-4 w-4 mr-1" />
                {weather.current.windSpeed} km/h
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trip Forecast
            </h4>
            <div className="space-y-2">
              {weather.forecast.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getWeatherIcon(day.condition)}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {day.high}°
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {day.low}°
                    </span>
                    {day.precipitation > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {day.precipitation}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weather-based Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Packing Tips
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              {weather.current.temp < 15 && (
                <li>• Pack warm layers and jackets</li>
              )}
              {weather.forecast.some(d => d.precipitation > 30) && (
                <li>• Bring rain gear and waterproof covers</li>
              )}
              {weather.current.windSpeed > 20 && (
                <li>• Secure all loose items and consider windbreakers</li>
              )}
              {weather.forecast.some(d => d.high > 25) && (
                <li>• Pack sun protection and extra water</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherCard; 