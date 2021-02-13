'use strict';
import fs from "fs";
import axios from "axios";
import sharp from "sharp";
import { LogService } from "./log.service";

export namespace ArtworkService {

    export function getErrorArtworks() {
        return {
            1000: "https://cdn.atomicradio.eu/fallback/1000-060902000.jpg",
            500: "https://cdn.atomicradio.eu/fallback/0500-060902000.jpg",
            250: "https://cdn.atomicradio.eu/fallback/0250-060902000.jpg",
            100: "https://cdn.atomicradio.eu/fallback/0100-060902000.jpg"
        }
    }

    export function getStreamerArtworks(streamerName: string) {
        const name = String(streamerName).toLowerCase().replace(/ /g, '');
        return {
            1000: `https://cdn.atomicradio.eu/streamer/1000-${name}.jpg`,
            500: `https://cdn.atomicradio.eu/streamer/0500-${name}.jpg`,
            250: `https://cdn.atomicradio.eu/streamer/0250-${name}.jpg`,
            100: `https://cdn.atomicradio.eu/streamer/0100-${name}.jpg`
        }
    }

    export function getArtworks(id: string, artwork: string) {
        if(artwork !== "https://cdn.atomicradio.eu/fallback/1000-060902000.jpg") {
            if(!fs.existsSync(`./assets/artworks/1000-${id}.jpg`)) {
                axios.get(artwork, {responseType: 'stream'}).then((response) => {
                    const writer = fs.createWriteStream(`./assets/artworks/1000-${id}.jpg`);
                    response.data.pipe(writer);
                    writer.on("finish", () => {
                        sharp(`./assets/artworks/1000-${id}.jpg`).resize(500, 500).jpeg({ quality: 100, chromaSubsampling: '4:4:4', progressive: true }).toFile(`./assets/artworks/0500-${id}.jpg`).catch((error) => {
                            LogService.logError("The size of one artwork could not be resized to 500x500. (" + id + ")");
                            console.log(error);
                        });
                        sharp(`./assets/artworks/1000-${id}.jpg`).resize(250, 250).jpeg({ quality: 100, chromaSubsampling: '4:4:4', progressive: true }).toFile(`./assets/artworks/0250-${id}.jpg`).catch((error) => {
                            LogService.logError("The size of one artwork could not be resized to 250x250. (" + id + ")");
                            console.log(error);
                        });
                        sharp(`./assets/artworks/1000-${id}.jpg`).resize(100, 100).jpeg({ quality: 100, chromaSubsampling: '4:4:4', progressive: true }).toFile(`./assets/artworks/0100-${id}.jpg`).catch((error) => {
                            LogService.logError("The size of one artwork could not be resized to 100x100. (" + id + ")");
                            console.log(error);
                        });
                    });
                    writer.on("error", () => {
                        LogService.logError("Artwork could not be saved. (" + id + ")");
                    });
                }).catch((error) => {
                    LogService.logError("Artwork could not be downloaded. (" + id + ")");
                    console.log(error);
                });
            }
            return {
                1000: `https://cdn.atomicradio.eu/artworks/1000-${id}.jpg`,
                500: `https://cdn.atomicradio.eu/artworks/0500-${id}.jpg`,
                250: `https://cdn.atomicradio.eu/artworks/0250-${id}.jpg`,
                100: `https://cdn.atomicradio.eu/artworks/0100-${id}.jpg`
            }
        } else {
            return getErrorArtworks();
        }
    }

}