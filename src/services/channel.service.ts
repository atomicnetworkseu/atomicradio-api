import { ChannelModel } from "../models/channel.model";
import { SongModel } from "../models/song.model";
import { CacheService } from "./cache.service";
import { RadioBossService } from "../services/radioboss.service";
import { LogService } from "./log.service";

export namespace ChannelService {

    export function getStationInfos(channelId: string) {
        return new Promise((resolve, reject) => {
            RadioBossService.getPlayBackInfo().then((playBackInfo) => {
                getCurrentSong().then((currentSong) => {
                    getHistory().then((history) => {
                        getSchedule().then((schedule) => {
                            const channelInfo: ChannelModel = { name: channelId, description: getDescription(channelId), listeners: Number(playBackInfo.Info.Streaming.listeners), live: null, song: currentSong, schedule, history, stream_urls: getStreamUrls(channelId) };
                            console.log(channelInfo.song.end_at.getTime()-new Date().getTime());
                            CacheService.set("channel-" + channelId, channelInfo, channelInfo.song.end_at.getTime()-new Date().getTime());
                            resolve(channelInfo);
                        }).catch(() => {
                            CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
                            LogService.logError("Error while reading schedule informations. (" + channelId + ")");
                        });
                    }).catch(() => {
                        CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
                        LogService.logError("Error while reading history informations. (" + channelId + ")");
                    });
                }).catch(() => {
                    CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
                    LogService.logError("Error while reading song informations. (" + channelId + ")");
                });
            }).catch(() => {
                CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
                LogService.logError("Error while reading radioboss informations. (" + channelId + ")");
            });
        });
    }

    export function getCurrentSong(): Promise<SongModel> {
        return new Promise((resolve, reject) => {
            RadioBossService.getPlayBackInfo().then((value) => {
                const start_at = new Date(value.Info.CurrentTrack.TRACK.LASTPLAYED);
                const end_at = new Date(new Date(value.Info.CurrentTrack.TRACK.LASTPLAYED).getTime()+RadioBossService.convertDurationToMs(value.Info.CurrentTrack.TRACK.DURATION));
                const song: SongModel = { artist: value.Info.CurrentTrack.TRACK.ARTIST, title: value.Info.CurrentTrack.TRACK.TITLE, playlist: null, start_at, end_at, duration: (RadioBossService.convertDurationToMs(value.Info.CurrentTrack.TRACK.DURATION)/1000), artworks: null };
                resolve(song);
            });
        });
    }

    export function getHistory(): Promise<SongModel[]> {
        return new Promise((resolve, reject) => {
            RadioBossService.getLastPlayed().then((value) => {
                const history: SongModel[] = [];
                value.LastPlayed.TRACK.shift();
                for(const last of value.LastPlayed.TRACK) {
                    if(history.length < 10) {
                        const start_at = new Date(last.LASTPLAYED);
                        const end_at = new Date(new Date(last.LASTPLAYED).getTime()+RadioBossService.convertDurationToMs(last.DURATION));
                        const song: SongModel = { artist: last.ARTIST, title: last.TITLE, playlist: null, start_at, end_at, duration: (RadioBossService.convertDurationToMs(last.DURATION)/1000), artworks: null };
                        history.push(song);
                    }
                }
                resolve(history);
            }).catch((err) => {
                const history: SongModel[] = [];
                resolve(history);
            });
        });
    }

    export function getSchedule(): Promise<SongModel[]> {
        return new Promise((resolve, reject) => {
            RadioBossService.getPlayBackInfo().then((playBack) => {
                RadioBossService.getPlaylist(Number(playBack.Info.Playback.playlistpos)).then((value) => {
                    const schedule: SongModel[] = [];
                    value.Playlist.TRACK.shift();
                    for(const queue of value.Playlist.TRACK) {
                        if(schedule.length < 5) {
                            const start_at = new Date(queue.LASTPLAYED);
                            const end_at = new Date(new Date(queue.LASTPLAYED).getTime()+RadioBossService.convertDurationToMs(queue.DURATION));
                            const song: SongModel = { artist: queue.ARTIST, title: queue.TITLE, playlist: null, start_at, end_at, duration: (RadioBossService.convertDurationToMs(queue.DURATION)/1000), artworks: null };
                            schedule.push(song);
                        }
                    }
                    resolve(schedule);
                }).catch((err) => {
                    const schedule: SongModel[] = [];
                    resolve(schedule);
                });
            });
        });
    }

    export function getDescription(channelId: string) {
        switch (channelId) {
          case "atr.one":
            return {
              de: "Entdecke das beste aus der Musikwelt und sei live dabei wenn sich Newcomer mit Chartlegenden batteln!",
              en: "Discover the best of the music world and be there live when newcomers battle each other with chart legends!"
            };
          case "atr.dance":
            return {
              de: "Immer auf dem aktuellstem Stand über die besten Electrosongs, Mashups und Clubsounds.",
              en: "Always up to date about the best electro songs, mashups and club sounds."
            };
          case "atr.trap":
            return {
              de: "Fühle unsere, auf dich zugeschnittene Musik aus der Trap und Rapwelt zu jeder Uhrzeit, den ganzen Tag.",
              en: "Feel our customized music from the trap and rap world at any time, all day."
            };
        }
    }

    export function getStreamUrls(channelId: string) {
        const id = channelId.split(".")[1];
        return {
            highquality: "https://listen.atomicradio.eu/" + id + "/highquality",
            middlequality: "https://listen.atomicradio.eu/" + id + "/middlequality",
            lowquality: "https://listen.atomicradio.eu/" + id + "/lowquality"
        };
    }
}