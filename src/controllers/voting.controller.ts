import { Request, Response } from "express";
import { VotingModel } from "../models/voting.model";
import { CacheService } from "../services/cache.service";

export namespace VotingController {

    export function getVoting(req: Request, res: Response) {
        if(CacheService.get("voting") === undefined) {
            return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
        }

        const voting = CacheService.get("voting") as VotingModel;
        if(voting.items.length === 0) {
            return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
        }
        return res.status(200).json(voting);
    }

}