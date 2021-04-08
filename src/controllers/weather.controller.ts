import { Request, Response } from "express";
import axios from "axios";
import anonymize from "ip-anonymize";
import { CacheService } from "../services/cache.service";
import { LogService } from "../services/log.service";
import { WeatherModel } from "../models/weather.model";

export namespace WeatherController {
  export async function getWeatherData(req: Request, res: Response) {
    try {
      if (req.query.lat && req.query.lon) {
        const weather = await requestWeatherData(req.query.lat, req.query.lon);
        res.status(200).json(weather);
      } else {
        const ipInfo = await requestIpInformations(req.ip);
        const country = ipInfo.country;
        const city = ipInfo.city;
        if (city === undefined || city === null || country === undefined || country === null) {
          const fallbackWeather = await requestWeatherDataByCity("Hamburg", "DE");
          res.status(200).json(fallbackWeather);
          return;
        }
        const weather = await requestWeatherDataByCity(city, country);
        res.status(200).json(weather);
      }
    } catch (err) {
      res.status(500).json({ code: 500, message: "Weather data could not be loaded. Please try again later." });
    }
  }

  function requestWeatherDataByCity(city: string, country: string): Promise<WeatherModel> {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(city)},${encodeURI(country)}&units=metric&lang=en&appid=` +
            process.env.OPENWEATHER_TOKEN
        )
        .then((response) => {
          resolve({
            city: response.data.name,
            temp: Math.round(Number(response.data.main.temp)),
            humidity: response.data.main.humidity,
            weather: {
              description: String(response.data.weather[0].description).toLowerCase(),
              icon: getWeatherIcon(response.data.weather[0].icon)
            }
          });
        })
        .catch((error) => {
          LogService.logError("Error while requesting weather data.");
          reject();
        });
    });
  }

  function requestWeatherData(lat: any, lon: any): Promise<WeatherModel> {
    return new Promise((resolve, reject) => {
      axios
        .get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=` + process.env.OPENWEATHER_TOKEN)
        .then((response) => {
          resolve({
            city: response.data.name,
            temp: Math.round(Number(response.data.main.temp)),
            humidity: response.data.main.humidity,
            weather: {
              description: String(response.data.weather[0].description).toLowerCase(),
              icon: getWeatherIcon(response.data.weather[0].icon)
            }
          });
        })
        .catch((error) => {
          LogService.logError("Error while requesting weather data.");
          reject();
        });
    });
  }

  /**
   * Switching to the offical IPInfo NodeJS Client Library
   */
  function requestIpInformations(ip: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (CacheService.getIpCache().get(ip) !== undefined) {
        if (!CacheService.getIpCache().isExpired(ip)) {
          resolve(CacheService.getIpCache().get(ip));
        }
      }
      axios
        .get("https://ipinfo.io/" + ip + "?token=" + process.env.IPINFO_TOKEN)
        .then((response) => {
          CacheService.getIpCache().set(ip, response.data, 86400000);
          resolve(response.data);
        })
        .catch((error) => {
          LogService.logError("Error while requesting ip data. (" + anonymize(ip) + ")");
          reject();
        });
    });
  }

  function getWeatherIcon(icon: string): string {
    if(icon.includes("01d")) {
      return "https://cdn.atomicradio.eu/weather/day/clearsky.svg";
    } else if(icon.includes("01n")) {
      return "https://cdn.atomicradio.eu/weather/night/clearsky.svg";
    } else if(icon.includes("02d")) {
      return "https://cdn.atomicradio.eu/weather/day/fewclouds.svg";
    } else if(icon.includes("02n")) {
      return "https://cdn.atomicradio.eu/weather/night/fewclouds.svg";
    } else if(icon.includes("03d")) {
      return "https://cdn.atomicradio.eu/weather/day/scatteredclouds.svg";
    } else if(icon.includes("03n")) {
      return "https://cdn.atomicradio.eu/weather/night/scatteredclouds.svg";
    } else if(icon.includes("04d")) {
      return "https://cdn.atomicradio.eu/weather/day/brokenclouds.svg";
    } else if(icon.includes("04n")) {
      return "https://cdn.atomicradio.eu/weather/night/brokenclouds.svg";
    } else if(icon.includes("09d")) {
      return "https://cdn.atomicradio.eu/weather/day/showerrain.svg";
    } else if(icon.includes("09n")) {
      return "https://cdn.atomicradio.eu/weather/night/showerrain.svg";
    } else if(icon.includes("10d")) {
      return "https://cdn.atomicradio.eu/weather/day/rain.svg";
    } else if(icon.includes("10n")) {
      return "https://cdn.atomicradio.eu/weather/night/rain.svg";
    } else if(icon.includes("11d")) {
      return "https://cdn.atomicradio.eu/weather/day/thunder.svg";
    } else if(icon.includes("11n")) {
      return "https://cdn.atomicradio.eu/weather/night/thunder.svg";
    } else if(icon.includes("13d")) {
      return "https://cdn.atomicradio.eu/weather/day/snow.svg";
    } else if(icon.includes("13n")) {
      return "https://cdn.atomicradio.eu/weather/night/snow.svg";
    } else if(icon.includes("50d")) {
      return "https://cdn.atomicradio.eu/weather/day/mist.svg";
    } else if(icon.includes("50n")) {
      return "https://cdn.atomicradio.eu/weather/night/mist.svg";
    } else {
      return "https://cdn.atomicradio.eu/weather/day/scatteredclouds.svg";
    }
  }
}
