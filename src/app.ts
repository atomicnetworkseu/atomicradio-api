'use strict';
import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import expressHandlebars from 'express-handlebars';
import anonymize from "ip-anonymize";
import moment from 'moment';
import channel from './routers/channel.router';
import weather from './routers/weather.router';
import card from './routers/card.router';
import webhook from './routers/webhook.router';
import { AzuracastService } from './services/azuracast.service';
import { ListenerService } from './services/listener.service';
import { LogService } from './services/log.service';
import { SocketService } from './services/socket.service';

const app = express();
const httpServer = new http.Server(app);
SocketService.init(httpServer);

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

morgan.token('date', (req: express.Request, res: express.Response) => {
    return moment().format('DD/MM/YYYY HH:mm:ss');
});

app.enable("trust proxy");
app.use(cors({credentials: true, origin: '*'}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(morgan(` :date[iso] | REQUEST | :ip - :method ":url" :status :res[content-length] - :response-time ms`));
app.use('/assets', express.static('./assets/'));
app.use('/channels', channel);
app.use('/weather', weather);
app.use('/cards', card);
app.use('/webhook', webhook);

app.use('**', (req, res: any, next: () => void) => {
    return res.status(200).redirect("https://docs.atomicradio.eu/");
});

const port = process.env.PORT;
httpServer.listen(port, () => {
    LogService.logInfo(`📡 atomicradio API is listening on port ${port}.`);
}).on('error', err => {
    LogService.logError("Error while starting atomicradio api. Is the port used?");
    console.log(err);
});
