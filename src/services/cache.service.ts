'use strict';
import CacheManager from "fast-node-cache";
import { AzuracastService } from "./azuracast.service";
import { ListenerService } from "./listener.service";

const cache = new CacheManager({
    cacheDirectory: "caches",
    memoryOnly: false,
    discardTamperedCache: true
});
const ipCache = new CacheManager({
    memoryOnly: true,
    discardTamperedCache: true
});

cache.on("outdated", (name: string, data?: any) => {
    console.log("Cache outdated: ", name);
    if(name.startsWith("channel-")) {
        const channelId = name.split("-");
        console.log(channelId);
        AzuracastService.getStationInfos(channelId[1]);
    } else if(name.startsWith("listeners")) {
        ListenerService.requestListener();
    }
});

export namespace CacheService {

    export function set(key: string, data: any, expires?: number) {
        console.log("Cache input: ", key, expires);
        cache.set(key, data, expires);
    }

    export function get(key: string): any {
        return cache.get(key);
    }

    export function getIpCache() {
        return ipCache;
    }

}