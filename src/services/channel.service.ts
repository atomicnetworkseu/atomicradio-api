import { ChannelModel, LiveModel } from "../models/channel.model";
import { SongModel } from "../models/song.model";
import { CacheService } from "./cache.service";
import { RadioBossService } from "../services/radioboss.service";
import { LogService } from "./log.service";
import { ArtworkService } from "./artwork.service";
import { AzuracastService } from "./azuracast.service";
import { MAirListService } from "./mairlist.service";

export namespace ChannelService {

    export function getStationInfos(channelId: string) {
        return new Promise((resolve, reject) => {
            try {
                RadioBossService.getPlayBackInfo().then((playBackInfo) => {
                    getCurrentSong().then((currentSong) => {
                        if(playBackInfo.Info.CurrentTrack.TRACK.FILENAME.includes("brandings")) {
                            return;
                        }
                        getHistory().then((history) => {
                            getSchedule().then((schedule) => {
                                if(channelId === "one") {
                                    getLive().then((live) => {
                                        const channelInfo: ChannelModel = { name: "atr." + channelId, description: getDescription(channelId), listeners: Number(playBackInfo.Info.Streaming.listeners), live, song: currentSong, schedule, history, stream_urls: getStreamUrls(channelId) };
                                        if(live.is_live) {
                                            CacheService.set("channel-" + channelId, channelInfo, 10000);
                                        } else {
                                            CacheService.set("channel-" + channelId, channelInfo, channelInfo.song.end_at.getTime()-new Date().getTime());
                                        }
                                        resolve(channelInfo);
                                    });
                                } else {
                                    const channelInfo: ChannelModel = { name: channelId, description: getDescription(channelId), listeners: Number(playBackInfo.Info.Streaming.listeners), song: currentSong, schedule, history, stream_urls: getStreamUrls(channelId) };
                                    CacheService.set("channel-" + channelId, channelInfo, channelInfo.song.end_at.getTime()-new Date().getTime());
                                    resolve(channelInfo);
                                }
                            });
                        });
                    });
                });
            } catch(err) {
                CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
                LogService.logError("Error while reading radioboss informations. (" + channelId + ")");
            }
        });
    }

    export function getCurrentSong(): Promise<SongModel> {
        return new Promise((resolve, reject) => {
            let song: SongModel;
            if(CacheService.get("channel-one")) {
                const channel = CacheService.get("channel-one") as ChannelModel;
                if(channel.live.is_live) { // channel.live.is_live && channel === "one"
                    song = MAirListService.getCurrentSong();
                    resolve(song);
                    return;
                }
            }
            RadioBossService.getPlayBackInfo().then((value) => {
                RadioBossService.getCurrentArtwork().then((imageResponse) => {
                    ArtworkService.saveArtworks(value.Info.CurrentTrack.TRACK, imageResponse).then((artworks) => {
                        const start_at = new Date(value.Info.CurrentTrack.TRACK.LASTPLAYED);
                        const end_at = new Date(new Date(value.Info.CurrentTrack.TRACK.LASTPLAYED).getTime()+RadioBossService.convertDurationToMs(value.Info.CurrentTrack.TRACK.DURATION));
                        song = { artist: value.Info.CurrentTrack.TRACK.ARTIST, title: value.Info.CurrentTrack.TRACK.TITLE, playlist: getPlaylist(value.Info.CurrentTrack.TRACK.FILENAME), start_at, end_at, duration: (RadioBossService.convertDurationToMs(value.Info.CurrentTrack.TRACK.DURATION)/1000), artworks };
                        resolve(song);
                    });
                });
            });
        });
    }

    export function getHistory(): Promise<SongModel[]> {
        return new Promise((resolve, reject) => {
            let history: SongModel[] = [];
            if(CacheService.get("channel-one")) {
                const channel = CacheService.get("channel-one") as ChannelModel;
                if(channel.live.is_live) { // channel.live.is_live && channel === "one"
                    history = MAirListService.getHistory();
                    resolve(history);
                    return;
                }
            }
            RadioBossService.getLastPlayed().then((value) => {
                value.LastPlayed.TRACK.shift();
                value.LastPlayed.TRACK.forEach((last) => {
                    ArtworkService.getArtworks(last.FILENAME).then((artworks) => {
                        if(history.length < 10) {
                            const start_at = new Date(last.STARTTIME);
                            const end_at = new Date(new Date(last.STARTTIME).getTime()+RadioBossService.convertDurationToMs(last.DURATION));
                            const song: SongModel = { artist: last.ARTIST, title: last.TITLE, playlist: getPlaylist(last.FILENAME), start_at, end_at, duration: (RadioBossService.convertDurationToMs(last.DURATION)/1000), artworks };
                            if(!last.FILENAME.includes("brandings")) {
                                history.push(song);
                            }
                        }
                    });
                });
                resolve(history);
            }).catch((err) => {
                resolve(history);
            });
        });
    }

    export function getSchedule(): Promise<SongModel[]> {
        return new Promise((resolve, reject) => {
            let schedule: SongModel[] = [];
            if(CacheService.get("channel-one")) {
                const channel = CacheService.get("channel-one") as ChannelModel;
                if(channel.live.is_live) { // channel.live.is_live && channel === "one"
                    schedule = MAirListService.getSchedule();
                    resolve(schedule);
                    return;
                }
            }
            RadioBossService.getPlayBackInfo().then((playBack) => {
                RadioBossService.getPlaylist().then((value) => {
                    value.Playlist.TRACK.splice(0, Number(playBack.Info.Playback.playlistpos));
                    for(const queue of value.Playlist.TRACK) {
                        if(schedule.length < 5) {
                            const start_at = new Date(new Date().getFullYear() + "-" + (new Date().getMonth()+1) + "-" + new Date().getDate() + " " + queue.STARTTIME);
                            const end_at = new Date(start_at.getTime() + RadioBossService.convertDurationToMs(queue.DURATION));
                            const song: SongModel = { artist: queue.CASTTITLE.split(" - ")[0], title: queue.CASTTITLE.split(" - ")[1], playlist: getPlaylist(queue.FILENAME), start_at, end_at, duration: (RadioBossService.convertDurationToMs(queue.DURATION)/1000), artworks: ArtworkService.getErrorArtworks() };
                            if(!queue.FILENAME.includes("brandings")) {
                                schedule.push(song);
                            }
                        }
                    }
                    resolve(schedule);
                }).catch((err) => {
                    resolve(schedule);
                });
            });
        });
    }

    export function getDescription(channelId: string) {
        switch (channelId) {
          case "one":
            return {
              de: "Entdecke das beste aus der Musikwelt und sei live dabei wenn sich Newcomer mit Chartlegenden batteln!",
              en: "Discover the best of the music world and be there live when newcomers battle each other with chart legends!"
            };
          case "dance":
            return {
              de: "Immer auf dem aktuellstem Stand über die besten Electrosongs, Mashups und Clubsounds.",
              en: "Always up to date about the best electro songs, mashups and club sounds."
            };
          case "trap":
            return {
              de: "Fühle unsere, auf dich zugeschnittene Musik aus der Trap und Rapwelt zu jeder Uhrzeit, den ganzen Tag.",
              en: "Feel our customized music from the trap and rap world at any time, all day."
            };
          default:
            return {
              de: "Entdecke das beste aus der Musikwelt und sei live dabei wenn sich Newcomer mit Chartlegenden batteln!",
              en: "Discover the best of the music world and be there live when newcomers battle each other with chart legends!"
            };
        }
    }

    export function getStreamUrls(channelId: string) {
        return {
            highquality: "https://listen.atomicradio.eu/" + channelId + "/highquality",
            middlequality: "https://listen.atomicradio.eu/" + channelId + "/middlequality",
            lowquality: "https://listen.atomicradio.eu/" + channelId + "/lowquality"
        };
    }

    export function getPlaylist(path: string) {
        if(path === undefined || path.length === 0) return null;
        const split = path.split("azuracast\\")[1];
        if(split === undefined) return null;
        return "#" + split.split("\\")[0].toUpperCase();
    }

    export function getLive(): Promise<LiveModel> {
        return new Promise((resolve, reject) => {
            AzuracastService.getLive().then((liveData) => {
                let live: LiveModel;
                if(liveData.broadcast_start === null) {
                    live = { is_live: liveData.is_live, streamer: null, start_at: null }
                } else {
                    live = { is_live: liveData.is_live, streamer: liveData.streamer_name, start_at: new Date(Number(liveData.broadcast_start)*1000) };
                }
                resolve(live);
            });
        });
    }
}