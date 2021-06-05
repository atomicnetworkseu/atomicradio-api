import axios from "axios";
import { CacheService } from "./cache.service";
import { ChannelService } from "./channel.service";

export namespace ListenerService {

    export function getListeners(): Promise<{ discord: number, teamspeak: number, web: number, all: number }> {
        return new Promise((resolve, reject) => {
            const result = { discord: 0, teamspeak: 0, web: 0, all: 0 };
            getWeb().then((web) => {
                web.forEach((x) => {
                    result.web += x.value;
                });
                getDiscord().then((discord) => {
                    discord.forEach((x) => {
                        result.discord += x.value;
                    });
                    getTeamSpeak().then((teamspeak) => {
                        result.teamspeak = teamspeak;
                        result.all = result.discord+result.teamspeak+result.web;
                        CacheService.set("listeners", result, 60000);
                        resolve(result);
                    });
                });
            });
        });
    }

    export function getWeb(): Promise<{ station: string, value: number }[]> {
        return new Promise((resolve, reject) => {
            ChannelService.getStations().then((channels) => {
                const result: { station: string, value: number }[] = [];
                for(const channel of channels) {
                    result.push({ station: channel.name.split(".")[1], value: channel.listeners });
                }
                resolve(result);
            }).catch(() => resolve([]));
        });
    }

    export function getDiscord(): Promise<{ station: string, value: number }[]> {
        return new Promise((resolve, reject) => {
            axios.get("http://" + process.env.BOT_DISCORD_API + "/api/listeners").then((response) => {
                const result: { station: string, value: number }[] = [];
                for(const listener of response.data.listener) {
                    const items = result.filter(x => x.station === String(listener.station).toLowerCase());
                    if(items.length !== 0) {
                        items[0].value += 1;
                    } else {
                        result.push({ station: String(listener.station).toLowerCase(), value: 1 });
                    }
                }
                resolve(result);
            }).catch(() => resolve([]));
        });
    }

    export function getTeamSpeak(): Promise<number> {
      return new Promise(async (resolve, reject) => {
        let result = 0;
        for (const key of CacheService.keys()) {
          if(key.startsWith("teamspeak-")) {
            const bot = CacheService.get(key);
            if (!CacheService.isExpired(key)) {
                result += Number(bot.value);
            }
          }
        }
        resolve(result);
      });
    }

}