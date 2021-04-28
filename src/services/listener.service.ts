import axios from "axios";
import { CacheService } from "./cache.service";
import { LogService } from "./log.service";
import { SocketService } from "./socket.service";

export namespace ListenerService {
  export function getDiscord(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      axios
        .get("http://" + process.env.BOT_DISCORD_API + "/api/listeners")
        .then((response) => {
          resolve(response.data.listeners);
        })
        .catch((error) => {
          LogService.logError("Error while requesting discord listener data.");
          reject();
        });
    });
  }

  export function getTeamSpeak(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      for (const botId of CacheService.getTeamSpeakCache().keys()) {
        const bot = CacheService.getTeamSpeakCache().get(botId);
        if (!CacheService.getTeamSpeakCache().isExpired(botId)) {
          count += Number(bot.value);
        }
      }
      resolve(count);
    });
  }

  export async function requestListener() {
    let discord = 0;
    let teamspeak = 0;
    try {
      discord = await getDiscord();
      teamspeak = await getTeamSpeak();
    } catch (err) {
      LogService.logError("Error while requesting listener data.");
    }
    if (
      CacheService.get("channel-one") === undefined ||
      CacheService.get("channel-gaming") === undefined ||
      CacheService.get("channel-rap") === undefined
    ) {
      CacheService.set("listeners", { web: 0, discord: 0, teamspeak: 0, all: 0 }, 5000);
      SocketService.emitUpdate("listeners", 0);
      return;
    }
    const web =
      Number(CacheService.get("channel-one").listeners) +
      Number(CacheService.get("channel-gaming").listeners) +
      Number(CacheService.get("channel-rap").listeners);
    CacheService.set("listeners", { web, discord, teamspeak, all: web + discord + teamspeak }, 5000);
    SocketService.emitUpdate("listeners", web + discord + teamspeak);
  }

  export function getListener() {
    if (CacheService.get("listeners") !== undefined) {
      return CacheService.get("listeners");
    } else {
      return { web: 0, discord: 0, teamspeak: 0, all: 0 };
    }
  }
}
