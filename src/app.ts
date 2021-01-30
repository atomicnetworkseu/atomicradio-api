'use strict';

import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import moment from 'moment';
import expressHandlebars from 'express-handlebars';
/*import CacheManager from "fast-node-cache";*/
import anonymize from "ip-anonymize";

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
/*const cache = new CacheManager({
    cacheDirectory: "../caches",
    memoryOnly: false,
    discardTamperedCache: true
});*/

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

app.use(cors({credentials: true,origin: ['*']}));
app.use(morgan(` :date[iso] | REQUEST | :ip - :method ":url" :status :res[content-length] - :response-time ms`));

app.use('**', (req: express.Request, res: express.Response, next: () => void) => {
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