'use strict';
import axios from "axios";
import { CacheService } from "./cache.service";
import { LogService } from "./log.service";

export namespace ListenerService {

    export function getDiscord(): Promise<number> {
        return new Promise(async (resolve, reject) => {
            axios.get("http://" + process.env.BOT_DISCORD_API + "/api/listeners").then((response) => {
                resolve(response.data.listeners);
            }).catch((error) => {
                LogService.logError("Error while requesting discord listener data.");
                console.log(error);
                reject();
            });
        });
    }

    export function getTeamSpeak(): Promise<number> {
        return new Promise(async (resolve, reject) => {
            axios.get("http://" + process.env.BOT_TEAMSPEAK_API + "/api/listeners").then((response) => {
                resolve(response.data.listeners);
            }).catch((error) => {
                LogService.logError("Error while requesting teamspeak listener data.");
                console.log(error);
                reject();
            });
        });
    }

    export async function requestListener() {
        const discord = await getDiscord();
        const teamspeak = await getTeamSpeak();
        const web = Number(CacheService.get("channel-one").listeners)+Number(CacheService.get("channel-dance").listeners)+Number(CacheService.get("channel-trap").listeners);
        CacheService.set("listeners", {web, discord, teamspeak, all: (web+discord+teamspeak)}, 5000);
    }

    export function getListener() {
        if(CacheService.get("listeners") !== undefined) {
            return CacheService.get("listeners");
        } else {
            return {web: 0, discord: 0, teamspeak: 0, all: 0};
        }
    }

}