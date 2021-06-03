import CacheManager from "fast-node-cache";
import { VoteModel, VoteSongModel, VotingModel } from "../models/voting.model";
import { ArtworkService } from "./artwork.service";
import { LogService } from "./log.service";
import { RadioBossService } from "./radioboss.service";
import { RedisService } from "./redis.service";

const cache = new CacheManager({
    memoryOnly: true,
    discardTamperedCache: true
});
cache.on("update", (key, data) => {
    console.log("update " + key);
    RedisService.set(key, JSON.stringify(data));
});
cache.on("outdated", (key, data) => {
    if (key.startsWith("voting")) {
        VotingService.completeVoting();
    }
});

export namespace VotingService {

    export function loadVoting() {
        RedisService.get("voting").then((voting: VotingModel) => {
            if(voting.closing_at.getTime() <= new Date().getTime()) {
                startVoting();
                return;
            }
            cache.set("voting", voting, voting.closing_at.getTime()-new Date().getTime());
            LogService.logInfo("The voting has been loaded.");
            RedisService.get("votes").then((votes: VoteModel[]) => {
                if(votes === null || votes === undefined) {
                    cache.set("votes", []);
                    return;
                }
                cache.set("votes", votes);
            });
        }).catch((err) => {
            startVoting();
        });
    }

    export function startVoting() {
        LogService.logInfo("The voting has been started.");
        RedisService.clear();
        RadioBossService.getPlaylist().then((mediaArray) => {
            const result: VoteSongModel[] = [];
            const newcomer = mediaArray.Playlist.TRACK.filter(x => x.FILENAME.includes("hitshouse"));
            const charts = mediaArray.Playlist.TRACK.filter(x => x.FILENAME.includes("hitsonly"));
            for(let i = 1; i < 16; i++) {
                const media_id = Math.floor(Math.random()*newcomer.length);
                const media = newcomer[media_id];
                newcomer.splice(media_id, 1);
                ArtworkService.getArtworks(media.FILENAME).then((artworks) => {
                    result.push({
                        id: result.length + 1,
                        artist: media.CASTTITLE.split(" - ")[0],
                        title: media.CASTTITLE.split(" - ")[1],
                        type: "#NEWCOMER",
                        filePath: media.FILENAME,
                        votes: 0,
                        voted: null,
                        preview_url: "",
                        artworks
                    });
                });
            }
            for(let i = 1; i < 16; i++) {
                const media_id = Math.floor(Math.random()*charts.length);
                const media = charts[media_id];
                charts.splice(media_id, 1);
                ArtworkService.getArtworks(media.FILENAME).then((artworks) => {
                    result.push({
                        id: result.length + 1,
                        artist: media.CASTTITLE.split(" - ")[0],
                        title: media.CASTTITLE.split(" - ")[1],
                        type: "#CHARTS",
                        filePath: media.FILENAME,
                        votes: 0,
                        voted: null,
                        preview_url: "",
                        artworks
                    });
                });
            }
            const endingDate = new Date();
            endingDate.setDate(endingDate.getDate() + (7 + 5 - endingDate.getDay() - 1) % 7 +1);
            const voting: VotingModel = {
                items: result,
                created_at: new Date(),
                closing_at: new Date(endingDate.getFullYear(), endingDate.getMonth(), endingDate.getDate(), 18),
                ending_at: new Date(endingDate.getFullYear(), endingDate.getMonth(), endingDate.getDate(), 18, 30),
                closed: false
            };
            cache.set("voting", voting, 10000);
        }).catch((err) => {
            LogService.logError("Error while reading azuracast media list.");
        });
    }

    export function addVote(ip: string, id: number) {
        const voting = cache.get("voting") as VotingModel;
        const song = voting.items.find(x => x.id === id);
        if(voting === undefined || song === undefined) {
            return undefined;
        }

        const votes = cache.get("votes") as VoteModel[];
        if(votes === undefined) {
            cache.set("votes", [{ id, ip }]);
        } else {
            votes.push({ id, ip });
            cache.set("votes", votes);
        }
        song.votes += 1;
        voting.items.sort((a, b) => {return b.votes-a.votes});
        cache.set("voting", voting, voting.closing_at.getTime()-new Date().getTime());
        return song;
    }

    export function hasVoted(ip: string, id: number) {
        const votes = cache.get("votes") as VoteModel[];
        if(votes === undefined) return false;
        const vote = votes.find(x => x.ip === ip && x.id === id);
        if(vote === undefined) return false;
        return true;
    }

    export function completeVoting() {
        const voting = cache.get("voting") as VotingModel;
        if(voting === undefined) return;
        if(voting.closed) return;
        voting.closed = true;
        const items = voting.items.slice(0, 5);
        items.reverse();
        items.forEach((x) => RadioBossService.requestSong(x.filePath));
        setTimeout(() => {
            VotingService.startVoting();
        }, (voting.ending_at.getTime()-new Date().getTime()));
    }

    export function getCache() {
        return cache;
    }

}