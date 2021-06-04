import axios, { AxiosResponse } from "axios";
import parser from "xml2json";
import { LastPlayed, PlayBackInfo, Playlist } from "../models/radioboss.model";
import { LogService } from "./log.service";

export namespace RadioBossService {

    export function getPlayBackInfo(station: string): Promise<PlayBackInfo> {
        return new Promise((resolve, reject) => {
            axios.get(`http://${station}.music.ufo.atnw.eu:3000/?pass=bTGPvNUb4pLYtQxKYWtb&action=playbackinfo`).then((response) => {
                const data = parser.toJson(response.data);
                const playBackInfo = JSON.parse(data) as PlayBackInfo;
                resolve(playBackInfo);
            }).catch((err) => {
                LogService.logError("Error while reading radioboss playback informations. (" + station + ")");
                reject("Error while reading radioboss playback informations.");
            });
        });
    }

    export function getLastPlayed(station: string): Promise<LastPlayed> {
        return new Promise((resolve, reject) => {
            axios.get(`http://${station}.music.ufo.atnw.eu:3000/?pass=bTGPvNUb4pLYtQxKYWtb&action=getlastplayed`).then((response) => {
                const data = parser.toJson(response.data);
                const lastPlayed = JSON.parse(data) as LastPlayed;
                resolve(lastPlayed);
            }).catch((err) => {
                LogService.logError("Error while reading radioboss last played informations. (" + station + ")");
                reject("Error while reading radioboss last played informations.");
            });
        });
    }

    export function getPlaylist(station: string): Promise<Playlist> {
        return new Promise((resolve, reject) => {
            axios.get(`http://${station}.music.ufo.atnw.eu:3000/?pass=bTGPvNUb4pLYtQxKYWtb&action=getplaylist2`).then((response) => {
                const data = parser.toJson(response.data);
                const playlist = JSON.parse(data) as Playlist;
                resolve(playlist);
            }).catch((err) => {
                LogService.logError("Error while reading radioboss playlist informations. (" + station + ")");
                reject("Error while reading radioboss playlist informations.");
            });
        });
    }

    export function getCurrentArtwork(station: string): Promise<AxiosResponse<any>> {
        return new Promise((resolve, reject) => {
            axios.get(`http://${station}.music.ufo.atnw.eu:3000/?pass=bTGPvNUb4pLYtQxKYWtb&action=trackartwork`, { responseType: "stream" }).then((response) => {
                resolve(response);
            }).catch((err) => {
                LogService.logError("Error while reading radioboss current artwork informations. (" + station + ")");
                reject("Error while reading radioboss current artwork informations.");
            });
        });
    }

    export function requestSong(filename: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get("http://one.music.ufo.atnw.eu:3000/?pass=bTGPvNUb4pLYtQxKYWtb&action=songrequest&filename=" + encodeURIComponent(filename) + "&message=" + encodeURIComponent("REQUESTED SONG BY API")).then((response) => {
                resolve(response);
            }).catch((err) => {
                LogService.logError("Error while sending the song suggestion.");
                reject("Error while sending the song suggestion.");
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