/**
 * Copyright ©2021 Dana Basken
 */

import assert from "assert";
import {Utilities} from "../Utilities";

describe("Utilities", function() {

  it("isSet() should detect null and undefined", () => {
    assert.equal(Utilities.isSet(null), false);
    assert.equal(Utilities.isSet(undefined), false);
  });

  it("isSet() should detect values", () => {
    assert.equal(Utilities.isSet(1), true);
    assert.equal(Utilities.isSet(""), true);
    assert.equal(Utilities.isSet({}), true);
    assert.equal(Utilities.isSet({name: "test"}), true);
    assert.equal(Utilities.isSet([]), true);
    assert.equal(Utilities.isSet([1, "two"]), true);
    assert.equal(Utilities.isSet(true), true);
  });

  it("isEmpty should detect values", () => {
    assert.equal(Utilities.isEmpty(""), true);
    assert.equal(Utilities.isEmpty("hi"), false);
    assert.equal(Utilities.isEmpty([]), true);
    assert.equal(Utilities.isEmpty([1]), false);
    assert.equal(Utilities.isEmpty({}), true);
    assert.equal(Utilities.isEmpty({name: "test"}), false);
  });

  it("isObject should detect objects", () => {
    assert.equal(Utilities.isObject(null), false);
    assert.equal(Utilities.isObject(undefined), false);
    assert.equal(Utilities.isObject(1), false);
    assert.equal(Utilities.isObject(""), false);
    assert.equal(Utilities.isObject("hi"), false);
    assert.equal(Utilities.isObject([]), false);
    assert.equal(Utilities.isObject([1]), false);
    assert.equal(Utilities.isObject({}), true);
    assert.equal(Utilities.isObject({name: "test"}), true);
  });

  it("trimFloat should work as expected", () => {
    assert.equal(Utilities.trimFloat(12.5, 2), 12.5);
    assert.equal(Utilities.trimFloat("12.5", 2), 12.5);
    assert.equal(Utilities.trimFloat(3.14159236535897, 3), 3.142);
    assert.equal(Utilities.trimFloat("3.14159236535897", 3), 3.142);
  });

  it("sleep works as expected", async () => {
    const durationMs = 200;
    const startMs = Date.now();
    await Utilities.sleep(durationMs);
    const elapsedMs = Date.now() - startMs;
    assert(elapsedMs >= durationMs);
  });

});
