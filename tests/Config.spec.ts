/**
 * Copyright ©2022 Dana Basken
 */

import {Config, ConfigKeyChangeEvent} from "../src";

describe("Config", function() {

  const entries: any = {
    name: "lerxst",
    location: {
      country: "wakanda",
      coordinates: {
        longitude: 1.2,
        latitude: 2.1
      }
    }
  }

  beforeEach(() => {
    Config.reset();
  });

  it("get() should return correct values", () => {
    Config.load(entries);
    expect(Config.get("name")).toEqual("lerxst");
    expect(Config.get("location.coordinates.longitude")).toEqual(1.2);
  });

  it("set() should set correct values", () => {
    Config.load(entries);
    Config.set("age", 21);
    expect(Config.get("age")).toEqual(21);
    Config.set("location.country", "elbonia");
    expect(Config.get("location.country")).toEqual("elbonia");
  });

  it("set() should trigger event", (done) => {
    Config.addEventListener("change.age", () => {
      expect(Config.get("age")).toBe(21);
      done();
    });
    Config.load(entries);
    Config.set("age", 21);
  });

});
