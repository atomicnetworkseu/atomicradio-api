import socket from "socket.io";
import { Server } from "ws";
import { MemoryCacheService } from "./cache.service";
import { LogService } from "./log.service";

let io: socket.Server;
let ws: Server;

export namespace SocketService {
  export function init(httpServer: any) {
    io = new socket.Server(httpServer, { cors: { origin: "*" } });
    io.on("connection", (client: any) => {
      LogService.logInfo(`Client connected [id=${client.id}]`);
      client.emit("one", MemoryCacheService.get("channel-one"));
      client.emit("dance", MemoryCacheService.get("channel-dance"));
      client.emit("trap", MemoryCacheService.get("channel-trap"));
      client.emit("listeners", MemoryCacheService.get("listeners").all);
      client.on("disconnect", () => {
        LogService.logInfo(`Client gone [id=${client.id}]`);
      });
    });

    ws = new Server({port: 3011});
    ws.on("connection", (webSocket: WebSocket) => {
      const id = makeWebSocketId();
      LogService.logInfo(`PreMiD connected over websockets. [id=${id}]`);
      MemoryCacheService.getWebSocketCache().set(id, webSocket);
      webSocket.send(JSON.stringify(MemoryCacheService.get("channel-one")));
      webSocket.send(JSON.stringify(MemoryCacheService.get("channel-dance")));
      webSocket.send(JSON.stringify(MemoryCacheService.get("channel-trap")));
      webSocket.onclose = () => {
        MemoryCacheService.getWebSocketCache().set(id, undefined);
        LogService.logInfo(`PreMiD disconnected over websockets. [id=${id}]`);
      }
      webSocket.onerror = () => {
        MemoryCacheService.getWebSocketCache().set(id, undefined);
        LogService.logInfo(`PreMiD errored over websockets. [id=${id}]`);
      }
    });
  }

  export function emitUpdate(key: string, data: any) {
    if(key !== "listeners") {
      for(const webSocketClientKey of MemoryCacheService.getWebSocketCache().keys()) {
        const webSocketClient = MemoryCacheService.getWebSocketCache().get(webSocketClientKey);
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
