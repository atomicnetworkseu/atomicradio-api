import axios from "axios";
import { ChannelModel } from "../models/channel.model";
import { SongModel } from "../models/song.model";
import { ArtworkService } from "./artwork.service";
import { CacheService } from "./cache.service";
import { LogService } from "./log.service";
import { MAirListService } from "./mairlist.service";
import { SocketService } from "./socket.service";

export namespace AzuracastService {
  export function getStationInfos(channelId: string): Promise<ChannelModel> {
    const stationUrl = "http://" + process.env.AZURACAST_API + "/api/nowplaying/atr." + channelId;
    return new Promise((resolve, reject) => {
      const header = { "X-API-Key": process.env.AZURACAST_TOKEN };
      axios
        .get(stationUrl, { headers: header })
        .then(async (response) => {

          getSchedule(response.data).then((schedule) => {
            getHistory(response.data).then((history) => {

              let channelInfo: ChannelModel;
              if (channelId === "one") {
                channelInfo = {
                  name: response.data.station.name,
                  description: getStationDescription(response.data.station.name),
                  listeners: response.data.listeners.current,
                  live: { is_live: response.data.live.is_live, streamer: response.data.live.streamer_name },
                  song: getCurrentSong(response.data),
                  schedule,
                  history,
                  stream_urls: {
                    highquality: "https://listen.atomicradio.eu/" + channelId + "/highquality",
                    middlequality: "https://listen.atomicradio.eu/" + channelId + "/middlequality",
                    lowquality: "https://listen.atomicradio.eu/" + channelId + "/lowquality"
                  }
                };
              } else {
                channelInfo = {
                  name: response.data.station.name,
                  description: getStationDescription(response.data.station.name),
                  listeners: response.data.listeners.current,
                  song: getCurrentSong(response.data),
                  schedule,
                  history,
                  stream_urls: {
                    highquality: "https://listen.atomicradio.eu/" + channelId + "/highquality",
                    middlequality: "https://listen.atomicradio.eu/" + channelId + "/middlequality",
                    lowquality: "https://listen.atomicradio.eu/" + channelId + "/lowquality"
                  }
                };
              }
              if (response.data.live.is_live && channelInfo.name === "atr.one") {
                CacheService.set("channel-" + channelId, channelInfo, 1000);
                SocketService.emitUpdate(channelId, channelInfo);
              } else {
                CacheService.set("channel-" + channelId, channelInfo, response.data.now_playing.remaining * 1000);
                SocketService.emitUpdate(channelId, channelInfo);
              }
              resolve(channelInfo);

            }).catch(() => {
              CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
              LogService.logError("Error while reading history informations. (" + channelId + ")");
            });
          }).catch(() => {
            CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
            LogService.logError("Error while reading schedule informations. (" + channelId + ")");
          });

        })
        .catch(() => {
          CacheService.set("channel-" + channelId, { code: 500, message: "A problem with our API has occurred. Try again later." }, 10000);
          LogService.logError("Error while reading station informations. (" + channelId + ")");
        });
    });
  }

  export function getStationDescription(channelId: string) {
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

  export function getStationQueue(channelId: string): Promise<any[]> {
    const stationUrl = "http://" + process.env.AZURACAST_API + "/api/station/" + channelId + "/queue";
    return new Promise((resolve, reject) => {
      const header = { "X-API-Key": process.env.AZURACAST_TOKEN };
      axios
        .get(stationUrl, { headers: header })
        .then((response) => {
          resolve(response.data);
        });
    });
  }

  export function getStationHistory(channelId: string): Promise<any> {
    const stationUrl = "http://" + process.env.AZURACAST_API + "/api/nowplaying/" + channelId;
    return new Promise((resolve, reject) => {
      const header = { "X-API-Key": process.env.AZURACAST_TOKEN };
      axios
        .get(stationUrl, { headers: header })
        .then((response) => {
          resolve(response.data);
        });
    });
  }

  export function getCurrentSong(station: any): SongModel {
    let song: SongModel;
    if (station.live.is_live && station.station.name === "atr.one") {
      song = MAirListService.getCurrentSong();
    } else {
      song = {
        artist: station.now_playing.song.artist,
        title: station.now_playing.song.title,
        playlist: station.now_playing.playlist,
        start_at: Number(station.now_playing.played_at),
        end_at: Number(station.now_playing.played_at) + Number(station.now_playing.duration),
        duration: Number(station.now_playing.duration),
        artworks: ArtworkService.getArtworks(station.now_playing.song.id, station.now_playing.song.art)
      };
    }
    return song;
  }

  export function getSchedule(station: any): Promise<SongModel[]> {
    return new Promise(async (resolve, reject) => {
      if (station.live.is_live && station.station.name === "atr.one") {
        return resolve(MAirListService.getSchedule());
      }
      getStationQueue(station.station.name).then((result) => {
        const schedule: SongModel[] = [];
        for (const queue of result) {
          if (!String(queue.song.artist).includes("jingles")) {
            if (Number(schedule.length) < 5) {
              if (station.live.is_live && station.station.name === "atr.one") {
                const songInfo = {
                  artist: queue.song.artist,
                  title: queue.song.title,
                  playlist: queue.playlist,
                  start_at: Number(queue.cued_at),
                  end_at: Number(queue.cued_at) + Number(queue.duration),
                  duration: Number(queue.duration),
                  artworks: ArtworkService.getStreamerArtworks(station.live.streamer_name)
                };
                schedule.push(songInfo);
              } else {
                const songInfo = {
                  artist: queue.song.artist,
                  title: queue.song.title,
                  playlist: queue.playlist,
                  start_at: Number(queue.cued_at),
                  end_at: Number(queue.cued_at) + Number(queue.duration),
                  duration: Number(queue.duration),
                  artworks: ArtworkService.getArtworks(queue.song.id, queue.song.art)
                };
                schedule.push(songInfo);
              }
            }
          }
        }
        resolve(schedule);
      });
    });
  }

  export function getHistory(station: any): Promise<SongModel[]> {
    return new Promise(async (resolve, reject) => {
      getStationHistory(station.station.name).then((result) => {
        const history: SongModel[] = [];
        for (const last of result.song_history) {
          if (Number(history.length) < 10) {
            if (String(last.streamer).length !== 0 && station.station.name === "atr.one") {
              const songInfo = {
                artist: last.song.artist,
                title: last.song.title,
                playlist: last.playlist,
                start_at: Number(last.played_at),
                end_at: Number(last.played_at) + Number(last.duration),
                duration: Number(last.duration),
                artworks: MAirListService.getArtwork(last.song.artist + " - " + last.song.title)
              };
              history.push(songInfo);
            } else {
              const songInfo = {
                artist: last.song.artist,
                title: last.song.title,
                playlist: last.playlist,
                start_at: Number(last.played_at),
                end_at: Number(last.played_at) + Number(last.duration),
                duration: Number(last.duration),
                artworks: ArtworkService.getArtworks(last.song.id, last.song.art)
              };
              history.push(songInfo);
            }
          }
        }
        resolve(history);
      });
    });
  }

  export function getMedia(): Promise<any[]> {
    const stationUrl = "http://" + process.env.AZURACAST_API + "/api/station/1/files/list?currentDirectory=one";
    return new Promise((resolve, reject) => {
      const header = { "X-API-Key": process.env.AZURACAST_TOKEN };
      axios
        .get(stationUrl, { headers: header })
        .then((response) => {
          resolve(response.data);
        });
    });
  }

}
