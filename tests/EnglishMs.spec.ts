/**
 * Copyright ©2022 Dana Basken
 */

import {EnglishMs} from "../src";

describe("EnglishMs", function() {

  it("getTimeframeMs() should return correct values", () => {
    expect(EnglishMs.getTimeframeMs("s")).toEqual(1000);
    expect(EnglishMs.getTimeframeMs("m")).toEqual(60000);
    expect(EnglishMs.getTimeframeMs("h")).toEqual(3600000);
    expect(EnglishMs.getTimeframeMs("d")).toEqual(86400000);
    expect(EnglishMs.getTimeframeMs("w")).toEqual(604800000);
  });

  it("ms() should return correct values", () => {
    expect(EnglishMs.ms("1s")).toEqual(1000);
    expect(EnglishMs.ms("3s")).toEqual(3000);
    expect(EnglishMs.ms("-1s")).toEqual(-1000);
    expect(EnglishMs.ms("1m")).toEqual(60000);
    expect(EnglishMs.ms("5m")).toEqual(300000);
    expect(EnglishMs.ms("1h")).toEqual(3600000);
    expect(EnglishMs.ms("1d")).toEqual(86400000);
    expect(EnglishMs.ms("2d")).toEqual(172800000);
    expect(EnglishMs.ms("-2d")).toEqual(-172800000);
    expect(EnglishMs.ms("10w")).toEqual(6048000000);
  });

  it("fuzzedMs() should return reasonable values", () => {
    const timeframe = "10m";
    const percent = 0.1;
    const ms = EnglishMs.ms(timeframe);
    const delta = (ms * percent) / 2;
    const fuzzedMs = EnglishMs.fuzzedMs(timeframe, percent);
    expect(fuzzedMs).toBeGreaterThan(ms - delta - 1);
    expect(fuzzedMs).toBeLessThan(ms + delta + 1);
  });

});
