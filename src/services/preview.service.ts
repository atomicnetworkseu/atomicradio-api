import axios from "axios";
import * as fs from "fs";
import PreviewModel, { Preview } from "../models/preview.model";
import { Track } from "../models/radioboss.model";
import FlakeId from "flakeid";

const flake = new FlakeId();

export namespace PreviewService {

    export function downloadPreview(track: Track): Promise<Preview> {
        return new Promise((resolve, reject) => {
            axios.get("https://api.deezer.com/search?q=" + encodeURIComponent(track.CASTTITLE.split(" - ")[0].toLowerCase().split("feat.")[0].replace(/&/g, ",") + " - " + track.CASTTITLE.split(" - ")[1].toLowerCase().replace(/&/g, ","))).then((value) => {
                if(value.data.data[0] === undefined) {
                    resolve(null);
                    return;
                }
                axios.get(value.data.data[0].preview, { responseType: "stream" }).then((response) => {
                    const id = flake.gen();
                    const writer = fs.createWriteStream("./assets/previews/" + id + ".mp3");
                    response.data.pipe(writer);
                    writer.on("finish", () => {
                        const preview: Preview = new PreviewModel({ id, path: track.FILENAME });
                        preview.save().then((previewData) => {
                            resolve(previewData);
                        });
                    });
                    writer.on("error", () => {
                        resolve(null);
                    });
                });
            });
        });
    }

    export function getPreview(track: Track): Promise<string> {
        return new Promise((resolve, reject) => {
            PreviewModel.findOne({ path: track.FILENAME }).exec().then((value) => {
                if(value) {
                    resolve("https://cdn.atomicradio.eu/previews/" + value.id + ".mp3");
                    return;
                }
                downloadPreview(track).then((preview) => {
                    resolve("https://cdn.atomicradio.eu/previews/" + preview.id + ".mp3");
                }).catch(() => resolve(null));
            });
        });
    }

}