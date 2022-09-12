/**
 * Copyright ©2021 Dana Basken
 */

import os from "os";
import redis from "redis";
import log4js from "log4js";
import {Config, EnglishMs, Utilities, RateLimitError} from "../src";

const logger = log4js.getLogger("Redis");

export class Redis {

  static LOCK_ID = 0;
  static _hostname?: string;

  static PRIORITIES = {
    LOW: 1,
    NORMAL: 5,
    HIGH: 10
  };

  private _client?: any;

  constructor() {
  }

  /**
   * Get the value for a key.
   * @param key {String}
   * @returns {Promise<*>}
   */
  async get(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.client.get(key, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Set the value for a key.
   * @param key {String}
   * @param value {*}
   * @param timeoutMs {Number} If specified, what the expire timeout should be
   * @param exclusive {Boolean} If specified, only set if the key doesn't exist
   * @returns {Promise<String>}
   */
  async set(key: string, value: any, timeoutMs = 0, exclusive = false): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      value = typeof value === "object" ? JSON.stringify(value) : value;
      const args = [key, value];
      if (timeoutMs) { args.push("PX", timeoutMs) }
      if (exclusive) { args.push("NX") }
      this.client.set(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async lpush(key: string, value: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      value = typeof value === "object" ? JSON.stringify(value) : value;
      const args = [key, value];
      this.client.lpush(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async rpop(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.client.rpop(key, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async brpop(key: string, timeoutMs: number = 0): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const args = [key, timeoutMs / 1000];
      this.client.brpop(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(Array.isArray(reply) ? reply[1] : undefined);
      });
    });
  }

  async llen(key: string): Promise<any> {
    return new Promise<number>((resolve, reject) => {
      this.client.llen(key, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async ltrim(key: string, start: number, end: number): Promise<any> {
    return new Promise<number>((resolve, reject) => {
      const args = [key, start, end];
      this.client.ltrim(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Add a value to a Set.
   * @param key {String}
   * @param value {*}
   * @returns {Promise<*>}
   */
  async sadd(key: string, value: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      value = typeof value === "object" ? JSON.stringify(value) : value;
      const args = [key, value];
      this.client.sadd(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Remove a random value from a Set.
   * @param key {String}
   * @returns {Promise<*>}
   */
  async spop(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.client.spop(key, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Delete a value from a Set.
   * @param key {String}
   * @param value {*}
   * @returns {Promise<*>}
   */
  async srem(key: string, value: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      value = typeof value === "object" ? JSON.stringify(value) : value;
      const args = [key, value];
      this.client.srem(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Get all values from a Set.
   * @param key {String}
   * @returns {Promise<Array>}
   */
  async smembers(key: string): Promise<any> {
    return new Promise<Array<any>>((resolve, reject) => {
      this.client.smembers(key, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Get the number of keys in a Set (aka the Set length).
   * @param key {String}
   * @returns {Promise<Number>}
   */
  async scard(key: string): Promise<any> {
    return new Promise<number>((resolve, reject) => {
      this.client.scard(key, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async zadd(key: string, value: any, priority: number = Redis.PRIORITIES.NORMAL): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      value = typeof value === "object" ? JSON.stringify(value) : value;
      const args = [key, "GT", priority, value];
      this.client.zadd(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async zpop(key: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.client.zpopmax(key, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(Array.isArray(reply) ? reply[0] : undefined);
      });
    });
  }

  async zrangebyscore(key: string, priority: number = Redis.PRIORITIES.NORMAL): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const args = [key, "-inf", priority];
      this.client.zrangebyscore(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async zrem(key: string, value: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      value = typeof value === "object" ? JSON.stringify(value) : value;
      const args = [key, value];
      this.client.zrem(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  async bzpop(key: string, timeoutMs: number = 0): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const args = [key, timeoutMs / 1000];
      this.client.bzpopmax(args, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(Array.isArray(reply) ? reply[1] : undefined);
      });
    });
  }

  /**
   * Delete a key.
   * @param key {String}
   * @returns {Promise<String>}
   */
  async del(key: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.del(key, (error: any) => {
        if (error) { return reject(error) }
        resolve();
      });
    });
  }

  /**
   * Get the time-to-live remaining for a key, if any.
   * @param key {String}
   * @returns {Promise<Number>} The remaining TTL, or -1 if no TTL, -2 if key not found
   */
  async ttl(key: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.ttl(key, (error: any, reply: number) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Get keys matching a pattern.
   * @param pattern {String}
   * @returns {Promise<Array>}
   */
  async keys(pattern: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.keys(pattern, (error: any, reply: any) => {
        if (error) { return reject(error) }
        resolve(reply);
      });
    });
  }

  /**
   * Subscribe to an event.
   * @param topic {String} Event name
   * @param closure {Function} function(message)
   */
  subscribe(topic: string, closure: any): void {
    const subscriber = redis.createClient(this.config);
    subscriber.subscribe(topic, () => {
      subscriber.on("message", closure);
    });
  }

  /**
   * Publish an event
   * @param topic {String} Event name
   * @param message {String} Message
   */
  publish(topic: string, message: string | object): void {
    message = typeof message === "object" ? JSON.stringify(message) : message;
    this.client.publish(topic, message);
  }

  /**
   * Get a lock for a key.
   * @param key {String} The key, will be used to form the lock key
   * @param wait {Boolean} Wait to obtain the lock, or simply just try and return
   * @param timeoutMs {Number} How long to wait for the lock before failing
   * @param retrySleepMs {Number} How long to sleep in between attempts to lock
   * @returns {Promise<Object>} Lock object (key/value), or undefined
   */
  async getLock(key: string, wait = true, timeoutMs = 10000, retrySleepMs = 500): Promise<any> {
    const lockKey = `${key}.lock`;
    const lockValue = `${this.hostname}.${process.pid}.${Date.now()}.${++Redis.LOCK_ID}`;
    return new Promise(async (resolve, reject) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs + retrySleepMs) {
        const result = await this.set(lockKey, lockValue, timeoutMs, true);
        if (result) { return resolve({key: lockKey, value: lockValue}) }
        if (!wait) { return resolve(undefined) }
        await Utilities.sleep(retrySleepMs);
      }
      reject({message: `could not obtain lock for ${key} within ${timeoutMs}ms`});
    });
  }

  /**
   * Unlock a lock.
   * @param lock {Object} The lock obtained from getLock()
   * @returns {Promise<undefined>}
   */
  async unlock(lock: any): Promise<void> {
    const value = await this.get(lock.key);
    if (!value) {
      logger.warn(`could not unlock ${JSON.stringify(lock)}, doesn't exist`)
      return;
    }
    if (value !== lock.value) {
      logger.warn(`could not unlock ${JSON.stringify(lock)}, mismatch lock value`);
      return;
    }
    await this.del(lock.key);
  }

  /**
   * Get a cached value, creating it if needed.
   * @param key {String}
   * @param expireMs {Number} The time-to-live for the cached value
   * @param waitMs {Number} How long to wait to obtain lock
   * @param closure {Function} The function to call to generate the cache value
   * @returns {Promise<*>} The cached value
   */
  async cache(key: string, expireMs: number, waitMs: number, closure: Function): Promise<any> {
    let result = await this.get(key);
    if (Utilities.isSet(result)) { return result }
    const lock = await this.getLock(key, true, waitMs, waitMs / 100);
    if (lock) {
      try {
        let result = await this.get(key);
        if (!Utilities.isSet(result)) {
          result = await closure();
          if (result === undefined) { return }
          await this.set(key, result, expireMs);
          return result;
        }
      } finally {
        await this.unlock(lock);
      }
    }
  }

  /**
   *
   * @param baseKey
   * @param limit
   * @param resolutionMs {Number}
   * @returns {Promise<void>}
   */
  async limit(baseKey: string, limit: number, resolutionMs: number = 1000): Promise<void> {
    const bucket = Math.floor(Date.now() / resolutionMs);
    const key = `rate.limit.${baseKey}.${bucket}`;
    const count = await this.get(key);
    if (count > limit) { throw new RateLimitError(`rate limit exceeded: ${limit} per ${resolutionMs}ms`) }
    return await this.incr(key, resolutionMs);
  }

  async incr(key: string, expireMs = 0): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client
        .multi()
        .incr(key)
        .expire(key, expireMs / 1000)
        .exec((error: any, replies: any) => {
          if (error) { return reject(error) }
          resolve();
        });
    });

  }

  /**
   * Get the Redis client, creating it if needed.
   */
  get client(): any {
    if (!this._client) {
      this._client = redis.createClient(this.config);
      this._client.on("error", (error: any) => {
        logger.error(error.message);
        this._client = undefined;
      });
      this.client.on("reconnecting", () => {
        logger.warn("redis reconnecting...");
      });
    }
    return this._client;
  }

  get config(): any {
    return {
      host: Config.get("redis.host", "localhost"),
      port: Config.get("redis.port", 6379),
      password: Config.get("redis.password"),
      db: Config.get("redis.db"),
      retry_strategy: (options: any): any => {
        logger.warn(`redis reconnect attempt: ${JSON.stringify(options)}`);
        // {"attempt":1,"error":{"errno":-61,"code":"ECONNREFUSED","syscall":"connect","address":"127.0.0.1","port":6379},"total_retry_time":0,"times_connected":0}
        if (options.attempt > Config.get("redis.retry.max_attempts", 10)) {
          logger.fatal("redis reconnect failed.");
          return undefined;
        }
        const baseSleepMs = EnglishMs.ms(Config.get("redis.retry.base_sleep_time", "1s"));
        return Math.min(Math.pow(2, options.attempt) * baseSleepMs, EnglishMs.ms(Config.get("redis.retry.max_sleep_time", "1m")));
      }
    };
  }

  get hostname(): string {
    if (!Redis._hostname) {
      const hostname = os.hostname() || "unknown";
      Redis._hostname = hostname.split(".")[0];
    }
    return Redis._hostname;
  }

  /**
   * Shut down all resources used.
   */
  shutdown(): void {
    if (this._client) {
      this._client.quit();
      this._client = undefined;
    }
  }

}
