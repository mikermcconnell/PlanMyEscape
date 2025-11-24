import logger from '../utils/logger';

export interface WeatherData {
    location: string;
    current: {
        temp: number;
        condition: string;
        humidity: number;
        windSpeed: number;
        precipitationProbability?: number;
    };
    forecast: Array<{
        date: string;
        high: number;
        low: number;
        condition: string;
        precipitation: number;
        precipitationProbability: number;
    }>;
}

// WMO Weather interpretation codes (https://open-meteo.com/en/docs)
const getWeatherCondition = (code: number): string => {
    if (code === 0) return 'Clear sky';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 56 && code <= 57) return 'Freezing Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 75) return 'Snow fall';
    if (code === 77) return 'Snow grains';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code === 95) return 'Thunderstorm';
    if (code >= 96 && code <= 99) return 'Thunderstorm with hail';
    return 'Unknown';
};

export class WeatherService {
    private static readonly API_URL = 'https://api.open-meteo.com/v1/forecast';
    private static readonly GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';

    /**
     * Get coordinates for a location name
     */
    async getCoordinates(locationName: string): Promise<{ lat: number; lon: number; name: string } | null> {
        try {
            const response = await fetch(
                `${WeatherService.GEOCODING_API_URL}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`
            );

            if (!response.ok) throw new Error('Geocoding failed');

            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                return null;
            }

            return {
                lat: data.results[0].latitude,
                lon: data.results[0].longitude,
                name: `${data.results[0].name}, ${data.results[0].admin1 || data.results[0].country_code}`
            };
        } catch (error) {
            logger.error('Error fetching coordinates:', error);
            return null;
        }
    }

    /**
     * Get weather forecast
     */
    async getWeather(location: string, startDate?: string, endDate?: string): Promise<WeatherData | null> {
        try {
            // 1. Get coordinates
            const coords = await this.getCoordinates(location);
            if (!coords) {
                logger.warn(`Could not find coordinates for location: ${location}`);
                return null;
            }

            // 2. Build API URL
            // Default to 7 days if no dates provided
            const params = new URLSearchParams({
                latitude: coords.lat.toString(),
                longitude: coords.lon.toString(),
                current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
                daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
                timezone: 'auto'
            });

            if (startDate && endDate) {
                params.append('start_date', startDate);
                params.append('end_date', endDate);
            } else {
                params.append('forecast_days', '7');
            }

            // 3. Fetch Weather Data
            const response = await fetch(`${WeatherService.API_URL}?${params.toString()}`);
            if (!response.ok) throw new Error('Weather API failed');

            const data = await response.json();

            // 4. Transform Data
            const current = {
                temp: Math.round(data.current.temperature_2m),
                condition: getWeatherCondition(data.current.weather_code),
                humidity: data.current.relative_humidity_2m,
                windSpeed: Math.round(data.current.wind_speed_10m),
                precipitationProbability: 0 // Not available in current, usually
            };

            const forecast = data.daily.time.map((date: string, index: number) => ({
                date,
                high: Math.round(data.daily.temperature_2m_max[index]),
                low: Math.round(data.daily.temperature_2m_min[index]),
                condition: getWeatherCondition(data.daily.weather_code[index]),
                precipitation: data.daily.precipitation_sum[index],
                precipitationProbability: data.daily.precipitation_probability_max[index]
            }));

            return {
                location: coords.name,
                current,
                forecast
            };

        } catch (error) {
            logger.error('Error fetching weather:', error);
            return null;
        }
    }
}

export const weatherService = new WeatherService();
