import { Track } from "../models/radioboss.model";
import * as fs from "fs";
import sharp from "sharp";
import { LogService } from "./log.service";
import { AxiosResponse } from "axios";
import { ArtworksModel } from "../models/song.model";
import { ChannelService } from "./channel.service";

export namespace ArtworkService {

    export function saveArtworks(track: Track, response: AxiosResponse<any>): Promise<ArtworksModel> {
        return new Promise((resolve, reject) => {
            ChannelService.getSongId(track.FILENAME).then((songId) => {
                if (!fs.existsSync(`./assets/artworks/${songId.id}/1000.jpg`)) {
                    try {
                        fs.mkdirSync(`./assets/artworks/${songId.id}`);
                    } catch(err) {
                        LogService.logError(`Directory already exists. The artworks will be downloaded again. (${songId.id})`);
                    }
                    const writer = fs.createWriteStream(`./assets/artworks/${songId.id}/1000.jpg`);
                    response.data.pipe(writer);

                    writer.on("finish", () => {
                        if (!fs.existsSync(`./assets/artworks/${songId.id}/1000.jpg`)) return;
                        const stats = fs.statSync(`./assets/artworks/${songId.id}/1000.jpg`);
                        if(stats.size === 0) {
                            fs.rm(`./assets/artworks/${songId.id}/1000.jpg`, (err) => {
                                if(err) return;
                                fs.rmdirSync(`./assets/artworks/${songId.id}`);
                            });
                            resolve(getErrorArtworks());
                            return;
                        }
                        sharp(`./assets/artworks/${songId.id}/1000.jpg`)
                            .resize(500, 500)
                            .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                            .toFile(`./assets/artworks/${songId.id}/0500.jpg`)
                            .catch((error) => {
                                LogService.logError("Artwork could not be resized to 500. (" + songId.id + ")");
                                resolve(getErrorArtworks());
                            });
                        sharp(`./assets/artworks/${songId.id}/1000.jpg`)
                            .resize(250, 250)
                            .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                            .toFile(`./assets/artworks/${songId.id}/0250.jpg`)
                            .catch((error) => {
                                LogService.logError("Artwork could not be resized to 250. (" + songId.id + ")");
                                resolve(getErrorArtworks());
                            });
                        sharp(`./assets/artworks/${songId.id}/1000.jpg`)
                            .resize(100, 100)
                            .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                            .toFile(`./assets/artworks/${songId.id}/0100.jpg`)
                            .catch((error) => {
                                LogService.logError("Artwork could not be resized to 100. (" + songId.id + ")");
                                resolve(getErrorArtworks());
                            });
                        const artworks: ArtworksModel = {
                            1000: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/1000.jpg`,
                            500: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0500.jpg`,
                            250: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0250.jpg`,
                            100: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0100.jpg`
                        };
                        resolve(artworks);
                    });

                    response.data.on("close", () => {
                        writer.destroy();
                    });
                    response.data.on("error", () => {
                        writer.destroy();
                    });
                    writer.on("error", () => {
                        response.data.destroy();
                        LogService.logError("Artwork could not be saved. (" + songId.id + ")");
                        resolve(getErrorArtworks());
                    });
                    writer.on('end', () => {
                        response.data.destroy();
                    });
                } else {
                    const artworks: ArtworksModel = {
                        1000: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/1000.jpg`,
                        500: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0500.jpg`,
                        250: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0250.jpg`,
                        100: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0100.jpg`
                    }
                    resolve(artworks);
                }
            });
        });
    }

    export function getArtworks(path: string): Promise<ArtworksModel> {
        return new Promise((resolve, reject) => {
            ChannelService.getSongId(path).then((songId) => {
                if (!fs.existsSync(`./assets/artworks/${songId.id}/1000.jpg`)) {
                    resolve(getErrorArtworks());
                } else {
                    const artworks: ArtworksModel = {
                        1000: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/1000.jpg`,
                        500: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0500.jpg`,
                        250: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0250.jpg`,
                        100: `https://dev.atomicradio.eu/api/assets/artworks/${songId.id}/0100.jpg`
                    }
                    resolve(artworks);
                }
            });
        });
    }

    export function getErrorArtworks(): ArtworksModel {
        return {
          1000: "https://cdn.atomicradio.eu/artworks/fallback/1000.jpg",
          500: "https://cdn.atomicradio.eu/artworks/fallback/0500.jpg",
          250: "https://cdn.atomicradio.eu/artworks/fallback/0250.jpg",
          100: "https://cdn.atomicradio.eu/artworks/fallback/0100.jpg"
        };
      }
}