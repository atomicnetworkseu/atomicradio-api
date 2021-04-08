export interface WeatherModel {
    city: string,
    temp: number,
    humidity: number,
    weather: {
        description: string,
        icon: string
    }
}