/**
 * Copyright ©2021 Dana Basken
 */

import {Redis} from "../src";

describe("Redis", function() {

  it("should find entries in priority queue correctly", async () => {
    const now = Date.now();
    const redis = Redis.shared;
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
    await redis.stop();
    expect(count).toBe(2);
  });

  it("should handle stopping of shared Redis instance gracefully", async () => {
    const redis1 = Redis.shared;
    const redis2 = Redis.shared;
    await redis1.stop();
    await redis2.stop();
  });

  it("queue operations should work as expected", async () => {
    const redis = Redis.shared;
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
    await redis.stop();
  });

});
