/**
 * Copyright ©2021 Dana Basken
 */

import os from "os";
import {createClient, RedisClientType} from "redis";
import log4js from "log4js";
import {Config, EnglishMs, Utilities, RateLimitError} from "../src";
import {RedisClientOptions} from "@redis/client";

const logger = log4js.getLogger("Redis");

export class Redis {

  static LOCK_ID = 0;
  static _hostname?: string;

  static PRIORITIES = {
    LOW: 1,
    NORMAL: 5,
    HIGH: 10
  };

  private _client?: RedisClientType;

  constructor() {
  }

  async start(): Promise<void> {
    this._client = createClient(this.config) as RedisClientType;
    await this._client.connect();
  }

  async stop(): Promise<void> {
    return this._client.disconnect();
  }

  /**
   * Get the value for a key.
   * @param key {String}
   * @returns {Promise<*>}
   */
  async get(key: string): Promise<any> {
    return this.client.get(key);
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
    value = typeof value === "object" ? JSON.stringify(value) : value;
    const options: any = {};
    if (timeoutMs) { options.PX = timeoutMs; }
    if (exclusive) { options.NX = true; }
    return this.client.set(key, value, options);
  }

  async lpush(key: string, value: any): Promise<any> {
    return this.client.lPush(key, value);
  }

  async rpop(key: string): Promise<any> {
    return this.client.rPop(key);
  }

  async brpop(key: string, timeoutMs: number = 0): Promise<any> {
    return this.client.brPop(key, timeoutMs / 1000);
  }

  async llen(key: string): Promise<any> {
    return this.client.lLen(key);
  }

  async ltrim(key: string, start: number, end: number): Promise<any> {
    return this.client.lTrim(key, start, end);
  }

  /**
   * Add a value to a Set.
   * @param key {String}
   * @param value {*}
   * @returns {Promise<*>}
   */
  async sadd(key: string, value: any): Promise<any> {
    value = typeof value === "object" ? JSON.stringify(value) : value;
    return this.client.sAdd(key, value);
  }

  /**
   * Remove a random value from a Set.
   * @param key {String}
   * @returns {Promise<*>}
   */
  async spop(key: string): Promise<any> {
    return this.client.sPop(key);
  }

  /**
   * Delete a value from a Set.
   * @param key {String}
   * @param value {*}
   * @returns {Promise<*>}
   */
  async srem(key: string, value: any): Promise<any> {
    value = typeof value === "object" ? JSON.stringify(value) : value;
    return this.client.sRem(key, value);
  }

  /**
   * Get all values from a Set.
   * @param key {String}
   * @returns {Promise<Array>}
   */
  async smembers(key: string): Promise<any> {
    return this.client.sMembers(key);
  }

  /**
   * Get the number of keys in a Set (aka the Set length).
   * @param key {String}
   * @returns {Promise<Number>}
   */
  async scard(key: string): Promise<any> {
    return this.client.sCard(key);
  }

  async zadd(key: string, value: any, priority: number = Redis.PRIORITIES.NORMAL): Promise<any> {
    return this.client.zAdd(key, {score: priority, value: value}, {GT: true});
  }

  async zpop(key: string): Promise<any> {
    return this.client.zPopMax(key);
  }

  async zrangebyscore(key: string, priority: number = Redis.PRIORITIES.NORMAL): Promise<any> {
    return this.client.zRangeByScore(key, "-inf", priority);
  }

  async zrem(key: string, value: any): Promise<any> {
    return this.client.zRem(key, value);
  }

  async bzpop(key: string, timeoutMs: number = 0): Promise<any> {
    return this.client.bzPopMax(key, timeoutMs / 1000);
  }

  /**
   * Delete a key.
   * @param key {String}
   * @returns {Promise<String>}
   */
  async del(key: string): Promise<any> {
    return this.client.del(key);
  }

  /**
   * Get the time-to-live remaining for a key, if any.
   * @param key {String}
   * @returns {Promise<Number>} The remaining TTL, or -1 if no TTL, -2 if key not found
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Get keys matching a pattern.
   * @param pattern {String}
   * @returns {Promise<Array>}
   */
  async keys(pattern: string): Promise<any> {
    return this.client.keys(pattern);
  }

  /**
   * Subscribe to an event.
   * @param topic {String} Event name
   * @param closure {Function} function(message)
   */
  async subscribe(topic: string, closure: (message: any) => void): Promise<any> {
    const subscriber = this._client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(topic, closure);
    return subscriber;
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

  async limit(baseKey: string, limit: number, resolutionMs: number = 1000): Promise<void> {
    const bucket = Math.floor(Date.now() / resolutionMs);
    const key = `rate.limit.${baseKey}.${bucket}`;
    const count = await this.get(key);
    if (count > limit) { throw new RateLimitError(`rate limit exceeded: ${limit} per ${resolutionMs}ms`) }
    return await this.incr(key, resolutionMs);
  }

  async incr(key: string, expireMs = 0): Promise<any> {
    return this.client.multi().incr(key).expire(key, expireMs / 1000).exec();
  }

  /**
   * Get the Redis client, creating it if needed.
   */
  get client(): RedisClientType {
    return this._client as RedisClientType;
  }

  get config(): RedisClientOptions {
    return {
      socket: {
        host: Config.get("redis.host", "localhost"),
        port: Config.get("redis.port", 6379),
        reconnectStrategy: (retries: number): number | Error => {
          logger.warn(`redis retries: ${retries}`);
          if (retries > Config.get("redis.retry.max_attempts", 10)) {
            logger.fatal("redis reconnect failed.");
            return new Error("could not reconnect");
          }
          const baseSleepMs = EnglishMs.ms(Config.get("redis.retry.base_sleep_time", "1s"));
          return Math.min(Math.pow(2, retries) * baseSleepMs, EnglishMs.ms(Config.get("redis.retry.max_sleep_time", "1m")));
        }
      },
      password: Config.get("redis.password"),
      database: Config.get("redis.db", 0)
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
