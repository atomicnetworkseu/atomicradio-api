import * as fs from "fs";
import sharp from "sharp";
import CacheManager from "fast-node-cache";
import FlakeId from "flakeid";
import { LogService } from "./log.service";
import { SongModel } from "../models/song.model";
import { ArtworkService } from "./artwork.service";
import { ChannelService } from "./channel.service";

const flake = new FlakeId();
const cache = new CacheManager({
    memoryOnly: true,
    discardTamperedCache: true
});

export namespace MAirListService {
    export function updateMetaData(data: any) {
        const liveData: { song: { artist: string; title: string; start_at: Date; end_at: Date; duration: number; artworks: {} }; schedule: any[]; history: any[]; } = {
            song: { artist: "", title: "", start_at: null, end_at: null, duration: null, artworks: {} },
            schedule: [],
            history: []
        };

        liveData.song.artist = String(data.artist).toUpperCase();
        liveData.song.title = String(data.title).toUpperCase();
        liveData.song.start_at = new Date(Number(MAirListService.convertStartToSeconds(data.start_at)) * 1000);
        liveData.song.end_at = new Date((MAirListService.convertStartToSeconds(data.start_at)+Number(MAirListService.convertDurationToSeconds(data.duration)) * 1000));
        liveData.song.duration = MAirListService.convertDurationToSeconds(data.duration);
        liveData.song.artworks = MAirListService.saveArtworks(data.artist + " - " + data.title, data.artwork);

        const schedule = JSON.parse(data.schedule);
        for (const item of schedule) {
            liveData.schedule.push({
                artist: String(item.artist).toUpperCase(),
                title: String(item.title).toUpperCase(),
                playlist: "",
                start_at: new Date(Number(MAirListService.convertStartToSeconds(item.start_at)) * 1000),
                end_at: new Date((MAirListService.convertStartToSeconds(item.start_at)+Number(MAirListService.convertDurationToSeconds(item.duration)) * 1000)),
                duration: MAirListService.convertDurationToSeconds(item.duration),
                artworks: MAirListService.saveArtworks(item.artist + " - " + item.title, item.artwork)
            });
        }

        cache.set("live_metadata", liveData);
        ChannelService.getStationInfos("atr.one");
    }

    export function saveArtworks(key: string, base64Image: string) {
        if (base64Image.length === 0) {
            return ArtworkService.getErrorArtworks();
        }

        const foundArtId = cache.get(key);
        if(foundArtId !== undefined) {
            return {
                1000: `https://cdn.atomicradio.eu/live/${foundArtId}/1000.jpg`,
                500: `https://cdn.atomicradio.eu/live/${foundArtId}/0500.jpg`,
                250: `https://cdn.atomicradio.eu/live/${foundArtId}/0250.jpg`,
                100: `https://cdn.atomicradio.eu/live/${foundArtId}/0100.jpg`
            };
        }

        const artId = flake.gen();
        const decodedImage = Buffer.from(base64Image, "base64");

        if (!fs.existsSync(`./assets/live/${artId}`)) {
            cache.set(key, artId);
            fs.mkdirSync(`./assets/live/${artId}`);

            fs.writeFile(`./assets/live/${artId}/1000.jpg`, decodedImage, (err) => {
                sharp(`./assets/live/${artId}/1000.jpg`)
                    .resize(500, 500)
                    .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                    .toFile(`./assets/live/${artId}/0500.jpg`)
                    .catch((error) => {
                        LogService.logError("The size of one artwork could not be resized to 500. (" + artId + ")");
                    });
                sharp(`./assets/live/${artId}/1000.jpg`)
                    .resize(250, 250)
                    .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                    .toFile(`./assets/live/${artId}/0250.jpg`)
                    .catch((error) => {
                        LogService.logError("The size of one artwork could not be resized to 250. (" + artId + ")");
                    });
                sharp(`./assets/live/${artId}/1000.jpg`)
                    .resize(100, 100)
                    .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                    .toFile(`./assets/live/${artId}/0100.jpg`)
                    .catch((error) => {
                        LogService.logError("The size of one artwork could not be resized to 100. (" + artId + ")");
                    });
            });
        }

        return {
            1000: `https://cdn.atomicradio.eu/live/${artId}/1000.jpg`,
            500: `https://cdn.atomicradio.eu/live/${artId}/0500.jpg`,
            250: `https://cdn.atomicradio.eu/live/${artId}/0250.jpg`,
            100: `https://cdn.atomicradio.eu/live/${artId}/0100.jpg`
        };
    }

    export function getArtwork(key: string) {
        const artId = cache.get(key);
        if(artId === undefined) {
            return ArtworkService.getErrorArtworks();
        }
        return {
            1000: `https://cdn.atomicradio.eu/live/${artId}/1000.jpg`,
            500: `https://cdn.atomicradio.eu/live/${artId}/0500.jpg`,
            250: `https://cdn.atomicradio.eu/live/${artId}/0250.jpg`,
            100: `https://cdn.atomicradio.eu/live/${artId}/0100.jpg`
        };
    }

    export function getCache() {
        return cache;
    }

    export function getCurrentSong(): SongModel {
        const metadata = cache.get("live_metadata");
        if(metadata === undefined) {
            return {
                artist: "LISTEN TO THE DIFFERENCE!",
                title: "ATOMICRADIO",
                playlist: "",
                start_at: null,
                end_at: null,
                duration: null,
                artworks: null
            };
        }
        return {
            artist: metadata.song.artist,
            title: metadata.song.title,
            playlist: "",
            start_at: metadata.song.start_at,
            end_at: metadata.song.end_at,
            duration: Number(metadata.song.duration),
            artworks: metadata.song.artworks
        };
    }

    export function getSchedule(): SongModel[] {
        const metadata = cache.get("live_metadata");
        if(metadata === undefined) {
            return [];
        }
        return metadata.schedule;
    }

    export function getHistory(): SongModel[] {
        const metadata = cache.get("live_metadata");
        if(metadata === undefined) {
            return [];
        }
        return metadata.history;
    }

    export function convertStartToSeconds(start_at: number) {
        const splited = String(start_at).split(" ");
        const date = splited[0];
        const time = splited[1];

        return (
            new Date(
                Number(date.split(".")[2]),
                Number(date.split(".")[1]) - 1,
                Number(date.split(".")[0]),
                Number(time.split(":")[0]),
                Number(time.split(":")[1]),
                Number(time.split(":")[2]),
                0
            ).getTime() / 1000
        );
    }

    export function convertDurationToSeconds(duration: number) {
        const splited = String(duration).split(":");
        return 60 * Number(splited[1]) + Number(splited[2]);
    }
}
