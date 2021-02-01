'use strict';
import socket from 'socket.io';
import { CacheService } from './cache.service';
import { LogService } from './log.service';

let io: socket.Server;

export namespace SocketService {

    export function init(httpServer: any) {
        io = new socket.Server(httpServer);
        io.on("connection", (client: any) => {
            LogService.logInfo(`Client connected [id=${client.id}]`);
            client.emit("one", CacheService.get("channel-one"));
            client.emit("dance", CacheService.get("channel-dance"));
            client.emit("trap", CacheService.get("channel-trap"));
            client.on('disconnect', () => {
                LogService.logInfo(`Client gone [id=${client.id}]`);
            });
        });
    }

    export function emitUpdate(key: string, data: any) {
        io.emit(key, data);
    }

}