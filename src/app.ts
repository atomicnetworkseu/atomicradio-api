'use strict';
import dotenv from 'dotenv';
import http from 'http';
import socket from 'socket.io';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import moment from 'moment';
import expressHandlebars from 'express-handlebars';
import anonymize from "ip-anonymize";
import channel from './routers/channel.router';
import weather from './routers/weather.router';
import card from './routers/card.router';
import { AzuracastService } from './services/azuracast.service';
import { ListenerService } from './services/listener.service';

const app = express();
const httpServer = new http.Server(app);
const io = new socket.Server(httpServer);

dotenv.config();
AzuracastService.getStationInfos("one");
AzuracastService.getStationInfos("dance");
AzuracastService.getStationInfos("trap");
ListenerService.requestListener();

morgan.token('host', (req: express.Request, res: express.Response) => {
    return req.hostname;
});

morgan.token('ip', (req: express.Request, res: express.Response) => {
    const xForwardedFor = String(req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '');
    let ip = xForwardedFor || req.connection.remoteAddress;
    if (ip.includes('::ffff:')) {
        ip = ip.split(':').reverse()[0]
    }
    if(ip.includes(',')) {
        ip = ip.split(', ').reverse()[0];
    }
    return anonymize(ip);
});

app.enable("trust proxy");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use('/channels', channel);
app.use('/weather', weather);
app.use('/cards', card);

app.use(cors({credentials: true, origin: ['*']}));
app.use(morgan(` :date[iso] | REQUEST | :ip - :method ":url" :status :res[content-length] - :response-time ms`));

app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

app.use('**', (req, res: any, next: () => void) => {
    return res.status(404).json({code: 404, message: "Express router not found."});
});

io.on("connection", (client: any) => {
    console.info(` ${moment().format('DD/MM/YYYY HH:mm:s')} | CONNECTED | Client connected [id=${client.id}]`);
    client.on('disconnect', () => {
        console.info(` ${moment().format('DD/MM/YYYY HH:mm:s')} | DISCONNECTED | Client gone [id=${client.id}]`);
    });
});

app.listen(9000, () => {
    console.log(` ${moment().format('DD/MM/YYYY HH:mm:s')} | INFO | Web-API is listening on port undefined.`);
}).on('error', err => {
    console.log(err);
});