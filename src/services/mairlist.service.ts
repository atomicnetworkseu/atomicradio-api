import * as fs from "fs";
import sharp from "sharp";
import CacheManager from "fast-node-cache";
import { ArtworkService } from "./artwork.service";
import { LogService } from "./log.service";
import { AzuracastService } from "./azuracast.service";

const cache = new CacheManager({
    memoryOnly: true,
    discardTamperedCache: true
});

export namespace MAirListService {
    export function updateMetaData(data: any) {
        const liveData: { song: { artist: string; title: string; start_at: number; duration: number; artworks: {} }; schedule: any[] } = {
            song: { artist: "", title: "", start_at: 0, duration: 0, artworks: {} },
            schedule: []
        };

        liveData.song.artist = data.artist;
        liveData.song.title = data.title;
        liveData.song.start_at = MAirListService.convertStartToSeconds(data.start_at);
        liveData.song.duration = MAirListService.convertDurationToSeconds(data.duration);
        liveData.song.artworks = MAirListService.saveArtworks(data.artist + " - " + data.title, data.artwork);

        const schedule = JSON.parse(data.schedule);
        for (let item of schedule) {
            liveData.schedule.push({
                artist: item.artist,
                title: item.title,
                playlist: "",
                start_at: MAirListService.convertStartToSeconds(item.start_at),
                end_at: Number(MAirListService.convertStartToSeconds(item.start_at)) + Number(MAirListService.convertDurationToSeconds(item.duration)),
                duration: MAirListService.convertDurationToSeconds(item.duration),
                artworks: MAirListService.saveArtworks(item.artist + " - " + item.title, item.artwork)
            });
        }

        cache.set("live_metadata", liveData);
        AzuracastService.getStationInfos("one");
    }

    export function saveArtworks(key: string, base64Image: string) {
        if (base64Image.length === 0) {
            return ArtworkService.getErrorArtworks();
        }

        const foundArtId = cache.get(key);
        if(foundArtId !== undefined) {
            return {
                1000: `https://cdn.atomicradio.eulive/${foundArtId}/1000.jpg`,
                500: `https://cdn.atomicradio.eu/live/${foundArtId}/0500.jpg`,
                250: `https://cdn.atomicradio.eu/live/${foundArtId}/0250.jpg`,
                100: `https://cdn.atomicradio.eu/live/${foundArtId}/0100.jpg`
            };
        }

        const artId = MAirListService.generateArtworkId();
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

    export function getCurrentSong() {
        const metadata = cache.get("live_metadata");
        if(metadata === undefined) {
            return {
                artist: "LISTEN TO THE DIFFERENCE!",
                title: "ATOMICRADIO",
                playlist: "",
                start_at: 0,
                end_at: 0,
                duration: 0,
                artworks: ArtworkService.getErrorArtworks()
            };
        }
        return {
            artist: metadata.song.artist,
            title: metadata.song.title,
            playlist: "",
            start_at: Number(metadata.song.start_at),
            end_at: Number(metadata.song.start_at) + Number(metadata.song.duration),
            duration: Number(metadata.song.duration),
            artworks: metadata.song.artworks
        };
    }

    export function getSchedule() {
        const metadata = cache.get("live_metadata");
        if(metadata === undefined) {
            return [];
        }
        return metadata.schedule;
    }

    export function generateArtworkId() {
        var result = "";
        var characters = "abcdefghijkmnoprstuw0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < 32; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
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
