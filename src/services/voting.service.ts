import { VoteModel, VotingModel } from "../models/voting.model";
import { ArtworkService } from "./artwork.service";
import { AzuracastService } from "./azuracast.service";
import { CacheService } from "./cache.service";
import { LogService } from "./log.service";

export namespace VotingService {

    export function startVoting() {
        AzuracastService.getMedia().then((mediaArray) => {
            const result = [];
            for(let i = 1; i < 11; i++) {
                const media = mediaArray[Math.floor(Math.random()*mediaArray.length)];
                result.push({
                    id: i,
                    artist: media.media.artist,
                    title: media.media.title,
                    playlist: media.playlists[0].name,
                    votes: 0,
                    preview_url: "",
                    artworks: ArtworkService.getArtworks(media.media.id, "http://" + process.env.AZURACAST_API + media.media.art)
                });
            }
            const voting: VotingModel = {
                items: result,
                created_at: Math.round(new Date().getTime()/1000),
                ending_at: 0
            };
            CacheService.set("voting", voting);
        }).catch(() => {
            LogService.logError("Error while reading azuracast media list.");
        });
    }

    export function addVote(ip: string, id: number) {
        const voting = CacheService.get("voting") as VotingModel;
        const song = voting.items.find(x => x.id === id);
        if(voting === undefined || song === undefined) {
            return undefined;
        }

        const votes = CacheService.get("votes") as VoteModel[];
        if(votes === undefined) {
            CacheService.set("votes", [{ id, ip }]);
        } else {
            votes.push({ id, ip });
        }
        song.votes += 1;
        voting.items.sort((a, b) => {return b.votes-a.votes});
        return song;
    }

    export function hasVoted(ip: string, id: number) {
        const votes = CacheService.get("votes") as VoteModel[];
        if(votes === undefined) return false;
        const vote = votes.find(x => x.ip === ip && x.id === id);
        if(vote === undefined) return false;
        return true;
    }

}