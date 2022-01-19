/**
 * Copyright ©2021 Dana Basken
 */

import {assert} from "chai";
import {EnglishMs} from "../EnglishMs";

describe("EnglishMs", function() {

  it("getTimeframeMs() should return correct values", () => {
    assert.equal(EnglishMs.getTimeframeMs("s"), 1000);
    assert.equal(EnglishMs.getTimeframeMs("m"), 60000);
    assert.equal(EnglishMs.getTimeframeMs("h"), 3600000);
    assert.equal(EnglishMs.getTimeframeMs("d"), 86400000);
    assert.equal(EnglishMs.getTimeframeMs("w"), 604800000);
  });

  it("ms() should return correct values", () => {
    assert.equal(EnglishMs.ms("1s"), 1000);
    assert.equal(EnglishMs.ms("3s"), 3000);
    assert.equal(EnglishMs.ms("-1s"), -1000);
    assert.equal(EnglishMs.ms("1m"), 60000);
    assert.equal(EnglishMs.ms("5m"), 300000);
    assert.equal(EnglishMs.ms("1h"), 3600000);
    assert.equal(EnglishMs.ms("1d"), 86400000);
    assert.equal(EnglishMs.ms("2d"), 172800000);
    assert.equal(EnglishMs.ms("-2d"), -172800000);
    assert.equal(EnglishMs.ms("10w"), 6048000000);
  });

  it("fuzzedMs() should return reasonable values", () => {
    const timeframe = "10m";
    const percent = 0.1;
    const ms = EnglishMs.ms(timeframe);
    const delta = (ms * percent) / 2;
    const fuzzedMs = EnglishMs.fuzzedMs(timeframe, percent);
    assert.isAbove(fuzzedMs, ms - delta - 1);
    assert.isBelow(fuzzedMs, ms + delta + 1);
  });

});
