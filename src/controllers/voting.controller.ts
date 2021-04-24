import { Request, Response } from "express";
import { VoteSongModel, VotingModel } from "../models/voting.model";
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

        const result: VoteSongModel[] = [];
        const xForwardedFor = req.headers["x-forwarded-for"] || req.ips;
        const ip = String(xForwardedFor).split(",")[0].trim();
        for(const item of voting.items) {
            const song: VoteSongModel = { id: item.id, unique_id: item.unique_id, artist: item.artist, title: item.title, type: item.type, votes: item.votes, voted: false, preview_url: item.preview_url, artworks: item.artworks };
            if(VotingService.hasVoted(ip, item.id)) {
                song.voted = true;
            } else {
                song.voted = false;
            }
            result.push(song);
        }
        console.log(voting.items[0].filePath);
        return res.status(200).json({ items: result, created_at: voting.created_at, ending_at: voting.ending_at, completed: voting.completed });
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
        if(voting.completed) {
            return res.status(500).json({ code: 500, message: "Voting has been closed. Try again later." });
        }

        const xForwardedFor = req.headers["x-forwarded-for"] || req.ips;
        const ip = String(xForwardedFor).split(",")[0].trim();
        if(VotingService.hasVoted(ip, id)) {
            return res.status(500).json({ code: 500, message: "You have already voted for this song." });
        }
        const song = VotingService.addVote(ip, id);
        if(song === undefined) {
            return res.status(404).json({ code: 404, message: "The song with the given id was not found." });
        }
        return res.status(201).json({ code: 201, message: "Thank you for your vote for " + song.artist + " - " + song.title + "."});
    }

}