import { RateLimiterMemory } from "rate-limiter-flexible";
import express from "express";

const globalLimiter = new RateLimiterMemory({
    keyPrefix: "global-limiter",
    points: 100,
    duration: 60,
    blockDuration: 60 * 60
  });
  const weatherLimiter = new RateLimiterMemory({
    keyPrefix: "weather-limiter",
    points: 50,
    duration: 60,
    blockDuration: 60 * 60
  });

export namespace RateLimiterService {

    export function globalRateLimiter(req: express.Request, res: express.Response, next: () => void) {
        globalLimiter
            .consume(req.ip, 1)
            .then((value) => {
                res.set({
                    "X-RateLimit-Limit": 250,
                    "X-RateLimit-Remaining": value.remainingPoints,
                    "X-RateLimit-Reset": new Date(Date.now() + value.msBeforeNext),
                    "X-RateLimit-Retry": value.msBeforeNext / 1000
                });
                next();
            })
            .catch((error) => {
                res.set({
                    "X-RateLimit-Limit": 250,
                    "X-RateLimit-Remaining": error.remainingPoints,
                    "X-RateLimit-Reset": new Date(Date.now() + error.msBeforeNext),
                    "X-RateLimit-Retry": error.msBeforeNext / 1000
                });
                res.status(429).json({ code: 429, message: "You are being rate limited." });
            });
    }

    export function weatherRateLimiter(req: express.Request, res: express.Response, next: () => void) {
        weatherLimiter
            .consume(req.ip, 1)
            .then((value) => {
                res.set({
                    "X-RateLimit-Limit": 100,
                    "X-RateLimit-Remaining": value.remainingPoints,
                    "X-RateLimit-Reset": new Date(Date.now() + value.msBeforeNext),
                    "X-RateLimit-Retry": value.msBeforeNext / 1000
                });
                next();
            })
            .catch((error) => {
                res.set({
                    "X-RateLimit-Limit": 100,
                    "X-RateLimit-Remaining": error.remainingPoints,
                    "X-RateLimit-Reset": new Date(Date.now() + error.msBeforeNext),
                    "X-RateLimit-Retry": error.msBeforeNext / 1000
                });
                if (req.query.token) {
                    if (String(req.query.token).includes(process.env.API_TOKEN)) {
                        next();
                    } else {
                        res.status(429).json({ code: 429, message: "You are being rate limited." });
                    }
                } else {
                    res.status(429).json({ code: 429, message: "You are being rate limited." });
                }
            });
    }

}