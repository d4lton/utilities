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

  it("should handle stopping of shared Redis instance gracefully", async() => {
    const redis1 = Redis.shared;
    const redis2 = Redis.shared;
    await redis1.stop();
    await redis2.stop();
  });

});
