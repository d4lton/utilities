/**
 * Copyright ©2021 Dana Basken
 */

import assert from "assert";
import {ObjectUtilities} from "../ObjectUtilities";

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
      }
    };
  });

  it("getDottedKeyValue() should return correct values", () => {
    assert.equal(ObjectUtilities.getDottedKeyValue("name", config), "lerxst");
    assert.equal(ObjectUtilities.getDottedKeyValue("location.coordinates.latitude", config), 2.1);
  });

  it("getDottedKeyValue() should return default value", () => {
    assert.equal(ObjectUtilities.getDottedKeyValue("age", config, 25), 25);
  });

  it("setDottedKeyValue() should set correct values", () => {
    ObjectUtilities.setDottedKeyValue("age", 21, config);
    assert.equal(ObjectUtilities.getDottedKeyValue("age", config), 21);
    ObjectUtilities.setDottedKeyValue("location.country", "elbonia", config);
    assert.equal(ObjectUtilities.getDottedKeyValue("location.country", config), "elbonia");
  });

});
