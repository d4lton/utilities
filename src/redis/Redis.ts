/**
 * Copyright ©2021 Dana Basken
 */

import os from "os";
import log4js from "log4js";
import {createClient, RedisClientType} from "redis";
import {RedisClientOptions} from "@redis/client";
import {EnglishMs, Utilities, RateLimitError, FirestoreConfig} from "../index";

const logger = log4js.getLogger("Redis");

export type RedisSubscriptionCallback = (message: any, topic: string) => void;

export type RedisSubscription = {
  id: number;
  topic: string;
  callback: RedisSubscriptionCallback;
}

export type RedisSubscriptionMap = {
  [key: string]: RedisSubscription[];
}

export class Redis {

  private static LOCK_ID = 0;
  private static _hostname?: string;
  private static SUBSCRIPTION_ID = 0;
  private static _subscriber: RedisClientType;
  private static _subscriptions: RedisSubscriptionMap = {};

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
   */
  async get(key: string): Promise<any> {
    return this.client.get(key);
  }

  /**
   * Set the value for a key.
   * @param key
   * @param value
   * @param timeoutMs If specified, what the expire timeout should be
   * @param exclusive If specified, only set if the key doesn't exist
   * @returns The Redis result from setting the key
   */
  async set(key: string, value: any, timeoutMs = 0, exclusive = false): Promise<any> {
    value = typeof value === "object" ? JSON.stringify(value) : value;
    const options: any = {};
    if (timeoutMs) { options.PX = timeoutMs; }
    if (exclusive) { options.NX = true; }
    return this.client.set(key, value, options);
  }

  /**
   * Push a value onto the given list key.
   * @param key
   * @param value
   */
  async lpush(key: string, value: any): Promise<any> {
    return this.client.lPush(key, value);
  }

  /**
   * Pop value(s) off the given list key.
   * @param key
   * @param count
   */
  async rpop(key: string, count?: number): Promise<any> {
    if (count) {
      return this.client.rPopCount(key, count);
    } else {
      return this.client.rPop(key);
    }
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
   * @param key
   * @param value
   * @returns The Redis result of adding the value
   */
  async sadd(key: string, value: any): Promise<any> {
    value = typeof value === "object" ? JSON.stringify(value) : value;
    return this.client.sAdd(key, value);
  }

  /**
   * Remove a random value from a Set.
   * @param key
   * @returns The value
   */
  async spop(key: string): Promise<any> {
    return this.client.sPop(key);
  }

  /**
   * Remove a value from a Set.
   * @param key
   * @param value
   * @returns The Redis result of removing the value
   */
  async srem(key: string, value: any): Promise<any> {
    value = typeof value === "object" ? JSON.stringify(value) : value;
    return this.client.sRem(key, value);
  }

  /**
   * Get all values from a Set.
   * @param key
   * @returns The values
   */
  async smembers(key: string): Promise<any> {
    return this.client.sMembers(key);
  }

  /**
   * Get the number of keys in a Set (aka the Set length).
   * @param key
   * @returns The number of keys
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
   * @param key
   * @returns The Redis result of deleting the key
   */
  async del(key: string): Promise<any> {
    return this.client.del(key);
  }

  /**
   * Get the time-to-live remaining for a key, if any.
   * @param key
   * @returns The remaining TTL, or -1 if no TTL, -2 if key not found
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Get keys matching a pattern.
   * @param pattern
   * @returns An array of keys matching the pattern
   */
  async keys(pattern: string): Promise<any> {
    return this.client.keys(pattern);
  }

  /**
   * Subscribe to an event.
   * @param topic
   * @param callback The callback function
   * @returns The RedisSubscription
   */
  async subscribe(topic: string, callback: RedisSubscriptionCallback): Promise<RedisSubscription> {
    logger.trace(`Subscribing to "${topic}"`);
    if (!Redis._subscriber) {
      logger.trace(`Creating subscriber`);
      Redis._subscriber = createClient(this.config) as RedisClientType;
      await Redis._subscriber.connect();
    }
    if (!Redis._subscriptions[topic]) {
      logger.trace(`Adding subscription to "${topic}"`);
      Redis._subscriptions[topic] = [];
      await Redis._subscriber.subscribe(topic, Redis._onMessage);
    }
    const subscription: RedisSubscription = {topic: topic, id: Redis.SUBSCRIPTION_ID++, callback: callback};
    Redis._subscriptions[topic].push(subscription);
    return subscription;
  }

  private static async _onMessage(message: any, topic: string): Promise<void> {
    logger.trace(`_onMessage(${JSON.stringify(message)}, "${topic}")`);
    const subscriptions = Redis._subscriptions[topic];
    if (subscriptions) {
      for (const subscription of subscriptions) {
        subscription.callback(message, topic);
      }
    } else {
      logger.warn(`Received message for topic "${topic}", but no subscribers`);
    }
  }

  async unsubscribe(subscription: RedisSubscription): Promise<void> {
    logger.trace(`Unsubscribe from topic "${subscription.topic}"`);
    const subscriptions = Redis._subscriptions[subscription.topic];
    if (!subscriptions) {
      logger.warn(`Subscriptions not found for topic "${subscription.topic}"`);
      return;
    }
    Redis._subscriptions[subscription.topic] = Redis._subscriptions[subscription.topic].filter(it =>it.id !== subscription.id);
    if (!Redis._subscriptions[subscription.topic].length) {
      logger.trace(`No more subscriptions for topic "${subscription.topic}"`);
      delete Redis._subscriptions[subscription.topic];
      await Redis._subscriber.unsubscribe(subscription.topic);
    }
    if (Utilities.isEmpty(Redis._subscriptions)) {
      logger.trace(`No more subscriptions`);
      await Redis._subscriber.disconnect();
      Redis._subscriber = undefined;
    }
  }

  /**
   * Publish an event
   * @param topic
   * @param message
   */
  async publish(topic: string, message: string | object): Promise<void> {
    message = typeof message === "object" ? JSON.stringify(message) : message;
    await this.client.publish(topic, message);
  }

  /**
   * Get a lock for a key.
   * @param key The key, will be used to form the lock key
   * @param wait Wait to obtain the lock, or simply just try and return
   * @param timeoutMs How long to wait for the lock before failing
   * @param retrySleepMs How long to sleep in between attempts to lock
   * @returns Lock object (key/value), or undefined
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
   * @param lock The lock obtained from getLock()
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
   * @param key
   * @param expireMs The time-to-live for the cached value
   * @param waitMs How long to wait to obtain lock
   * @param closure The function to call to generate the cache value
   * @returns The cached value
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

  get connected(): boolean {
    return this._client.isOpen;
  }

  get config(): RedisClientOptions {
    const host = FirestoreConfig.get("redis.host", "localhost");
    const port = FirestoreConfig.get("redis.port", 6379);
    logger.trace(`Redis configured for ${host}:${port}`);
    return {
      socket: {
        host: host,
        port: port,
        reconnectStrategy: (retries: number): number | Error => {
          logger.warn(`redis retries: ${retries}`);
          if (retries > FirestoreConfig.get("redis.retry.max_attempts", 10)) {
            logger.fatal("redis reconnect failed.");
            return new Error("could not reconnect");
          }
          const baseSleepMs = EnglishMs.ms(FirestoreConfig.get("redis.retry.base_sleep_time", "1s"));
          return Math.min(Math.pow(2, retries) * baseSleepMs, EnglishMs.ms(FirestoreConfig.get("redis.retry.max_sleep_time", "1m")));
        }
      },
      password: FirestoreConfig.get("redis.password"),
      database: FirestoreConfig.get("redis.db", 0)
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
