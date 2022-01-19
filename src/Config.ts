/**
 * Copyright ©2021-2022 Dana Basken
 */

import fs from "fs";
import {ObjectUtilities} from "./ObjectUtilities";

export class Config {

  static entries: any = {};

  /**
   * Load config values from a JSON file.
   * @param file {String}
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
   * Set a key's value.
   */
  static set(key: string, value: any): void {
    ObjectUtilities.setDottedKeyValue(key, value, Config.entries);
  }

  /**
   * Get a key's value.
   */
  static get(key: string, defaultValue?: any): any {
    return ObjectUtilities.getDottedKeyValue(key, Config.entries, defaultValue);
  }

}
