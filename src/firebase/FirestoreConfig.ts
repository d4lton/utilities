/**
 * Copyright ©2022 Dana Basken
 */

import firebase from "firebase/app";
import DocumentData = firebase.firestore.DocumentData;
import Firestore = firebase.firestore.Firestore;
import {Config, ObjectUtilities} from "../";

/**
 * Configuration for FirestoreConfig. If collection isn't defined, "config" will be used.
 * If document isn't defined, "main" will be used.
 */
export type FirestoreConfigOptions = {
  platform?: string;
  collection?: string;
  global_document?: string;
  platform_collection?: string;
};

/**
 * Generic configuration that is backed by a firestore document containing config values.
 */
export class FirestoreConfig extends Config {

  public static DEFAULT_CONFIG_COLLECTION = "configuration";
  public static DEFAULT_GLOBAL_DOCUMENT = "global";
  public static DEFAULT_PLATFORM_COLLECTION = "platforms";

  /**
   * Get the initial config values from firestore, and start a watcher to update local configs
   * when firestore changes.
   */
  static async start(firestore: Firestore, options?: FirestoreConfigOptions): Promise<void> {
    await FirestoreConfig.loadGlobalDocument(firestore, options);
    await FirestoreConfig.loadPlatformDocument(firestore, options);
  }

  static async loadGlobalDocument(firestore: Firestore, options?: FirestoreConfigOptions): Promise<void> {
    const collectionName = options?.collection || FirestoreConfig.DEFAULT_CONFIG_COLLECTION;
    const documentName = options?.global_document || FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT;
    await FirestoreConfig.loadDocument(firestore, collectionName, documentName);
  }

  static async loadPlatformDocument(firestore: Firestore, options?: FirestoreConfigOptions): Promise<void> {
    if (options?.platform) {
      const collectionName = options?.collection || FirestoreConfig.DEFAULT_CONFIG_COLLECTION;
      const globalDocumentName = options?.global_document || FirestoreConfig.DEFAULT_GLOBAL_DOCUMENT;
      const platformDocumentName = options?.platform_collection || FirestoreConfig.DEFAULT_PLATFORM_COLLECTION;
      await FirestoreConfig.loadDocument(firestore, `${collectionName}/${globalDocumentName}/${platformDocumentName}`, options.platform);
    }
  }

  static async loadDocument(firestore: Firestore, collectionName: string, documentName: string): Promise<void> {
    const document: DocumentData | undefined = await firestore.collection(collectionName).doc(documentName).get();
    if (document?.exists) {
      FirestoreConfig.updateConfigFromDocument(document);
      firestore.collection(collectionName).doc(documentName).onSnapshot(FirestoreConfig.onSnapshot);
    }
  }

  static onSnapshot(document: DocumentData): void {
    FirestoreConfig.updateConfigFromDocument(document);
  }

  /**
   * Update config keys from a firestore document.
   */
  private static updateConfigFromDocument(document?: DocumentData): void {
    if (!document?.exists) { return; }
    const data: any = document.data();
    const keys = ObjectUtilities.getKeysDeep(data);
    for (const key of keys) {
      Config.set(key, ObjectUtilities.getDottedKeyValue(key, data));
    }
  }

}
