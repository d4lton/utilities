/**
 * Copyright ©2022 Dana Basken
 */

import log4js from "log4js";
import {createClient, RedisClientType} from "redis";
import {RedisClientOptions} from "@redis/client";
import {FirestoreConfig} from "../firebase/FirestoreConfig";
import {EnglishMs} from "../EnglishMs";

const logger = log4js.getLogger("RedisPool");

export type RedisPoolClient = {
  id: number;
  used: boolean;
  client: RedisClientType;
}

export class RedisPool {

  private POOL_ID = 0;

  private _clients: RedisPoolClient[] = [];

  constructor() {
  }

  async acquire(): Promise<RedisPoolClient> {
    const size = FirestoreConfig.get("redis.pool_size", 10);
    let poolClient = this._clients.find(it => !it.used);
    if (!poolClient) {
      if (this._clients.length >= size) { throw new Error(`Pool size exceeded.`); }
      const client = await RedisPool.client;
      poolClient = {id: this.POOL_ID++, used: true, client: client};
      this._clients.push(poolClient);
    }
    poolClient.used = true;
    return poolClient;
  }

  async release(poolClient: RedisPoolClient): Promise<void> {
    poolClient = this._clients.find(it => it.id === poolClient.id); // in case poolClient was modified
    poolClient.used = false;
  }

  async withClient(callback: (client: RedisClientType) => Promise<any>) {
    let poolClient: RedisPoolClient;
    try {
      poolClient = await this.acquire();
      return await callback(poolClient.client);
    } catch (error: any) {
      logger.error(error.message);
    } finally {
      await this.release(poolClient);
    }
  }

  static get client(): Promise<RedisClientType> {
    return new Promise(async (resolve, reject) => {
      const client = createClient(RedisPool.config) as RedisClientType;
      await client.connect();
      resolve(client);
    });
  }

  static get config(): RedisClientOptions {
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

  async shutdown(): Promise<void> {
    for (const poolClient of this._clients) {
      await poolClient.client.disconnect();
    }
  }

}
