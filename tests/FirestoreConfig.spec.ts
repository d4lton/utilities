/**
 * Copyright ©2022 Dana Basken
 */

import firebase from "fiery-firebase-memory";
import app from "firebase/app";
import {FirestoreConfig} from "../src";

describe("FirestoreConfig", function() {

  const globalValues: any = {
    "*:name": "lerxst",
    "test:location_coordinates_longitude": 1.2
  };

  const platformValues: any = {
    "*:redis_host": "localhost",
    "*:location_coordinates_longitude": 1.2,
    "*:redis_db": 0,
    "test:redis_host": "test-redis.example.com"
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
    expect(FirestoreConfig.get("location_coordinates_longitude")).toEqual(1.2);
  });

  it("get() should return correct platform values", async () => {
    expect(FirestoreConfig.get("redis_host")).toEqual("test-redis.example.com");
    expect(FirestoreConfig.get("redis_db")).toEqual(0);
  });

  it("set() should trigger event", async () => {
    FirestoreConfig.addEventListener("change.age", () => {
      expect(FirestoreConfig.get("age")).toBe(21);
    });
    const document = await firebase.firestore().collection(FirestoreConfig.DEFAULT_CONFIG_COLLECTION).doc(FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT).get();
    expect(document.exists).toBeTruthy();
    const entries = document.data();
    entries.age = 21;
    await firebase.firestore().collection(FirestoreConfig.DEFAULT_CONFIG_COLLECTION).doc(FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT).set(entries);
  });

});
