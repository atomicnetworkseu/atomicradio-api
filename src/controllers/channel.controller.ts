import { Request, Response } from "express";
import JWT from "jsonwebtoken";
import { MemoryCacheService } from "../services/cache.service";
import { AzuracastService } from "../services/azuracast.service";
import { MAirListService } from "../services/mairlist.service";
import { LogService } from "../services/log.service";
import { ChannelModel } from "../models/channel.model";

export namespace ChannelController {
  export function getChannels(req: Request, res: Response) {
    const channelOne = MemoryCacheService.get("channel-one") as ChannelModel;
    const channelDance = MemoryCacheService.get("channel-dance") as ChannelModel;
    const channelTrap = MemoryCacheService.get("channel-trap") as ChannelModel;
    const listeners = MemoryCacheService.get("listeners");
    if(channelOne === undefined || channelDance === undefined || channelTrap === undefined) {
      return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
    }
    if (listeners === undefined) {
      return res
        .status(200)
        .json({ listeners: { discord: 0, teamspeak: 0, web: 0, all: 0 }, one: channelOne, dance: channelDance, trap: channelTrap });
    }
    return res.status(200).json({ listeners, one: channelOne, dance: channelDance, trap: channelTrap });
  }

  export function getChannelById(req: Request, res: Response) {
    let channelId = String(req.params.id).toLowerCase();
    if (channelId.includes("atr.")) {
      channelId = channelId.split(".")[1];
    } else if (channelId.includes("atr-")) {
      channelId = channelId.split("-")[1];
    }

    switch (channelId) {
      case "one":
        if(MemoryCacheService.get("channel-one") === undefined || MemoryCacheService.get("channel-one").code !== undefined) {
          return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
        }
        const channelOne = MemoryCacheService.get("channel-one") as ChannelModel;
        return res.status(200).json(channelOne);
      case "dance":
        if(MemoryCacheService.get("channel-dance") === undefined || MemoryCacheService.get("channel-dance").code !== undefined) {
          return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
        }
        const channelDance = MemoryCacheService.get("channel-dance") as ChannelModel;
        return res.status(200).json(channelDance);
      case "trap":
        if(MemoryCacheService.get("channel-trap") === undefined || MemoryCacheService.get("channel-trap").code !== undefined) {
          return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
        }
        const channelTrap = MemoryCacheService.get("channel-trap") as ChannelModel;
        return res.status(200).json(channelTrap);
      default:
        return res.status(404).json({ code: 404, message: "This channel does not exist." });
    }
  }

  export function getChannelSong(req: Request, res: Response) {
    let channelId = String(req.params.id).toLowerCase();
    if (channelId.includes("atr.")) {
      channelId = channelId.split(".")[1];
    } else if (channelId.includes("atr-")) {
      channelId = channelId.split("-")[1];
    }

    if (channelId === "one" || channelId === "dance" || channelId === "trap") {
      if(MemoryCacheService.get("channel-" + channelId) === undefined || MemoryCacheService.get("channel-" + channelId).code !== undefined) {
        return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
      }
      const channel = MemoryCacheService.get("channel-" + channelId) as ChannelModel;
      return res.status(200).json(channel.song);
    } else {
      return res.status(404).json({ code: 404, message: "This channel does not exist." });
    }
  }

  export function getChannelDescription(req: Request, res: Response) {
    let channelId = String(req.params.id).toLowerCase();
    if (channelId.includes("atr.")) {
      channelId = channelId.split(".")[1];
    } else if (channelId.includes("atr-")) {
      channelId = channelId.split("-")[1];
    }

    if (channelId === "one" || channelId === "dance" || channelId === "trap") {
      if(MemoryCacheService.get("channel-" + channelId) === undefined || MemoryCacheService.get("channel-" + channelId).code !== undefined) {
        return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
      }
      const channel = MemoryCacheService.get("channel-" + channelId) as ChannelModel;
      return res.status(200).json(channel.description);
    } else {
      return res.status(404).json({ code: 404, message: "This channel does not exist." });
    }
  }

  export function getChannelSchedule(req: Request, res: Response) {
    let channelId = String(req.params.id).toLowerCase();
    if (channelId.includes("atr.")) {
      channelId = channelId.split(".")[1];
    } else if (channelId.includes("atr-")) {
      channelId = channelId.split("-")[1];
    }

    if (channelId === "one" || channelId === "dance" || channelId === "trap") {
      if(MemoryCacheService.get("channel-" + channelId) === undefined || MemoryCacheService.get("channel-" + channelId).code !== undefined) {
        return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
      }
      const channel = MemoryCacheService.get("channel-" + channelId) as ChannelModel;
      return res.status(200).json(channel.schedule);
    } else {
      return res.status(404).json({ code: 404, message: "This channel does not exist." });
    }
  }

  export function getChannelHistory(req: Request, res: Response) {
    let channelId = String(req.params.id).toLowerCase();
    if (channelId.includes("atr.")) {
      channelId = channelId.split(".")[1];
    } else if (channelId.includes("atr-")) {
      channelId = channelId.split("-")[1];
    }

    if (channelId === "one" || channelId === "dance" || channelId === "trap") {
      if(MemoryCacheService.get("channel-" + channelId) === undefined || MemoryCacheService.get("channel-" + channelId).code !== undefined) {
        return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
      }
      const channel = MemoryCacheService.get("channel-" + channelId) as ChannelModel;
      return res.status(200).json(channel.history);
    } else {
      return res.status(404).json({ code: 404, message: "This channel does not exist." });
    }
  }

  export function getChannelListeners(req: Request, res: Response) {
    let channelId = String(req.params.id).toLowerCase();
    if (channelId.includes("atr.")) {
      channelId = channelId.split(".")[1];
    } else if (channelId.includes("atr-")) {
      channelId = channelId.split("-")[1];
    }

    if (channelId === "one" || channelId === "dance" || channelId === "trap") {
      if(MemoryCacheService.get("channel-" + channelId) === undefined || MemoryCacheService.get("channel-" + channelId).code !== undefined) {
        return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
      }
      const channel = MemoryCacheService.get("channel-" + channelId) as ChannelModel;
      return res.status(200).json({ listeners: channel.listeners });
    } else {
      return res.status(404).json({ code: 404, message: "This channel does not exist." });
    }
  }

  export function getChannelLive(req: Request, res: Response) {
    if (!req.params.id) {
      if(MemoryCacheService.get("channel-one") === undefined || MemoryCacheService.get("channel-one").code !== undefined) {
        return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
      }
      const channel = MemoryCacheService.get("channel-one") as ChannelModel;
      return res.status(200).json(channel.live);
    }

    let channelId = String(req.params.id).toLowerCase();
    if (channelId.includes("atr.")) {
      channelId = channelId.split(".")[1];
    } else if (channelId.includes("atr-")) {
      channelId = channelId.split("-")[1];
    }

    if (channelId === "one") {
      if(MemoryCacheService.get("channel-" + channelId) === undefined || MemoryCacheService.get("channel-" + channelId).code !== undefined) {
        return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
      }
      const channel = MemoryCacheService.get("channel-" + channelId) as ChannelModel;
      return res.status(200).json(channel.live);
    } else if (channelId === "dance" || channelId === "trap") {
      return res.status(500).json({ code: 500, message: "Only our channel 'atr.one' has live metadata." });
    } else {
      return res.status(404).json({ code: 404, message: "This channel does not exist." });
    }
  }

  export function updateChannelLive(req: Request, res: Response) {
    if(req.body.type === "metadata") {
      if (!req.headers.authorization) {
        return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
      }

      const base64Token = Buffer.from(req.headers.authorization.split(" ")[1], "base64").toString("utf8");
      const jtwToken = base64Token.split(":")[1];
      try {
        const token: any = JWT.verify(jtwToken, process.env.STREAMER_TOKEN);
        if(MemoryCacheService.get("channel-one") === undefined || MemoryCacheService.get("channel-one").code !== undefined) {
          return res.status(500).json({ code: 500, message: "A problem with our API has occurred. Try again later." });
        }
        const channel = MemoryCacheService.get("channel-one") as ChannelModel;
        if(channel.live.is_live) {
          if(token.name !== channel.live.streamer) {
            LogService.logWarn(token.name + " has tried to transmit metadata. Metadata blocked!");
            return res.status(200).json({ code: 500, message: "Your profile is blocked." });
          }
        }

        LogService.logInfo("New metadata obtained for atr.one by " + token.name);
        MAirListService.updateMetaData(req.body);
        return res.status(200).json({ code: 200, message: "Hello Streamer!" });
      } catch(err) {
        return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
      }

    } else if(req.body.type === "new_streamer") {
      if (!req.headers.authorization) {
        return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
      }
      if (!req.headers.authorization.includes(Buffer.from(process.env.API_TOKEN).toString("base64"))) {
        return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
      }

      const token = JWT.sign({ name: req.body.name }, process.env.STREAMER_TOKEN);
      return res.status(200).json({ token });
    } else {
      if (!req.headers.authorization) {
        return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
      }
      if (!req.headers.authorization.includes(Buffer.from("secret-user-psshhh:" + process.env.API_TOKEN).toString("base64"))) {
        return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
      }

      AzuracastService.getStationInfos("one");
      return res.status(200).json({ code: 200, message: "Hello Azuracast!" });
    }
  }

  export function updateTeamSpeakListeners(req: Request, res: Response) {
    if (!req.query.token) {
      return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
    }
    if (!String(req.query.token).includes(process.env.API_TOKEN)) {
      return res.status(401).json({ code: 401, message: "Your authentication was not successful." });
    }

    MemoryCacheService.getTeamSpeakCache().set("teamspeak-" + req.body.botId, req.body, 86400000);
    return res.status(200).json({ code: 200, message: "Hello TS3AudioBot!" });
  }
}
