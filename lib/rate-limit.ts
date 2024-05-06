import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error(
    "Please link a Vercel KV instance or populate `KV_REST_API_URL` and `KV_REST_API_TOKEN`",
  );
}

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const messageRateLimitPaying = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(25, "15 m"),
  analytics: true,
  prefix: "ratelimit:geui:msg",
});

export const messageRateLimitNoLogin = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "131400 m"),
  analytics: true,
  prefix: "ratelimit:geui:msg",
});

export const messageRateLimit_Login_NotPaying = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "131400 m"),
  analytics: true,
  prefix: "ratelimit:geui:msg",
});




//Just make a bunch of tiered ones here. So the rate limits would just be different for every tier.