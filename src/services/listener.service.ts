import axios from "axios";
import { ChannelService } from "./channel.service";

export namespace ListenerService {

    export function getListeners(): Promise<{ discord: number, teamspeak: number, web: number, all: number }> {
        return new Promise((resolve, reject) => {
            const result = { discord: 0, teamspeak: 0, web: 0, all: 0 };
            getDiscord().then((discord) => {
                discord.forEach((x) => {
                    result.discord += x.value;
                });
                getWeb().then((web) => {
                    web.forEach((x) => {
                        result.web += x.value;
                    });
                    result.all = result.discord+result.teamspeak+result.web;
                    resolve(result);
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
            });
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
            });
        });
    }

}