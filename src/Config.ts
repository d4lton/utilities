/**
 * Copyright ©2021-2022 Dana Basken
 */

import fs from "fs";
import {ObjectUtilities} from "../src";

/**
 * An event indicating that any Config key has changed. Dispatched for "changed" events.
 */
export class ConfigChangeEvent extends Event {
  constructor(public key: string, public value: any, public previous: any) {
    super("change");
  }
}

/**
 * An event indicating that a specific Config key has changed. Dispatched for "changed.<key>" events.
 */
export class ConfigKeyChangeEvent extends Event {
  constructor(public key: string, public value: any, public previous: any) {
    super(`change.${key}`);
  }
}

export class Config {

  private static _eventTarget: EventTarget = new EventTarget();

  static entries: any = {};

  /**
   * Clear all config entries. Mainly used for testing.
   */
  static reset(): void {
    Config.entries = {};
  }

  /**
   * Load an arbitrary object into config.
   */
  static load(entries: any): void {
    Config.entries = Object.assign({}, Config.entries, entries);
  }

  /**
   * Load config values from a JSON file.
   */
  static loadFile(file: string) {
    try {
      const text = fs.readFileSync(file);
      const config = JSON.parse(text.toString());
      Config.entries = Object.assign({}, Config.entries, config);
    } catch (error: any) {
      console.error(error.message);
    }
  }

  /**
   * Adds an event listener to Config.
   * @param type
   * @param callback
   * @param options
   */
  static addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    this._eventTarget.addEventListener(type, callback, options);
  }

  /**
   * Removes an event listener from Config.
   * @param type
   * @param callback
   * @param options
   */
  static removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    this._eventTarget.removeEventListener(type, callback, options);
  }

  /**
   * Set a key's value.
   */
  static set(key: string, value: any): void {
    const previous = Config.get(key);
    ObjectUtilities.setDottedKeyValue(key, value, Config.entries);
    if (previous !== value) {
      Config._eventTarget.dispatchEvent(new ConfigChangeEvent(key, value, previous));
      Config._eventTarget.dispatchEvent(new ConfigKeyChangeEvent(key, value, previous));
    }
  }

  /**
   * Get a key's value.
   */
  static get(key: string, defaultValue?: any): any {
    return ObjectUtilities.getDottedKeyValue(key, Config.entries, defaultValue);
  }

}
