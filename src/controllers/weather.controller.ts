'use strict';
import { Request, Response } from 'express';
import axios from "axios";
import anonymize from "ip-anonymize";
import { CacheService } from '../services/cache.service';
import { LogService } from '../services/log.service';

export namespace WeatherController {

    export async function getWeatherData(req: Request, res: Response) {
        const ipInfo = await requestIpInformations(req.ip);
        const country = ipInfo.country;
        const city = ipInfo.city;
        try {
            if(city === undefined || city === null || country === undefined || country === null) {
                const weatherBerlin = await requestWeatherData("Berlin", "DE");
                res.status(200).json(weatherBerlin);
                return;
            }
            const weather = await requestWeatherData(city, country);
            res.status(200).json(weather);
        } catch(err) {
            res.status(500).json({code: 500, message: 'Weather data could not be loaded. Please try again later.'});
        }
    }

    function requestIpInformations(ip: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if(CacheService.getIpCache().get(anonymize(ip)) !== undefined) {
                if(!CacheService.getIpCache().isExpired(anonymize(ip))) {
                    resolve(CacheService.getIpCache().get(anonymize(ip)));
                }
            }
            axios.get("https://ipinfo.io/" + ip + "?token=" + process.env.IPINFO_TOKEN).then((response) => {
                CacheService.getIpCache().set(anonymize(ip), response.data, 86400000);
                resolve(response.data);
            }).catch((error) => {
                LogService.logError("Error while requesting ip data. (" + anonymize(ip) + ")");
                console.log(error);
                reject();
            });
        });
    }

    function requestWeatherData(city: string, country: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(city)},${encodeURI(country)}&units=metric&lang=en&appid=` + process.env.OPENWEATHER_TOKEN).then((response) => {
                resolve({city: response.data.name, temp: Math.round(Number(response.data.main.temp)), humidity: response.data.main.humidity, weather: {description: String(response.data.weather[0].description).toLowerCase(), icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@4x.png`}});
            }).catch((error) => {
                LogService.logError("Error while requesting weather data. (" + city + ", " + country + ")");
                console.log(error);
                reject();
            });
        });
    }

}