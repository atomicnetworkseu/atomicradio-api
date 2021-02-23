'use strict';
import { Request, Response } from 'express';
import axios from "axios";
import { LogService } from '../services/log.service';

export namespace WeatherController {

    export async function getWeatherData(req: Request, res: Response) {
        try {
            if(req.query.lat && req.query.lon) {
                const weather = await requestWeatherData(req.query.lat, req.query.lon);
                res.status(200).json(weather);
            } else {
                const weather = await requestWeatherDataByCity("Hamburg", "DE");
                res.status(200).json(weather);
            }
        } catch(err) {
            res.status(500).json({code: 500, message: 'Weather data could not be loaded. Please try again later.'});
        }
    }

    function requestWeatherDataByCity(city: string, country: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(city)},${encodeURI(country)}&units=metric&lang=en&appid=` + process.env.OPENWEATHER_TOKEN).then((response) => {
                resolve({city: response.data.name, temp: Math.round(Number(response.data.main.temp)), humidity: response.data.main.humidity, weather: {description: String(response.data.weather[0].description).toLowerCase(), icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@4x.png`}});
            }).catch((error) => {
                LogService.logError("Error while requesting weather data.");
                console.log(error);
                reject();
            });
        });
    }

    function requestWeatherData(lat: any, lon: any): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=en&appid=` + process.env.OPENWEATHER_TOKEN).then((response) => {
                resolve({city: response.data.name, temp: Math.round(Number(response.data.main.temp)), humidity: response.data.main.humidity, weather: {description: String(response.data.weather[0].description).toLowerCase(), icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@4x.png`}});
            }).catch((error) => {
                LogService.logError("Error while requesting weather data.");
                console.log(error);
                reject();
            });
        });
    }

}