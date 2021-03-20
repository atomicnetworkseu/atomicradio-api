"use strict";
import dotenv from "dotenv";
import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import expressHandlebars from "express-handlebars";
import anonymize from "ip-anonymize";
import moment from "moment";
import promMiddleware from "express-prometheus-middleware";
import { RateLimiterMemory } from "rate-limiter-flexible";
import channel from "./routers/channel.router";
import weather from "./routers/weather.router";
import card from "./routers/card.router";
import { AzuracastService } from "./services/azuracast.service";
import { ListenerService } from "./services/listener.service";
import { LogService } from "./services/log.service";
import { SocketService } from "./services/socket.service";

const app = express();
const httpServer = new http.Server(app);
const globalLimiter = new RateLimiterMemory({
  keyPrefix: "global-limiter",
  points: 250,
  duration: 60,
  blockDuration: 60 * 60
});
const weatherLimiter = new RateLimiterMemory({
  keyPrefix: "weather-limiter",
  points: 100,
  duration: 60,
  blockDuration: 60 * 60
});
SocketService.init(httpServer);

dotenv.config();
AzuracastService.getStationInfos("one");
AzuracastService.getStationInfos("dance");
AzuracastService.getStationInfos("trap");
ListenerService.requestListener();

morgan.token("host", (req: express.Request, res: express.Response) => {
  return req.hostname;
});

morgan.token("ip", (req: express.Request, res: express.Response) => {
  const xForwardedFor = String(req.headers["x-forwarded-for"] || "").replace(/:\d+$/, "");
  let ip = xForwardedFor || req.connection.remoteAddress;
  if (ip.includes("::ffff:")) {
    ip = ip.split(":").reverse()[0];
  }
  if (ip.includes(",")) {
    ip = ip.split(", ").reverse()[0];
  }
  return anonymize(ip);
});

morgan.token("date", (req: express.Request, res: express.Response) => {
  return moment().format("DD/MM/YYYY HH:mm:ss");
});

function globalRateLimiter(req: express.Request, res: express.Response, next: () => void) {
  globalLimiter
    .consume(req.ip, 1)
    .then((value) => {
      res.set({
        "X-RateLimit-Limit": 250,
        "X-RateLimit-Remaining": value.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + value.msBeforeNext),
        "X-RateLimit-Retry": value.msBeforeNext / 1000
      });
      next();
    })
    .catch((error) => {
      res.set({
        "X-RateLimit-Limit": 250,
        "X-RateLimit-Remaining": error.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + error.msBeforeNext),
        "X-RateLimit-Retry": error.msBeforeNext / 1000
      });
      res.status(429).json({ code: 429, message: "You are being rate limited." });
    });
}

function weatherRateLimiter(req: express.Request, res: express.Response, next: () => void) {
  weatherLimiter
    .consume(req.ip, 1)
    .then((value) => {
      res.set({
        "X-RateLimit-Limit": 100,
        "X-RateLimit-Remaining": value.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + value.msBeforeNext),
        "X-RateLimit-Retry": value.msBeforeNext / 1000
      });
      next();
    })
    .catch((error) => {
      res.set({
        "X-RateLimit-Limit": 100,
        "X-RateLimit-Remaining": error.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + error.msBeforeNext),
        "X-RateLimit-Retry": error.msBeforeNext / 1000
      });
      if(req.query.token) {
        if (String(req.query.token).includes(process.env.API_TOKEN)) {
          next();
        } else {
          res.status(429).json({ code: 429, message: "You are being rate limited." });
        }
      } else {
        res.status(429).json({ code: 429, message: "You are being rate limited." });
      }
    });
}

app.enable("trust proxy");
app.use(promMiddleware({metricsPath: "/metrics", collectDefaultMetrics: true, requestDurationBuckets: [0.1, 0.5, 1, 1.5]}));
app.use(cors({ credentials: true, origin: "*" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.engine("handlebars", expressHandlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(morgan(` :date[iso] | REQUEST | :ip - :method ":url" :status :res[content-length] - :response-time ms`));

app.get("/", (req, res: any, next: () => void) => {
  return res.status(200).redirect("https://docs.atomicradio.eu/");
});

app.use("/assets", express.static("./assets/"));
app.use("/channels", globalRateLimiter, channel);
app.use("/weather", weatherRateLimiter, weather);
app.use("/cards", globalRateLimiter, card);

app.use("*", (req, res: any, next: () => void) => {
  const randomMessage = [
    "I went to this endpoint and all I got was this lousy 404 error!",
    "Congratulations, you broke the Internet.",
    "The endpoint you're after no longer exists.",
    "Houston, we have a problem!",
    "This is not the endpoint you're looking for. Move along...",
    "It's looking like you have taken a wrong turn. Don't worry it happens to the best of us.",
    "We searched high and low but couldn't find what you're looking for.",
    "Oops, the planet you are looking for doesn't exist Captain!"
  ];
  return res.status(404).json({ code: 404, messsage: randomMessage[Math.floor(Math.random() * randomMessage.length)] });
});

const port = process.env.PORT;
httpServer
  .listen(port, () => {
    LogService.logInfo(`📡 atomicradio API is listening on port ${port}.`);
  })
  .on("error", (err) => {
    LogService.logError("Error while starting atomicradio api. Is the port used?");
    console.log(err);
  });
