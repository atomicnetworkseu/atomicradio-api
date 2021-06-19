import axios from "axios";
import * as fs from "fs";
import { Track } from "../models/radioboss.model";
import { ChannelService } from "./channel.service";

export namespace PreviewService {

    export function downloadPreview(track: Track): Promise<string> {
        return new Promise((resolve, reject) => {
            axios.get("https://api.deezer.com/search?q=" + encodeURIComponent(track.CASTTITLE.split(" - ")[0].toLowerCase().split("feat.")[0].replace(/&/g, ",") + " - " + track.CASTTITLE.split(" - ")[1].toLowerCase().replace(/&/g, ","))).then((value) => {
                ChannelService.getSongId(track.FILENAME).then((songId) => {
                    if(value.data.data[0] === undefined) {
                        resolve(null);
                        return;
                    }
                    if(!fs.existsSync(`./assets/previews/${songId.id}.mp3`)) {
                        axios.get(value.data.data[0].preview, { responseType: "stream" }).then((response) => {
                            const writer = fs.createWriteStream("./assets/previews/" + songId.id + ".mp3");
                            response.data.pipe(writer);
                            writer.on("finish", () => {
                                resolve("https://cdn.atomicradio.eu/previews/" + songId.id + ".mp3");
                            });
                            writer.on("error", () => {
                                resolve(null);
                            });
                        });
                    }
                });
            });
        });
    }

    export function getPreview(track: Track): Promise<string> {
        return new Promise((resolve, reject) => {
            ChannelService.getSongId(track.FILENAME).then((songId) => {
                if(fs.existsSync(`./assets/previews/${songId.id}.mp3`)) {
                    resolve("https://cdn.atomicradio.eu/previews/" + songId.id + ".mp3");
                } else {
                    downloadPreview(track).then((preview) => {
                        resolve(preview);
                    }).catch(() => resolve(null));
                }
            });
        });
    }

}