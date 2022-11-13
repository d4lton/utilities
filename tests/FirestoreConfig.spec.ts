/**
 * Copyright ©2022 Dana Basken
 */

import firebase from "fiery-firebase-memory";
import app from "firebase/app";
import {FirestoreConfig} from "../src";

describe("FirestoreConfig", function() {

  const globalValues: any = {
    "name": "lerxst",
    "location_coordinates_longitude": 1.2,
    "location": {
      "name": "elbonia"
    }
  };

  const platformValues: any = {
    "redis_host": "localhost",
    "location_coordinates_longitude": 2.1,
    "redis_db": 0
  };

  beforeAll(async () => {
    firebase.initializeApp({});
  });

  beforeEach(async () => {
    await firebase.firestore().collection(FirestoreConfig.DEFAULT_CONFIG_COLLECTION).doc(FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT).set(globalValues);
    const collection = `${FirestoreConfig.DEFAULT_CONFIG_COLLECTION}/${FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT}/${FirestoreConfig.DEFAULT_PLATFORM_COLLECTION}`;
    await firebase.firestore().collection(collection).doc("unit-test").set(platformValues);
    const firestore = (firebase.firestore() as unknown) as app.firestore.Firestore; // coerce mock Firestore to real Firestore
    await FirestoreConfig.start(firestore, {platform: "unit-test"});
  });

  it("get() should return correct values", async () => {
    expect(FirestoreConfig.get("name")).toEqual("lerxst");
    expect(FirestoreConfig.get("location_coordinates_longitude")).toEqual(2.1);
  });

  it("get() should return correct platform values", async () => {
    expect(FirestoreConfig.get("redis_host")).toEqual("localhost");
    expect(FirestoreConfig.get("redis_db")).toEqual(0);
  });

  it("set() should trigger event", async () => {
    FirestoreConfig.addEventListener("change.location.name", (event: any) => {
      expect(FirestoreConfig.get("location.name")).toBe("mars colony one");
    });
    const document = await firebase.firestore().collection(FirestoreConfig.DEFAULT_CONFIG_COLLECTION).doc(FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT).get();
    expect(document.exists).toBeTruthy();
    const entries = document.data();
    entries.location.name = "mars colony one";
    await firebase.firestore().collection(FirestoreConfig.DEFAULT_CONFIG_COLLECTION).doc(FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT).set(entries);
  });

});
