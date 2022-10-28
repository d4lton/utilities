/**
 * Copyright ©2021 Dana Basken
 */

import assert from "assert";
import {ObjectUtilities} from "../src/utilities/ObjectUtilities";

describe("ObjectUtilities", function() {

  let config!: any;

  beforeEach(() => {
    config = {
      name: "lerxst",
      location: {
        country: "wakanda",
        coordinates: {
          longitude: 1.2,
          latitude: 2.1
        }
      },
      heroes: [
        {
          name: "Steve Rogers",
          alias: "Captain America"
        },
        {
          name: "Tony Stark",
          alias: "Iron Man"
        }
      ]
    };
  });

  it("getDottedKeyValue() should return correct values", () => {
    assert.equal(ObjectUtilities.getDottedKeyValue("name", config), "lerxst");
    assert.equal(ObjectUtilities.getDottedKeyValue("location.coordinates.latitude", config), 2.1);
  });

  it("getDottedKeyValue() should return default value", () => {
    assert.equal(ObjectUtilities.getDottedKeyValue("age", config, 25), 25);
  });

  it("getDottedKeyValue() with array should return correct value", () => {
    expect(ObjectUtilities.getDottedKeyValue("heroes[0].name", config)).toBe("Steve Rogers");
    expect(ObjectUtilities.getDottedKeyValue("heroes[1].name", config)).toBe("Tony Stark");
    expect(ObjectUtilities.getDottedKeyValue("heroes[a].name", config)).toBeUndefined();
    expect(ObjectUtilities.getDottedKeyValue("heroes[].name", config)).toBeUndefined();
    expect(ObjectUtilities.getDottedKeyValue("heroes[12].name", config)).toBeUndefined();
    expect(ObjectUtilities.getDottedKeyValue("heroes[-12].name", config)).toBeUndefined();
  });

  it("setDottedKeyValue() should set correct values", () => {
    ObjectUtilities.setDottedKeyValue("age", 21, config);
    assert.equal(ObjectUtilities.getDottedKeyValue("age", config), 21);
    ObjectUtilities.setDottedKeyValue("location.country", "elbonia", config);
    assert.equal(ObjectUtilities.getDottedKeyValue("location.country", config), "elbonia");
  });

});
