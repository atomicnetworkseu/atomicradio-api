'use strict';
import axios from "axios";
import { ArtworkService } from "./artwork.service";
import { CacheService } from "./cache.service";

export namespace AzuracastService {

    export function getStationInfos(channelId: string) {
        const stationUrl = "http://" + process.env.AZURACAST_API + "/api/nowplaying/atr." + channelId;
        return new Promise((resolve, rejext) => {
            const header = { 'X-API-Key': process.env.AZURACAST_TOKEN };
            axios.get(stationUrl, {headers: header}).then(async (response) => {
                if(CacheService.get("channel-" + channelId) !== undefined) {
                    const oldChannelInfo = CacheService.get("channel-" + channelId);
                    if(oldChannelInfo.title !== response.data.now_playing.song.title) {
                        addHistory(response.data);
                    }
                }
                CacheService.set("channel-" + channelId, {
                    name: response.data.station.name,
                    listeners: response.data.listeners.current,
                    song: getCurrentSong(response.data),
                    schedule: await getSchedule(response.data),
                    history: getHistory(response.data).slice(0).reverse(),
                    stream_urls: {
                        highquality: "https://listen.atomicradio.eu/" + channelId + "/highquality.mp3",
                        middlequality: "https://listen.atomicradio.eu/" + channelId + "/middlequality.mp3",
                        lowquality: "https://listen.atomicradio.eu/" + channelId + "/lowquality.mp3" }
                    }, (response.data.now_playing.remaining*1000));
                resolve(response.data);
            }).catch((error) => {
                if(error !== undefined) {
                    console.log({code: 500, message: "Error while reading station informations."});
                    console.log(error);
                    resolve({code: 500, message: "Error while reading station informations."});
                }
            });
        });
    }

    export function getStationQueue(channelId: string): Promise<any[]> {
        const stationUrl = "http://" + process.env.AZURACAST_API + "/api/station/" + channelId + "/queue";
        return new Promise((resolve, reject) => {
            const header = { 'X-API-Key': process.env.AZURACAST_TOKEN };
            axios.get(stationUrl, {headers: header}).then((response) => {
                resolve(response.data);
            }).catch((error) => {
                if(error !== undefined) {
                    console.log({code: 500, message: "Error while reading station informations."}, error);
                    console.log(error);
                    resolve([]);
                }
            });
        });
    }

    export function getCurrentSong(station: any): any {
        let song = {};
        if(station.live.is_live) {
            if(String(station.now_playing.song.title).includes('-')) {
                song = { artist: String(station.now_playing.song.title).split('-')[0], title: String(station.now_playing.song.title).split('-')[1], playlist: station.now_playing.playlist, start_at: Number(station.now_playing.played_at), end_at: Number(station.now_playing.played_at) + Number(station.now_playing.duration), duration: Number(station.now_playing.duration), artworks: ArtworkService.getArtworks(station.now_playing.song.id, station.now_playing.song.art) };
            } else {
                song = { artist: station.now_playing.song.artist, title: station.now_playing.song.title, playlist: station.now_playing.playlist, start_at: Number(station.now_playing.played_at), end_at: Number(station.now_playing.played_at) + Number(station.now_playing.duration), duration: Number(station.now_playing.duration), artworks: ArtworkService.getArtworks(station.now_playing.song.id, station.now_playing.song.art) };
            }
        } else {
            song = { artist: station.now_playing.song.artist, title: station.now_playing.song.title, playlist: station.now_playing.playlist, start_at: Number(station.now_playing.played_at), end_at: Number(station.now_playing.played_at) + Number(station.now_playing.duration), duration: Number(station.now_playing.duration), artworks: ArtworkService.getArtworks(station.now_playing.song.id, station.now_playing.song.art) };
        }
        return song;
    }

    export function getSchedule(station: any) {
        return new Promise(async (resolve, reject) => {
            const stationQueue = await getStationQueue(station.station.name);
            const schedule: { artist: any; title: any; playlist: any; start_at: number; end_at: number; duration: number; artworks: any; }[] = [];
            for(const queue of stationQueue) {
                if (!String(queue.song.artist).includes('jingles')) {
                    if (Number(schedule.length) < 5) {
                        if(new Date().getTime() < (queue.cued_at*1000)) {
                            const songInfo = { artist: queue.song.artist, title: queue.song.title, playlist: queue.playlist, start_at: Number(queue.cued_at), end_at: Number(queue.cued_at) + Number(queue.duration), duration: Number(queue.duration), artworks: ArtworkService.getArtworks(queue.song.id, queue.song.art) };
                            schedule.push(songInfo);
                        }
                    }
                }
            }
            resolve(schedule);
        });
    }

    export function addHistory(station: any) {
        const channel = CacheService.get("channel-" + String(station.station.name).split(".")[1]);
        const history: { artist: any; title: any; playlist: any; start_at: number; end_at: number; duration: number; artworks: any; }[] = channel.history;
        if(channel.song.title !== station.now_playing.song.title) {
            if(history.length === 10) {
                history.shift();
            }
            history.push(channel.song);
        }
        channel.history = history;
        CacheService.set("channel-" + String(station.station.name).split(".")[1], channel, 2000);
    }

    export function getHistory(station: any) {
        if(CacheService.get("channel-" + String(station.station.name).split(".")[1]) !== undefined) {
            return CacheService.get("channel-" + String(station.station.name).split(".")[1]).history;
        } else {
            return [];
        }
    }

}