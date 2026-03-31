const express = require('express');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(express.json());

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const tools = [
  {
    name: 'get_current_weather',
    description: 'Get the current weather for any city or location. Returns temperature, humidity, wind speed, and conditions.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name e.g. "London" or "New York" or "Mumbai"' },
        units: {
          type: 'string',
          enum: ['metric', 'imperial'],
          description: 'metric = Celsius, imperial = Fahrenheit. Default is metric.'
        }
      },
      required: ['city']
    }
  },
  {
    name: 'get_weather_forecast',
    description: 'Get a 5-day weather forecast (every 3 hours) for any city.',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name e.g. "Paris" or "Tokyo"' },
        units: {
          type: 'string',
          enum: ['metric', 'imperial'],
          description: 'metric = Celsius, imperial = Fahrenheit. Default is metric.'
        }
      },
      required: ['city']
    }
  },
  {
    name: 'compare_weather',
    description: 'Compare current weather between two cities side by side.',
    inputSchema: {
      type: 'object',
      properties: {
        city1: { type: 'string', description: 'First city name' },
        city2: { type: 'string', description: 'Second city name' },
        units: {
          type: 'string',
          enum: ['metric', 'imperial'],
          description: 'metric = Celsius, imperial = Fahrenheit. Default is metric.'
        }
      },
      required: ['city1', 'city2']
    }
  }
];

app.post('/tools/list', (req, res) => {
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: { tools }
  });
});

app.post('/tools/call', async (req, res) => {
  const { name, arguments: args } = req.body.params;
  const units = args.units || 'metric';
  const unitSymbol = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'm/s' : 'mph';

  try {
    let result;

    // CURRENT WEATHER
    if (name === 'get_current_weather') {
      const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(args.city)}&units=${units}&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'City not found');
      }

      const data = await response.json();

      result = {
        city: data.name,
        country: data.sys.country,
        temperature: `${Math.round(data.main.temp)}${unitSymbol}`,
        feels_like: `${Math.round(data.main.feels_like)}${unitSymbol}`,
        temp_min: `${Math.round(data.main.temp_min)}${unitSymbol}`,
        temp_max: `${Math.round(data.main.temp_max)}${unitSymbol}`,
        humidity: `${data.main.humidity}%`,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        wind_speed: `${data.wind.speed} ${windUnit}`,
        wind_direction: `${data.wind.deg}°`,
        visibility: `${(data.visibility / 1000).toFixed(1)} km`,
        cloudiness: `${data.clouds.all}%`,
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString()
      };
    }

    // 5-DAY FORECAST
    else if (name === 'get_weather_forecast') {
      const response = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(args.city)}&units=${units}&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'City not found');
      }

      const data = await response.json();

      // Group by day and pick one reading per day (noon reading preferred)
      const dailyMap = {};
      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        const hour = item.dt_txt.split(' ')[1];
        if (!dailyMap[date] || hour === '12:00:00') {
          dailyMap[date] = item;
        }
      });

      result = {
        city: data.city.name,
        country: data.city.country,
        forecast: Object.entries(dailyMap).slice(0, 5).map(([date, item]) => ({
          date,
          temperature: `${Math.round(item.main.temp)}${unitSymbol}`,
          feels_like: `${Math.round(item.main.feels_like)}${unitSymbol}`,
          temp_min: `${Math.round(item.main.temp_min)}${unitSymbol}`,
          temp_max: `${Math.round(item.main.temp_max)}${unitSymbol}`,
          humidity: `${item.main.humidity}%`,
          condition: item.weather[0].main,
          description: item.weather[0].description,
          wind_speed: `${item.wind.speed} ${windUnit}`,
          cloudiness: `${item.clouds.all}%`,
          rain_chance: item.pop ? `${Math.round(item.pop * 100)}%` : '0%'
        }))
      };
    }

    // COMPARE TWO CITIES
    else if (name === 'compare_weather') {
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/weather?q=${encodeURIComponent(args.city1)}&units=${units}&appid=${OPENWEATHER_API_KEY}`),
        fetch(`${BASE_URL}/weather?q=${encodeURIComponent(args.city2)}&units=${units}&appid=${OPENWEATHER_API_KEY}`)
      ]);

      if (!res1.ok) throw new Error(`City "${args.city1}" not found`);
      if (!res2.ok) throw new Error(`City "${args.city2}" not found`);

      const [d1, d2] = await Promise.all([res1.json(), res2.json()]);

      result = {
        comparison: [
          {
            city: d1.name,
            country: d1.sys.country,
            temperature: `${Math.round(d1.main.temp)}${unitSymbol}`,
            feels_like: `${Math.round(d1.main.feels_like)}${unitSymbol}`,
            humidity: `${d1.main.humidity}%`,
            condition: d1.weather[0].main,
            description: d1.weather[0].description,
            wind_speed: `${d1.wind.speed} ${windUnit}`
          },
          {
            city: d2.name,
            country: d2.sys.country,
            temperature: `${Math.round(d2.main.temp)}${unitSymbol}`,
            feels_like: `${Math.round(d2.main.feels_like)}${unitSymbol}`,
            humidity: `${d2.main.humidity}%`,
            condition: d2.weather[0].main,
            description: d2.weather[0].description,
            wind_speed: `${d2.wind.speed} ${windUnit}`
          }
        ]
      };
    }

    else {
      return res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        error: { code: -32601, message: 'Tool not found' }
      });
    }

    res.json({ jsonrpc: "2.0", id: req.body.id, result });

  } catch (error) {
    console.error(`Tool ${name} error:`, error.message);
    res.json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: { code: -32000, message: error.message }
    });
  }
});

const PORT = 3006;
app.listen(PORT, () => {
  console.log(`Weather MCP Server running on port ${PORT}`);
});