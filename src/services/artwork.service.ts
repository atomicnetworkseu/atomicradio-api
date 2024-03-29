import fs from "fs";
import axios from "axios";
import sharp from "sharp";
import { LogService } from "./log.service";
import { ArtworksModel } from "../models/song.model";

export namespace ArtworkService {
  export function getErrorArtworks(): ArtworksModel {
    return {
      1000: "https://cdn.atomicradio.eu/artworks/fallback/1000.jpg",
      500: "https://cdn.atomicradio.eu/artworks/fallback/0500.jpg",
      250: "https://cdn.atomicradio.eu/artworks/fallback/0250.jpg",
      100: "https://cdn.atomicradio.eu/artworks/fallback/0100.jpg"
    };
  }

  export function getStreamerArtworks(streamerName: string): ArtworksModel {
    const name = String(streamerName).toLowerCase().replace(/ /g, "");
    return {
      1000: `https://cdn.atomicradio.eu/streamer/${name}/1000.jpg`,
      500: `https://cdn.atomicradio.eu/streamer/${name}/0500.jpg`,
      250: `https://cdn.atomicradio.eu/streamer/${name}/0250.jpg`,
      100: `https://cdn.atomicradio.eu/streamer/${name}/0100.jpg`
    };
  }

  export function getArtworks(id: string, artwork: string): ArtworksModel {
    if (artwork !== "https://cdn.atomicradio.eu/artworks/fallback/1000.jpg") {
      if (!fs.existsSync(`./assets/artworks/${id}/1000.jpg`)) {
        try {
          fs.mkdirSync(`./assets/artworks/${id}`);
        } catch(err) {
          LogService.logError(`Directory already exists. The artworks will be downloaded again. (${id})`);
        }

        axios
          .get(artwork, { responseType: "stream" })
          .then((response) => {
            const writer = fs.createWriteStream(`./assets/artworks/${id}/1000.jpg`);
            response.data.pipe(writer);

            writer.on("finish", () => {
              sharp(`./assets/artworks/${id}/1000.jpg`)
                .resize(500, 500)
                .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                .toFile(`./assets/artworks/${id}/0500.jpg`)
                .catch((error) => {
                  LogService.logError("The size of one artwork could not be resized to 500x500. (" + id + ")");
                });
              sharp(`./assets/artworks/${id}/1000.jpg`)
                .resize(250, 250)
                .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                .toFile(`./assets/artworks/${id}/0250.jpg`)
                .catch((error) => {
                  LogService.logError("The size of one artwork could not be resized to 250x250. (" + id + ")");
                });
              sharp(`./assets/artworks/${id}/1000.jpg`)
                .resize(100, 100)
                .jpeg({ quality: 100, chromaSubsampling: "4:4:4", progressive: true })
                .toFile(`./assets/artworks/${id}/0100.jpg`)
                .catch((error) => {
                  LogService.logError("The size of one artwork could not be resized to 100x100. (" + id + ")");
                });
            });
            writer.on("error", () => {
              LogService.logError("Artwork could not be saved. (" + id + ")");
            });
          })
          .catch((error) => {
            LogService.logError("Artwork could not be downloaded. (" + id + ")");
          });
      }

      return {
        1000: `https://cdn.atomicradio.eu/artworks/${id}/1000.jpg`,
        500: `https://cdn.atomicradio.eu/artworks/${id}/0500.jpg`,
        250: `https://cdn.atomicradio.eu/artworks/${id}/0250.jpg`,
        100: `https://cdn.atomicradio.eu/artworks/${id}/0100.jpg`
      };
    } else {
      return getErrorArtworks();
    }
  }
}
