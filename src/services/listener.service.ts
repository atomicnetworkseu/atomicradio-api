import axios from "axios";
import { MemoryCacheService } from "./cache.service";
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
      for (const botId of MemoryCacheService.getTeamSpeakCache().keys()) {
        const bot = MemoryCacheService.getTeamSpeakCache().get(botId);
        if (!MemoryCacheService.getTeamSpeakCache().isExpired(botId)) {
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
      MemoryCacheService.get("channel-one") === undefined ||
      MemoryCacheService.get("channel-dance") === undefined ||
      MemoryCacheService.get("channel-trap") === undefined
    ) {
      MemoryCacheService.set("listeners", { web: 0, discord: 0, teamspeak: 0, all: 0 }, 5000);
      SocketService.emitUpdate("listeners", 0);
      return;
    }
    const web =
      Number(MemoryCacheService.get("channel-one").listeners) +
      Number(MemoryCacheService.get("channel-dance").listeners) +
      Number(MemoryCacheService.get("channel-trap").listeners);
      MemoryCacheService.set("listeners", { web, discord, teamspeak, all: web + discord + teamspeak }, 5000);
    SocketService.emitUpdate("listeners", web + discord + teamspeak);
  }

  export function getListener() {
    if (MemoryCacheService.get("listeners") !== undefined) {
      return MemoryCacheService.get("listeners");
    } else {
      return { web: 0, discord: 0, teamspeak: 0, all: 0 };
    }
  }
}
