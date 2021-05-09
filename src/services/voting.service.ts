import CacheManager from "fast-node-cache";
import { VoteModel, VotingModel, VoteSongModel } from "../models/voting.model";
import { ArtworkService } from "./artwork.service";
import { AzuracastService } from "./azuracast.service";
import { LogService } from "./log.service";
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
            if(voting.closing_at <= new Date().getTime()) {
                startVoting();
                return;
            }
            cache.set("voting", voting, voting.closing_at-new Date().getTime());
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
        AzuracastService.getMedia().then((mediaArray) => {
            const result: VoteSongModel[] = [];
            const newcomer = mediaArray.filter(x => x.playlists[0].name === "voting.newcomer");
            const charts = mediaArray.filter(x => x.playlists[0].name === "voting.charts");
            for(let i = 1; i < 16; i++) {
                const media_id = Math.floor(Math.random()*newcomer.length);
                const media = newcomer[media_id];
                newcomer.splice(media_id, 1);
                result.push({
                    id: i,
                    unique_id: media.media.id,
                    artist: media.media.artist,
                    title: media.media.title,
                    type: "#NEWCOMER",
                    filePath: media.path,
                    votes: 0,
                    voted: null,
                    preview_url: "",
                    artworks: ArtworkService.getArtworks(media.media.id, "http://" + process.env.AZURACAST_API + media.media.art)
                });
            }
            for(let i = 1; i < 16; i++) {
                const media_id = Math.floor(Math.random()*charts.length);
                const media = charts[media_id];
                charts.splice(media_id, 1);
                result.push({
                    id: i+15,
                    unique_id: media.media.id,
                    artist: media.media.artist,
                    title: media.media.title,
                    type: "#CHARTS",
                    filePath: media.path,
                    votes: 0,
                    voted: null,
                    preview_url: "",
                    artworks: ArtworkService.getArtworks(media.media.id, "http://" + process.env.AZURACAST_API + media.media.art)
                });
            }
            const endingDate = new Date();
            endingDate.setDate(endingDate.getDate() + (7 + 5 - endingDate.getDay() - 1) % 7 +1);
            const voting: VotingModel = {
                items: result,
                created_at: new Date().getTime(),
                closing_at: new Date(endingDate.getFullYear(), endingDate.getMonth(), endingDate.getDate(), 18).getTime(),
                ending_at: new Date(endingDate.getFullYear(), endingDate.getMonth(), endingDate.getDate(), 18, 30).getTime(),
                closed: false
            };
            cache.set("voting", voting, voting.closing_at-new Date().getTime());
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
        cache.set("voting", voting, voting.closing_at-new Date().getTime());
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
        const jingles = ["jingles/voting/place5.mp3", "jingles/voting/place4.mp3", "jingles/voting/place3.mp3", "jingles/voting/place2.mp3", "jingles/voting/place1.mp3"];
        AzuracastService.deleteQueue().then(() => {
            const songs = [jingles[4], items[4].filePath, jingles[3], items[3].filePath, jingles[2], items[2].filePath, jingles[1], items[1].filePath, jingles[0], items[0].filePath];
            AzuracastService.requestSongs(songs);
        });
        setTimeout(() => {
            VotingService.startVoting();
        }, (voting.ending_at-new Date().getTime()));
    }

    export function getCache() {
        return cache;
    }

}