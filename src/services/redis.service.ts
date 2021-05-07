import redis from "redis";
import { LogService } from "./log.service";
const client = redis.createClient();

export namespace RedisService {

    client.on("error", () => {
        LogService.logError("Something went wrong with Redis.");
    });

    export function set(key: string, data: string, expires?: number) {
        client.set(key, data);
    }

    export function get(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            client.get(key, (err, reply) => {
                if(err) reject(err);
                const data = JSON.parse(reply);
                resolve(data);
            });
        });
    }

    export function clear() {
        client.flushall();
    }

}