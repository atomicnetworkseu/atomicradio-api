import { Request, Response } from "express";
import { VotingModel } from "../models/voting.model";
import { CacheService } from "../services/cache.service";
import { VotingService } from "../services/voting.service";

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

    export function addVote(req: Request, res: Response) {
        if(CacheService.get("voting") === undefined) {
            return res.status(500).json({ code: 500, message: "Voting is currently disabled. Try again later." });
        }

        if(!req.query.id) {
            return res.status(404).json({ code: 404, message: "No id specified in the query." });
        }
        const id = Number(req.query.id);

        const voting = CacheService.get("voting") as VotingModel;
        if(voting.items.length === 0) {
            return res.status(404).json({ code: 404, message: "There are currently no songs in the voting. Try again later." });
        }

        const song = VotingService.addVote(id);
        if(song === undefined) {
            return res.status(404).json({ code: 404, message: "The song with the given id was not found." });
        }
        return res.status(201).json({ code: 201, message: "Thank you for your vote for " + song.artist + " - " + song.title + "."});
    }

}