<p align="center">
  <a href="https://atomicradio.eu">
    <img alt="atomicradio" src="https://cdn.atomicnetworks.eu/logo/coloured.png" width="150" />
  </a>
</p>
<h1 align="center">
  API ⚡
</h1>
<p align="center">
  Official API for atomicradio.eu made with express.
</p>
<p align="center">
  <a href="https://github.com/atomicnetworkseu/atomicradio-api/actions">
      <img src="https://github.com/atomicnetworkseu/atomicradio-api/workflows/Node.js%20CI/badge.svg" alt="Workflow">
  </a>
  <a href="https://gitmoji.carloscuesta.me">
      <img src="https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square" alt="Gitmoji">
  </a>
</p>

## Getting Started ✨
#### Prerequisites
1. You need a AzuraCast api token. Check this <a href="https://www.azuracast.com/developers/api.html#api-authentication">Guide</a> for more informations.
2. For the user geo location you need a ipinfo.io api token.
3. The weather route needs a OpenWeatherMap api token. Check this <a href="https://openweathermap.org/appid">Guide</a> for more informations.
4. Only Node.js v14.X or newer can be used for this project.

#### Configuration
Rename `.env-example` to `.env` and fill out the variables. In the `.env` file you need your tokens that were mentioned in the prerequisites.<br>
`⚠️ The data in the .env should not be published publicly otherwise third parties can gain access to all services that are used here. `

#### Installation
1. Download the github repository.
```
git clone https://github.com/atomicnetworkseu/atomicradio-api
````
2. Navigate in the project folder and install all dependencies.
```
cd atomicradio-api
npm install
````
3. After the installation you can start the bot.
```
npm run start
````

## License 📑
This code is available under the <a href="https://github.com/atomicnetworkseu/atomicradio-api/blob/master/LICENSE">MIT License</a>.
