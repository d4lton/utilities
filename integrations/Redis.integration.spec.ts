/**
 * Copyright ©2021 Dana Basken
 */

import {Logging, Redis, RedisSubscription, Utilities} from "../src";

describe("Redis", function() {

  beforeAll(() => {
    Logging.initializeLogging();
  });

  afterAll(async () => {
    await Redis.shutdown();
  });

  it("should find entries in priority queue correctly", async () => {
    const now = Date.now();
    const redis = new Redis();
    await redis.zadd("test.delayed.queue", "one", now + 200);
    await redis.zadd("test.delayed.queue", "two", now + 250);
    let count = 0;
    for (let i = 0; i < 10; i++) {
      const then = now + (i * 50);
      const stuff: [] = await redis.zrangebyscore("test.delayed.queue", then);
      if (stuff.length) {
        for (const thing of stuff) {
          await redis.zrem("test.delayed.queue", thing);
          count++;
        }
      }
    }
    expect(count).toBe(2);
  });

  it("queue operations should work as expected", async () => {
    const redis = new Redis();
    await redis.del("test.queue");
    await redis.lpush("test.queue", "test.value.1");
    await redis.lpush("test.queue", "test.value.2");
    await redis.lpush("test.queue", "test.value.3");
    await redis.lpush("test.queue", "test.value.4");
    await redis.lpush("test.queue", "test.value.5");
    const length = await redis.llen("test.queue");
    expect(length).toBe(5);
    const value = await redis.rpop("test.queue");
    expect(value).toBe("test.value.1");
    const values = await redis.rpop("test.queue", 4);
    expect(values).toStrictEqual(["test.value.2", "test.value.3", "test.value.4", "test.value.5"]);
  });

  it("subscriptions should work as expected", async () => {
    const topic_count = 5;
    const listener_count = 3;
    const messages = {};
    const redis = new Redis();
    const subscriptions: RedisSubscription[] = [];
    for (let i = 0; i < topic_count; i++) {
      for (let j = 0; j < listener_count; j++) {
        const subscription = await redis.subscribe(`test.topic.${i}`, (message: any, topic: string) => {
          if (!messages[topic]) { messages[topic] = []; }
          messages[topic].push(message);
        });
        subscriptions.push(subscription);
      }
    }
    for (let i = 0; i < topic_count; i++) {
      await redis.publish(`test.topic.${i}`, {});
    }
    for (const subscription of subscriptions) {
      await redis.unsubscribe(subscription);
    }
    expect(Object.keys(messages).length).toBe(topic_count);
    for (const topic in messages) {
      expect(messages[topic].length).toBe(listener_count);
    }
  });

  it("pooled connection test", async () => {
    const count = 5;
    const promises: any[] = [];
    for (let i = count; i > 0; i--) {
      const promise = new Promise(async (resolve, reject) => {
        const redis = new Redis();
        const value = await redis.get("test.key");
        resolve(value);
      });
      promises.push(promise);
    }
    const results = await Promise.all(promises);
  });

});
