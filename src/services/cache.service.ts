import Cache from "fast-node-cache";
import fs from "fs";
import { SubEvent } from 'sub-events';
import { AzuracastService } from "./azuracast.service";
import { ListenerService } from "./listener.service";

const cache = new Cache({
  memoryOnly: true,
  discardTamperedCache: true
});
const ipCache = new Cache({
  memoryOnly: true,
  discardTamperedCache: true
});
const teamspeakCache = new Cache({
  memoryOnly: true,
  discardTamperedCache: true
});
const webSocketCache = new Cache({
  memoryOnly: true,
  discardTamperedCache: true
});

cache.on("outdated", (name: string, data?: any) => {
  if (name.startsWith("channel-")) {
    const channelId = name.split("-");
    AzuracastService.getStationInfos(channelId[1]);
  } else if (name.startsWith("listeners")) {
    ListenerService.requestListener();
  }
});

export namespace MemoryCacheService {
  export function set(key: string, data: any, expires?: number) {
    cache.set(key, data, expires);
  }

  export function get(key: string): any {
    return cache.get(key);
  }

  export function getIpCache() {
    return ipCache;
  }

  export function getWebSocketCache() {
    return webSocketCache;
  }

  export function getTeamSpeakCache() {
    return teamspeakCache;
  }
}

interface CacheData {
  key: string,
  data: any,
  timeout?: number
}

export default class FileCacheManager {
  private cache = Object.create(null);
  private cacheDirectory: string = null;
  readonly onTimeout: SubEvent<CacheData> = new SubEvent();

  constructor(cacheDirectory?: string) {
      if(cacheDirectory) {
          this.cacheDirectory = cacheDirectory;
          if(!fs.existsSync(cacheDirectory)) {
              fs.mkdirSync(cacheDirectory);
          }
          fs.readdir(cacheDirectory, (err, files) => {
              if(!err) {
                  files.forEach((x) => {
                      fs.readFile(process.cwd() + "/" + cacheDirectory + "/" + x, (readErr, fileData) => {
                          if(!readErr) {
                              const data: CacheData = JSON.parse(fileData.toString("utf-8"));
                              this.cache[data.key] = data;
                          }
                      });
                  });
              }
          });
      }
      setInterval(() => {
          this.values().forEach((x: CacheData) => {
              if(x.timeout === 0) return;
              if(x.timeout < new Date().getTime()) {
                  this.onTimeout.emit(x);
                  delete this.cache[x.key];
                  if(cacheDirectory) {
                      fs.unlinkSync(process.cwd() + "/" + this.cacheDirectory + "/" + x.key + ".json");
                  }
              }
          });
      }, 1000);
  }

  set(key: string, value: any, timeoutMs?: number) {
      const data = { key, data: value, timeout: 0 };
      if(timeoutMs && timeoutMs !== 0) data.timeout = new Date().getTime() + timeoutMs;
      this.cache[key] = data;
      if(this.cacheDirectory) {
          fs.writeFileSync(process.cwd() + "/" + this.cacheDirectory + "/" + key + ".json", JSON.stringify(data));
      }
  }

  get(key: string) {
      const data: CacheData = this.cache[key];
      if(data === undefined) return null;
      return data.data;
  }

  delete(key: string) {
      const data: CacheData = this.cache[key];
      if(data === undefined) return;
      delete this.cache[key];
      if(this.cacheDirectory) {
          fs.unlinkSync(process.cwd() + "/" + this.cacheDirectory + "/" + key + ".json");
      }
  }

  clear() {
      this.cache = Object.create(null);
      if(this.cacheDirectory) {
          fs.rmdirSync(process.cwd() + "/" + this.cacheDirectory, { recursive: true });
          fs.mkdirSync(process.cwd() + "/" + this.cacheDirectory);
      }
  }

  values(): CacheData[] {
      return Object.values(this.cache);
  }

}