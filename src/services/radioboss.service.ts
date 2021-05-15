import axios from "axios";
import parser from "xml2json";
import { LastPlayed, PlayBackInfo, Playlist } from "../models/radioboss.model";

export namespace RadioBossService {

    export function getPlayBackInfo(): Promise<PlayBackInfo> {
        return new Promise((resolve, reject) => {
            axios.get("http://127.0.0.1:9000/?pass=RoaWrgCUhX&action=playbackinfo").then((response) => {
                const data = parser.toJson(response.data);
                const playBackInfo = JSON.parse(data) as PlayBackInfo;
                resolve(playBackInfo);
            });
        });
    }

    export function getLastPlayed(): Promise<LastPlayed> {
        return new Promise((resolve, reject) => {
            axios.get("http://127.0.0.1:9000/?pass=RoaWrgCUhX&action=getlastplayed").then((response) => {
                const data = parser.toJson(response.data);
                const lastPlayed = JSON.parse(data) as LastPlayed;
                resolve(lastPlayed);
            });
        });
    }

    export function getPlaylist(offset: number): Promise<Playlist> {
        return new Promise((resolve, reject) => {
            axios.get(`http://127.0.0.1:9000/?pass=RoaWrgCUhX&action=getplaylist&from=${offset}`).then((response) => {
                const data = parser.toJson(response.data);
                const playlist = JSON.parse(data) as Playlist;
                resolve(playlist);
            });
        });
    }

    export function convertDurationToMs(duration: string): number {
        let minutes = duration.split(":")[0];
        let seconds = duration.split(":")[1];
        if(minutes.startsWith("0")) minutes = minutes.substring(1);
        if(minutes.startsWith("0")) seconds = seconds.substring(1);
        return ((60000*Number(minutes))+(1000*Number(seconds)));
    }

}