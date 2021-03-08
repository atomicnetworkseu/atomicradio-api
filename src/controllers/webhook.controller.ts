'use strict';
import { Request, Response } from 'express';
import { AzuracastService } from '../services/azuracast.service';

export namespace WebhookController {

    export function azuracastStream(req: Request, res: Response) {
        if(!req.headers.authorization.includes(Buffer.from("secret-user-psshhh:" + process.env.API_TOKEN).toString('base64'))) {
            return res.status(401).json({code: 401, message: 'Your authentication was not successful.'});
        }
        
        AzuracastService.getStationInfos("one");
        return res.status(200).json({code: 200, message: 'Hello Azuracast!'});
    }

}