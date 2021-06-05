import { ChannelModel, LiveModel } from "../models/channel.model";
import { SongModel } from "../models/song.model";
import { CacheService } from "./cache.service";
import { RadioBossService } from "../services/radioboss.service";
import { LogService } from "./log.service";
import { ArtworkService } from "./artwork.service";
import { AzuracastService } from "./azuracast.service";
import { MAirListService } from "./mairlist.service";
import { VotingService } from "./voting.service";
import { VotingModel } from "../models/voting.model";

export namespace ChannelService {

    export function getStationInfos(channelId: string) {
        return new Promise((resolve, reject) => {
            try {
                RadioBossService.getPlayBackInfo(channelId).then((playBackInfo) => {
                    getCurrentSong(channelId).then((currentSong) => {
                        if(playBackInfo.Info.CurrentTrack.TRACK.FILENAME.includes("brandings")) {
                            return;
                        }
                        getHistory(channelId).then((history) => {
                            getSchedule(channelId).then((schedule) => {
                                if(channelId === "one") {
                                    getLive().then((live) => {
                                        const channelInfo: ChannelModel = { name: "atr." + channelId, description: getDescription(channelId), listeners: Number(playBackInfo.Info.Streaming.listeners), live, song: currentSong, schedule, history, stream_urls: getStreamUrls(channelId) };
                                        if(live.is_live) {
                                            CacheService.set("channel-" + channelId, channelInfo, 10000);
                                        } else {
                                            if(channelInfo.song.title.length === 0) {
                                                CacheService.set("channel-" + channelId, channelInfo, 10000);
                                            } else {
                                                CacheService.set("channel-" + channelId, channelInfo, channelInfo.song.end_at.getTime()-new Date().getTime());
                                            }
                                        }
                                        resolve(channelInfo);
                                    });
                                } else {
                                    const channelInfo: ChannelModel = { name: "atr." + channelId, description: getDescription(channelId), listeners: Number(playBackInfo.Info.Streaming.listeners), song: currentSong, schedule, history, stream_urls: getStreamUrls(channelId) };
                                    if(channelInfo.song.title.length === 0) {
                                        channelInfo.song.title = "ATOMICRADIO";
                                        channelInfo.song.artist = "LISTEN TO THE DIFFERENCE!";
                                        channelInfo.song.artworks = ArtworkService.getErrorArtworks();
                                        CacheService.set("channel-" + channelId, channelInfo, 10000);
                                    } else {
                                        CacheService.set("channel-" + channelId, channelInfo, channelInfo.song.end_at.getTime()-new Date().getTime());
                                    }
                                    resolve(channelInfo);
                                }
                            });
                        });
                    });
                }).catch();
            } catch(err) {
                CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
                LogService.logError("Error while reading radioboss informations. channel service (" + channelId + ")");
            }
        });
    }

    export function getStations(): Promise<ChannelModel[]> {
        return new Promise((resolve, reject) => {
            const stations: ChannelModel[] = [];
            CacheService.keys().forEach((x) => {
                if(x.startsWith("channel-")) {
                    stations.push(CacheService.get(x));
                }
            });
            resolve(stations);
        });
    }

    export function isStation(channelId: string): boolean {
        const item = CacheService.keys().filter(x => x === "channel-" + channelId);
        if(item[0] === undefined) return false;
        return true;
    }

    export function getCurrentSong(channelId: string): Promise<SongModel> {
        return new Promise((resolve, reject) => {
            let song: SongModel;
            if(channelId === "one") {
                if(CacheService.get("channel-one")) {
                    const channel = CacheService.get("channel-one") as ChannelModel;
                    if(channel.live.is_live) {
                        song = MAirListService.getCurrentSong();
                        resolve(song);
                        return;
                    }
                }
            }
            RadioBossService.getPlayBackInfo(channelId).then((value) => {
                RadioBossService.getCurrentArtwork(channelId).then((imageResponse) => {
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

    export function getHistory(channelId: string): Promise<SongModel[]> {
        return new Promise((resolve, reject) => {
            let history: SongModel[] = [];
            if(channelId === "one") {
                if(CacheService.get("channel-one")) {
                    const channel = CacheService.get("channel-one") as ChannelModel;
                    if(channel.live.is_live) {
                        history = MAirListService.getHistory();
                        resolve(history);
                        return;
                    }
                }
            }
            RadioBossService.getLastPlayed(channelId).then((value) => {
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

    export function getSchedule(channelId: string): Promise<SongModel[]> {
        return new Promise((resolve, reject) => {
            let schedule: SongModel[] = [];
            if(channelId === "one") {
                if(CacheService.get("channel-one")) {
                    const channel = CacheService.get("channel-one") as ChannelModel;
                    if(channel.live.is_live) {
                        schedule = MAirListService.getSchedule();
                        resolve(schedule);
                        return;
                    }
                }
            }
            RadioBossService.getPlayBackInfo(channelId).then((playBack) => {
                RadioBossService.getPlaylist(channelId).then((value) => {
                    value.Playlist.TRACK.splice(0, Number(playBack.Info.Playback.playlistpos));
                    for(const queue of value.Playlist.TRACK) {
                        if(schedule.length < 5) {
                            if(channelId === "one") {
                                if(queue.FILENAME.includes("number1") || queue.FILENAME.includes("number2") || queue.FILENAME.includes("number3") ||
                                queue.FILENAME.includes("number4") || queue.FILENAME.includes("number5")) {
                                    const voting = VotingService.getCache().get("voting") as VotingModel;
                                    const item = voting.items[(Number(queue.FILENAME.split("number")[1].split(".")[0])-1)];
                                    const items = value.Playlist.TRACK.filter((x) => x.FILENAME === item.filePath);
                                    const start_at_voting = new Date(new Date().getFullYear() + "-" + (new Date().getMonth()+1) + "-" + new Date().getDate() + " " + queue.STARTTIME);
                                    const end_at_voting = new Date(start_at_voting.getTime() + RadioBossService.convertDurationToMs(items[0].DURATION));
                                    const song_voting: SongModel = { artist: items[0].CASTTITLE.split(" - ")[0], title: items[0].CASTTITLE.split(" - ")[1], playlist: getPlaylist(items[0].FILENAME) + " • VOTING", start_at: start_at_voting, end_at: end_at_voting, duration: (RadioBossService.convertDurationToMs(items[0].DURATION)/1000), artworks: ArtworkService.getErrorArtworks() };
                                    schedule.push(song_voting);
                                }
                            }

                            const start_at = new Date(new Date().getFullYear() + "-" + (new Date().getMonth()+1) + "-" + new Date().getDate() + " " + queue.STARTTIME);
                            const end_at = new Date(start_at.getTime() + RadioBossService.convertDurationToMs(queue.DURATION));
                            const song: SongModel = { artist: queue.CASTTITLE.split(" - ")[0], title: queue.CASTTITLE.split(" - ")[1], playlist: getPlaylist(queue.FILENAME), start_at, end_at, duration: (RadioBossService.convertDurationToMs(queue.DURATION)/1000), artworks: ArtworkService.getErrorArtworks() };
                            if(!(queue.FILENAME.includes("brandings") || queue.CASTTITLE.includes("playrequestedsong"))) {
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
            ultraquality: "https://listen.atomicradio.eu/" + channelId + "/ultraquality",
            highquality: "https://listen.atomicradio.eu/" + channelId + "/highquality",
            middlequality: "https://listen.atomicradio.eu/" + channelId + "/middlequality",
            lowquality: "https://listen.atomicradio.eu/" + channelId + "/lowquality"
        };
    }

    export function getPlaylist(path: string) {
        if(path === undefined || path.length === 0) return null;
        const split = path.split(":\\")[1];
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