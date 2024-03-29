import socket from "socket.io";
import { Server } from "ws";
import { CacheService } from "./cache.service";
import { LogService } from "./log.service";

let io: socket.Server;
let ws: Server;

export namespace SocketService {
  export function init(httpServer: any) {
    io = new socket.Server(httpServer, { cors: { origin: "*" } });
    io.on("connection", (client: any) => {
      LogService.logInfo(`Client connected [id=${client.id}]`);
      client.emit("one", CacheService.get("channel-one"));
      client.emit("dance", CacheService.get("channel-dance"));
      client.emit("trap", CacheService.get("channel-trap"));
      client.emit("listeners", CacheService.get("listeners").all);
      client.on("disconnect", () => {
        LogService.logInfo(`Client gone [id=${client.id}]`);
      });
    });

    ws = new Server({port: 3011});
    ws.on("connection", (webSocket: WebSocket) => {
      const id = makeWebSocketId();
      LogService.logInfo(`PreMiD connected over websockets. [id=${id}]`);
      CacheService.getWebSocketCache().set(id, webSocket);
      webSocket.send(JSON.stringify(CacheService.get("channel-one")));
      webSocket.send(JSON.stringify(CacheService.get("channel-dance")));
      webSocket.send(JSON.stringify(CacheService.get("channel-trap")));
      webSocket.onclose = () => {
        CacheService.getWebSocketCache().set(id, undefined);
        LogService.logInfo(`PreMiD disconnected over websockets. [id=${id}]`);
      }
      webSocket.onerror = () => {
        CacheService.getWebSocketCache().set(id, undefined);
        LogService.logInfo(`PreMiD errored over websockets. [id=${id}]`);
      }
    });
  }

  export function emitUpdate(key: string, data: any) {
    if(key !== "listeners") {
      for(const webSocketClientKey of CacheService.getWebSocketCache().keys()) {
        const webSocketClient = CacheService.getWebSocketCache().get(webSocketClientKey);
        if(webSocketClient !== undefined) {
          webSocketClient.send(JSON.stringify(data));
        }
      }
    }
    io.emit(key, data);
  }

  export function makeWebSocketId() {
    let result  = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 5; i++) {
       result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
 }
}
