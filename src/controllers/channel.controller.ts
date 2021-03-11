'use strict';
import { Request, Response } from 'express';
import { CacheService } from '../services/cache.service';
import { AzuracastService } from '../services/azuracast.service';

export namespace ChannelController {

    export function getChannels(req: Request, res: Response) {
        const channelOne = CacheService.get("channel-one");
        const channelDance = CacheService.get("channel-dance");
        const channelTrap = CacheService.get("channel-trap");
        const listeners = CacheService.get("listeners");
        if(listeners === undefined) {
            return res.status(200).json({listeners: {discord: 0, teamspeak: 0, web: 0, all: 0}, one: channelOne, dance: channelDance, trap: channelTrap});
        }
        return res.status(200).json({listeners, one: channelOne, dance: channelDance, trap: channelTrap});
    }

    export function getChannelById(req: Request, res: Response) {
        let channelId = String(req.params.id).toLowerCase();
        if(channelId.includes("atr.")) {
            channelId = channelId.split(".")[1];
        } else if(channelId.includes("atr-")) {
            channelId = channelId.split("-")[1];
        }

        switch (channelId) {
            case "one":
                const channelOne = CacheService.get("channel-one");
                return res.status(200).json(channelOne);
            case "dance":
                const channelDance = CacheService.get("channel-dance");
                return res.status(200).json(channelDance);
            case "trap":
                const channelTrap = CacheService.get("channel-trap");
                return res.status(200).json(channelTrap);
            default:
                return res.status(404).json({code: 404, message: 'This channel does not exist.'});
        }
    }

    export function getChannelSong(req: Request, res: Response) {
        let channelId = String(req.params.id).toLowerCase();
        if(channelId.includes("atr.")) {
            channelId = channelId.split(".")[1];
        } else if(channelId.includes("atr-")) {
            channelId = channelId.split("-")[1];
        }

        if(channelId === 'one' || channelId === 'dance' || channelId === 'trap') {
            const channel = CacheService.get("channel-" + channelId);
            return res.status(200).json(channel.song);
        } else {
            return res.status(404).json({code: 404, message: 'This channel does not exist.'});
        }
    }

    export function getChannelDescription(req: Request, res: Response) {
        let channelId = String(req.params.id).toLowerCase();
        if(channelId.includes("atr.")) {
            channelId = channelId.split(".")[1];
        } else if(channelId.includes("atr-")) {
            channelId = channelId.split("-")[1];
        }

        if(channelId === 'one' || channelId === 'dance' || channelId === 'trap') {
            const channel = CacheService.get("channel-" + channelId);
            return res.status(200).json(channel.description);
        } else {
            return res.status(404).json({code: 404, message: 'This channel does not exist.'});
        }
    }

    export function getChannelSchedule(req: Request, res: Response) {
        let channelId = String(req.params.id).toLowerCase();
        if(channelId.includes("atr.")) {
            channelId = channelId.split(".")[1];
        } else if(channelId.includes("atr-")) {
            channelId = channelId.split("-")[1];
        }

        if(channelId === 'one' || channelId === 'dance' || channelId === 'trap') {
            const channel = CacheService.get("channel-" + channelId);
            return res.status(200).json(channel.schedule);
        } else {
            return res.status(404).json({code: 404, message: 'This channel does not exist.'});
        }
    }

    export function getChannelHistory(req: Request, res: Response) {
        let channelId = String(req.params.id).toLowerCase();
        if(channelId.includes("atr.")) {
            channelId = channelId.split(".")[1];
        } else if(channelId.includes("atr-")) {
            channelId = channelId.split("-")[1];
        }

        if(channelId === 'one' || channelId === 'dance' || channelId === 'trap') {
            const channel = CacheService.get("channel-" + channelId);
            return res.status(200).json(channel.history);
        } else {
            return res.status(404).json({code: 404, message: 'This channel does not exist.'});
        }
    }

    export function getChannelListeners(req: Request, res: Response) {
        let channelId = String(req.params.id).toLowerCase();
        if(channelId.includes("atr.")) {
            channelId = channelId.split(".")[1];
        } else if(channelId.includes("atr-")) {
            channelId = channelId.split("-")[1];
        }

        if(channelId === 'one' || channelId === 'dance' || channelId === 'trap') {
            const channel = CacheService.get("channel-" + channelId);
            return res.status(200).json({listeners: channel.listeners});
        } else {
            return res.status(404).json({code: 404, message: 'This channel does not exist.'});
        }
    }

    export function getChannelLive(req: Request, res: Response) {
        let channelId = String(req.params.id).toLowerCase();
        if(channelId.includes("atr.")) {
            channelId = channelId.split(".")[1];
        } else if(channelId.includes("atr-")) {
            channelId = channelId.split("-")[1];
        }

        if(channelId === 'one') {
            const channel = CacheService.get("channel-" + channelId);
            return res.status(200).json(channel.live);
        } else if(channelId === 'dance' || channelId === 'trap') {
            return res.status(500).json({code: 500, message: "Only our channel 'atr.one' has live metadata."});
        } else {
            return res.status(404).json({code: 404, message: 'This channel does not exist.'});
        }
    }

    export function updateChannelLive(req: Request, res: Response) {
        if(!req.headers.authorization) {
            return res.status(401).json({code: 401, message: 'Your authentication was not successful.'});
        }
        if(!req.headers.authorization.includes(Buffer.from("secret-user-psshhh:" + process.env.API_TOKEN).toString('base64'))) {
            return res.status(401).json({code: 401, message: 'Your authentication was not successful.'});
        }

        AzuracastService.getStationInfos("one");
        return res.status(200).json({code: 200, message: 'Hello Azuracast!'});
    }

}