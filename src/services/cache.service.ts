'use strict';
import CacheManager from "fast-node-cache";
import { AzuracastService } from "./azuracast.service";
import { ListenerService } from "./listener.service";
// import { LogService } from "./log.service";

const cache = new CacheManager({
    cacheDirectory: "caches",
    memoryOnly: true,
    discardTamperedCache: true
});
const ipCache = new CacheManager({
    memoryOnly: true,
    discardTamperedCache: true
});
const tsabCache = new CacheManager({
    memoryOnly: true,
    discardTamperedCache: true
});

cache.on("outdated", (name: string, data?: any) => {
    if(name.startsWith("channel-")) {
        // LogService.logDebug("Cache '" + name + "' is no longer valid. Requesting new data...");
        const channelId = name.split("-");
        AzuracastService.getStationInfos(channelId[1]);
    } else if(name.startsWith("listeners")) {
        ListenerService.requestListener();
    }
});

export namespace CacheService {

    export function set(key: string, data: any, expires?: number) {
        cache.set(key, data, expires);
    }

    export function get(key: string): any {
        return cache.get(key);
    }

    export function getIpCache() {
        return ipCache;
    }

    export function getTsAbCache() {
        return tsabCache;
    }

}