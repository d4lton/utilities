/**
 * Copyright ©2021 Dana Basken
 */

import {Redis} from "../src";

describe("Redis", function() {

  it("delayed queue", async () => {
    const now = Date.now();
    const redis = new Redis();
    await redis.start();
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

});
