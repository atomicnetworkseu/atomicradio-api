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
import channel from "./routers/channel.router";
import weather from "./routers/weather.router";
import card from "./routers/card.router";
import voting from "./routers/voting.router";
import { connect } from "mongoose";
import { LogService } from "./services/log.service";
import { SocketService } from "./services/socket.service";
import { RateLimiterService } from "./services/ratelimiter.service";
import { ChannelService } from "./services/channel.service";

const app = express();
const httpServer = new http.Server(app);

connect("mongodb://localhost/atomicradio-api", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

SocketService.init(httpServer);

dotenv.config();
ChannelService.getStationInfos("atr.one");

// VotingService.loadVoting();

morgan.token("host", (req: express.Request, res: express.Response) => {
  return req.hostname;
});

morgan.token("ip", (req: express.Request, res: express.Response) => {
  const xForwardedFor = req.headers["x-forwarded-for"] || req.ips;
  const ip = String(xForwardedFor).split(",")[0].trim();
  return anonymize(ip);
});

morgan.token("date", (req: express.Request, res: express.Response) => {
  return moment().format("DD/MM/YYYY HH:mm:ss");
});

app.enable("trust proxy");
app.use(promMiddleware({metricsPath: "/metrics", collectDefaultMetrics: true, requestDurationBuckets: [0.1, 0.5, 1, 1.5]}));
app.use(cors({ credentials: true, origin: "*" }));
app.use(bodyParser.urlencoded({ extended: true, limit: '16mb' }));
app.use(bodyParser.json({ limit: '16mb' }));
app.use(cookieParser());
app.engine("handlebars", expressHandlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(morgan(` :date[iso] | REQUEST | :ip - :method ":url" :status :res[content-length] - :response-time ms`));

app.get("/", (req, res: any, next: () => void) => {
  return res.status(200).redirect("https://docs.atomicradio.eu/");
});

app.use("/assets", express.static("./assets/"));
app.use("/channels", RateLimiterService.globalRateLimiter, channel);
app.use("/weather", RateLimiterService.weatherRateLimiter, weather);
app.use("/cards", RateLimiterService.globalRateLimiter, card);
app.use("/voting", RateLimiterService.globalRateLimiter, voting);

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

app.use((error: any, req: express.Request, res: express.Response, next: () => void) => {
  res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
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
