import { Request, Response } from "express";
import Canvas from "canvas";

Canvas.registerFont("./assets/fonts/Montserrat-Light.ttf", { family: "Montserrat-Light" });
Canvas.registerFont("./assets/fonts/Montserrat-Regular.ttf", { family: "Montserrat-Regular" });
Canvas.registerFont("./assets/fonts/Montserrat-LightItalic.ttf", { family: "Montserrat-LightItalic" });
Canvas.registerFont("./assets/fonts/Montserrat-Bold.ttf", { family: "Montserrat-Bold" });

export namespace CardController {
  export async function getSongCard(req: Request, res: Response) {
    try {
      const card = await createSongCard(
        String(req.query.author),
        String(req.query.title),
        String(req.query.start_at),
        String(req.query.end_at),
        String(req.query.station),
        String(req.query.playing),
        String(req.query.image)
      );
      res.set("Content-Type", "image/png");
      res.send(card);
    } catch (err) {
      console.log("ERROR WHILE CREATING SONG CARD");
      res.status(500).json({ code: 500, message: "Song card could not be loaded. Please try again later." });
    }
  }

  export async function createSongCard(
    author: string,
    title: string,
    start_at: string,
    end_at: string,
    station: string,
    playing: string,
    image: string
  ) {
    const canvas = Canvas.createCanvas(1000, 431);
    const ctx = canvas.getContext("2d");
    const background = await Canvas.loadImage("./assets/images/background/radio-card-bg.png");
    ctx.font = "13px Montserrat-Regular";

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    if (playing === "now") {
      const header_text = [
        { text: "CURRENTLY ", fillStyle: "#868788", font: "28px Montserrat-Bold" },
        { text: "PLAYING AT ", fillStyle: "#868788", font: "28px Montserrat-Light" },
        { text: "ATR." + station.toUpperCase(), fillStyle: "#868788", font: "28px Montserrat-Bold" }
      ];
      fillMixedTextLeft(ctx, header_text, 90, 55);
    } else if (playing === "last") {
      const header_text = [
        { text: "LAST ", fillStyle: "#868788", font: "28px Montserrat-Bold" },
        { text: "PLAYED AT ", fillStyle: "#868788", font: "28px Montserrat-Light" },
        { text: "ATR." + station.toUpperCase(), fillStyle: "#868788", font: "28px Montserrat-Bold" }
      ];
      fillMixedTextLeft(ctx, header_text, 90, 55);
    } else if (playing === "next") {
      const header_text = [
        { text: "NEXT ", fillStyle: "#868788", font: "28px Montserrat-Bold" },
        { text: "PLAYING AT ", fillStyle: "#868788", font: "28px Montserrat-Light" },
        { text: "ATR." + station.toUpperCase(), fillStyle: "#868788", font: "28px Montserrat-Bold" }
      ];
      fillMixedTextLeft(ctx, header_text, 90, 55);
    }

    fillMixedTextLeft(ctx, [{ text: title, fillStyle: "#ffffff", font: "42.1px Montserrat-Bold" }], 50, 220, 165);
    fillMixedTextLeft(ctx, [{ text: author, fillStyle: "#ffffff", font: "27.5px Montserrat-Light" }], 50, 250, 265);
    fillMixedTextLeft(
      ctx,
      [{ text: start_at.split(":")[1] + ":" + start_at.split(":")[2], fillStyle: "#ffffff", font: "26.4px Montserrat-LightItalic" }],
      8,
      412,
      100
    );
    fillMixedTextLeft(
      ctx,
      [{ text: end_at.split(":")[1] + ":" + end_at.split(":")[2], fillStyle: "#ffffff", font: "26.4px Montserrat-LightItalic" }],
      923.5,
      412,
      65
    );

    let stime_start;
    let stime_end;
    if (start_at.split(":").length === 3) {
      stime_start = Number(start_at.split(":")[0]) * 3600 + Number((start_at.split(":")[1] as any) * 60 + Number(start_at.split(":")[2]));
    } else {
      stime_start = Number(start_at.split(":")[0]) * 60 + Number(start_at.split(":")[1]);
    }

    if (end_at.split(":").length === 3) {
      stime_end = Number(end_at.split(":")[0]) * 3600 + Number((end_at.split(":")[1] as any) * 60 + Number(end_at.split(":")[2]));
    } else {
      stime_end = Number(end_at.split(":")[0]) * 60 + Number(end_at.split(":")[1]);
    }

    const val = Math.ceil((Number(stime_start) / Number(stime_end)) * 100);
    const val_w = Math.ceil(((100 - val) * canvas.width) / 100);
    ctx.fillStyle = "#c5c5c5";
    ctx.strokeStyle = "#c5c5c5";
    if (val !== 0) {
      roundRect(ctx, canvas.width + 10, canvas.height - 10.18, -val_w + 10, 10, 2.5, true);
    }

    ctx.strokeStyle = "transparent";
    roundRect(ctx, 700, 80, 250, 250, 20);
    if (image !== "") {
      const cover = await Canvas.loadImage(image);
      ctx.clip();
      ctx.drawImage(cover, 700, 80, 250, 250);
      ctx.restore();
    }
    return canvas.toBuffer();
  }

  function roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: any, fill?: boolean, stroke?: boolean) {
    if (typeof stroke === "undefined") {
      stroke = true;
    }
    if (typeof radius === "undefined") {
      radius = 5;
    }
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
      for (const side in defaultRadius) {
        if (side !== undefined) {
          radius[side] = radius[side];
        }
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  function fillMixedTextLeft(ctx: any, args: any, x: number, y: number, max_width?: number) {
    const defaultFillStyle = ctx.fillStyle;
    const defaultFont = ctx.font;
    let width = 0;
    ctx.textAlign = "start";
    ctx.save();

    if (max_width) {
      args.forEach((arg: any) => {
        ctx.fillStyle = arg.fillStyle || defaultFillStyle;
        width += ctx.measureText(arg.text).width;
      });

      if (width > max_width) {
        let text = args[args.length - 1].text;

        while (ctx.measureText(text).width > max_width) {
          text = text.slice(0, -1);
        }

        text = text += "...";

        args[args.length - 1].text = text;
      }
    }

    args.forEach((arg: any) => {
      ctx.fillStyle = arg.fillStyle || defaultFillStyle;
      ctx.font = arg.font || defaultFont;
      ctx.fillText(arg.text, x, y);
      x += ctx.measureText(arg.text).width;
    });
    ctx.restore();
  }
}
