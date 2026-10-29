import { createHmac } from "node:crypto";
import type { Redis } from "ioredis";
import type { RequestHandler } from "express";
import { HttpError } from "./problem.js";
const increment = `local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return {n, redis.call('TTL', KEYS[1])}`;
export class RateLimiter {
  constructor(
    private redis: Redis,
    private secret: string,
    private prefix = "auth:",
  ) {}
  key(value: string) {
    return (
      this.prefix +
      createHmac("sha256", this.secret).update(value).digest("hex")
    );
  }
  async hit(value: string, limit: number, seconds: number) {
    try {
      const [count, ttl] = (await this.redis.eval(
        increment,
        1,
        this.key(value),
        seconds,
      )) as number[];
      return { blocked: count > limit, retryAfter: Math.max(1, ttl) };
    } catch {
      throw new HttpError(
        503,
        "LIMITER_UNAVAILABLE",
        "Sign-in service temporarily unavailable. Please try again.",
      );
    }
  }
  async failures(email: string) {
    try {
      return Number((await this.redis.get(this.key(`failed:${email}`))) ?? 0);
    } catch {
      throw new HttpError(
        503,
        "LIMITER_UNAVAILABLE",
        "Sign-in service temporarily unavailable. Please try again.",
      );
    }
  }
  async failed(email: string) {
    await this.hit(`failed:${email}`, 5, 900);
  }
  async succeeded(email: string) {
    await this.redis.del(this.key(`failed:${email}`));
  }
  middleware(name: string, limit: number, seconds: number): RequestHandler {
    return async (req, res, next) => {
      try {
        const result = await this.hit(`${name}:ip:${req.ip}`, limit, seconds);
        if (result.blocked) {
          res.setHeader("Retry-After", result.retryAfter);
          throw new HttpError(
            429,
            "RATE_LIMITED",
            "Too many attempts. Please try again after the indicated wait.",
          );
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
