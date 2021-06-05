import CacheManager from "fast-node-cache";
import { ChannelService } from "./channel.service";
import { ListenerService } from "./listener.service";
import { SocketService } from "./socket.service";

const cache = new CacheManager({
  memoryOnly: true,
  discardTamperedCache: true
});
const webSocketCache = new CacheManager({
  memoryOnly: true,
  discardTamperedCache: true
});

cache.on("update", (name: string, data?: any) => {
  if (name.startsWith("channel-")) {
    const channelId = name.split("-");
    SocketService.emitUpdate("channels", data);
    SocketService.emitUpdate(channelId[1].split(".")[1], data);
  }
});
cache.on("outdated", (name: string, data?: any) => {
  if (name.startsWith("channel-")) {
    const channelId = name.split("-");
    ChannelService.getStationInfos(channelId[1]);
  } else if (name.startsWith("listeners")) {
    ListenerService.getListeners();
  }
});

export namespace CacheService {
  export function set(key: string, data: any, expires?: number) {
    cache.set(key, data, expires);
  }

  export function get(key: string): any {
    return cache.get(key);
  }

  export function keys(): string[] {
    return cache.keys();
  }
  
  export function isExpired(key: string) {
    return cache.isExpired(key);
  }

  export function getWebSocketCache() {
    return webSocketCache;
  }

}
