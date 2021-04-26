import { VoteModel, VotingModel, VoteSongModel } from "../models/voting.model";
import { ArtworkService } from "./artwork.service";
import { AzuracastService } from "./azuracast.service";
import CacheManager from "./cache.service";
import { LogService } from "./log.service";

const cache = new CacheManager("cache");
cache.onTimeout.subscribe((data) => {
    console.log(data);
    if(data.key === "voting") {
        VotingService.completeVoting();
    }
});

export namespace VotingService {

    export function startVoting() {
        if(cache.get("voting") !== null) return;
        LogService.logError("The voting has been started.");
        cache.clear();
        AzuracastService.getMedia().then((mediaArray) => {
            const result: VoteSongModel[] = [];
            const newcomer = mediaArray.filter(x => x.playlists[0].name === "#MAINSTAGE");
            const charts = mediaArray.filter(x => x.playlists[0].name === "#MAINSTAGE");
            for(let i = 1; i < 16; i++) {
                const media_id = Math.floor(Math.random()*newcomer.length);
                const media = newcomer[media_id];
                newcomer.splice(media_id, 1);
                result.push({
                    id: i,
                    unique_id: media.media.id,
                    artist: media.media.artist,
                    title: media.media.title,
                    type: "NEWCOMER",
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
                    type: "CHARTS",
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
                ending_at: new Date(endingDate.getFullYear(), endingDate.getMonth(), endingDate.getDate(), 18, 30).getTime(),
                completed: false
            };
            cache.set("voting", voting, new Date(endingDate.getFullYear(), endingDate.getMonth(), endingDate.getDate(), 18).getTime()-new Date().getTime());
        }).catch((err) => {
            LogService.logError("Error while reading azuracast media list.");
        });
    }

    export function addVote(ip: string, id: number) {
        const voting = cache.get("voting") as VotingModel;
        const song = voting.items.find(x => x.id === id);
        if(voting === null || song === undefined) {
            return undefined;
        }

        const votes = cache.get("votes") as VoteModel[];
        if(votes === null) {
            cache.set("votes", [{ id, ip }]);
        } else {
            votes.push({ id, ip });
            cache.set("votes", votes);
        }
        song.votes += 1;
        voting.items.sort((a, b) => {return b.votes-a.votes});
        const date = new Date(voting.ending_at);
        cache.set("voting", voting, new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18).getTime()-new Date().getTime());
        return song;
    }

    export function hasVoted(ip: string, id: number) {
        const votes = cache.get("votes") as VoteModel[];
        if(votes === null) return false;
        const vote = votes.find(x => x.ip === ip && x.id === id);
        if(vote === undefined) return false;
        return true;
    }

    export function completeVoting() {
        const voting = cache.get("voting") as VotingModel;
        if(voting === null) return;
        if(voting.completed) return;
        voting.completed = true;
        const items = voting.items.slice(0, 5);
        const jingles = ["atomic_mixed_4.mp3", "atomic_mixed_3.mp3", "atomic_mixed_2.mp3", "atomic_mixed_1.mp3", "atomic_mixed_0.mp3"];
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