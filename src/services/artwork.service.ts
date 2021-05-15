import ArtworkModel, { Artwork, ArtworksModel } from "../models/artwork.model";
import { Track } from "../models/radioboss.model";
import FlakeId from "flakeid";
import * as fs from "fs";
import sharp from "sharp";
import { LogService } from "./log.service";
import { AxiosResponse } from "axios";

const flake = new FlakeId();

export namespace ArtworkService {

    export function saveArtworks(track: Track, response: AxiosResponse<any>): Promise<ArtworksModel> {
        return new Promise((resolve, reject) => {
            ArtworkModel.findOne({ path: track.FILENAME }).exec().then((value) => {
                if (value) {
                    resolve(value.artworks);
                    return;
                }
                const artId = flake.gen();

                if (!fs.existsSync(`./assets/artworks/${artId}`)) {
                    fs.mkdirSync(`./assets/artworks/${artId}`);
                    const writer = fs.createWriteStream(`./assets/artworks/${artId}/1000.jpg`);
                    response.data.pipe(writer);

                    writer.on("finish", () => {
                        sharp(`./assets/artworks/${artId}/1000.jpg`)
                            .resize(500, 500)
                            .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                            .toFile(`./assets/artworks/${artId}/0500.jpg`)
                            .catch((error) => {
                                LogService.logError("Artwork could not be resized to 500. (" + artId + ")");
                                resolve(getErrorArtworks());
                            });
                        sharp(`./assets/artworks/${artId}/1000.jpg`)
                            .resize(250, 250)
                            .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                            .toFile(`./assets/artworks/${artId}/0250.jpg`)
                            .catch((error) => {
                                LogService.logError("Artwork could not be resized to 250. (" + artId + ")");
                                resolve(getErrorArtworks());
                            });
                        sharp(`./assets/artworks/${artId}/1000.jpg`)
                            .resize(100, 100)
                            .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                            .toFile(`./assets/artworks/${artId}/0100.jpg`)
                            .catch((error) => {
                                LogService.logError("Artwork could not be resized to 100. (" + artId + ")");
                                resolve(getErrorArtworks());
                            });
                        const artworks: ArtworksModel = {
                            1000: `https://cdn.atomicradio.eu/artworks/${artId}/1000.jpg`,
                            500: `https://cdn.atomicradio.eu/artworks/${artId}/0500.jpg`,
                            250: `https://cdn.atomicradio.eu/artworks/${artId}/0250.jpg`,
                            100: `https://cdn.atomicradio.eu/artworks/${artId}/0100.jpg`
                        }
                        const artwork: Artwork = new ArtworkModel({ id: artId, path: track.FILENAME, artworks });
                        artwork.save().then((savedArtworks) => {
                            resolve(artworks);
                        });
                    });

                    writer.on("error", () => {
                        LogService.logError("Artwork could not be saved. (" + artId + ")");
                        resolve(getErrorArtworks());
                    });
                }
            });
        });
    }

    export function getArtworks(path: string): Promise<ArtworksModel> {
        return new Promise((resolve, reject) => {
            ArtworkModel.findOne({ path }).exec().then((value) => {
                if(!value) {
                    resolve(getErrorArtworks());
                    return;
                }
                resolve(value.artworks)
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