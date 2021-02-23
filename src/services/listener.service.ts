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
        let discord = 0;
        const teamspeak = 0;
        try {
            discord = await getDiscord();
            /*
             * We currently do not have the possibility to count TeamSpeak listeners.
             * This feature will be implemented again soon.
             *
             * teamspeak = await getTeamSpeak();
             */
        } catch(err) {
            LogService.logError("Error while requesting listener data.");
            console.log(err);
        }
        if(CacheService.get("channel-one") === undefined || CacheService.get("channel-dance") === undefined || CacheService.get("channel-trap") === undefined) {
            CacheService.set("listeners", {web: 0, discord: 0, teamspeak: 0, all: 0}, 5000);
            return;
        }
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