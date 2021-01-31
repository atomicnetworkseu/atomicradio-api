'use strict';
import fs from "fs";
import axios from "axios";
import sharp from "sharp";

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
                        sharp(`./assets/artworks/1000-${id}.jpg`).resize(500, 500).toFile(`./assets/artworks/0500-${id}.jpg`).catch((error) => {
                            console.log("ERROR 500x500 Artworks");
                        });
                        sharp(`./assets/artworks/1000-${id}.jpg`).resize(250, 250).toFile(`./assets/artworks/0250-${id}.jpg`).catch((error) => {
                            console.log("ERROR 500x500 Artworks");
                        });
                        sharp(`./assets/artworks/1000-${id}.jpg`).resize(100, 100).toFile(`./assets/artworks/0100-${id}.jpg`).catch((error) => {
                            console.log("ERROR 500x500 Artworks");
                        });
                    });
                    writer.on("error", () => {

                    });
                }).catch((error) => {
                    console.log("ERROR WHILE DOWNLADING ARTWORK");
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