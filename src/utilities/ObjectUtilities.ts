/**
 * Copyright ©2021-2022 Dana Basken
 */

import {Utilities} from "../";

export class ObjectUtilities {

  /**
   * Get a dot-separated key from an object. If not found, return defaultValue.
   */
  static getDottedKeyValue(key: string, object: any, defaultValue?: any): any {
    if (Utilities.isEmpty(key)) { return defaultValue }
    if (!Utilities.isObject(object)) { return defaultValue }
    const parts = key.split(".");
    let result = object;
    parts.forEach(part => {
      try {
        result = result[part];
      } catch (error) {
        result = undefined;
      }
    });
    return Utilities.isSet(result) ? result : defaultValue;
  }

  /**
   * Set a dot-separated key's value into an object.
   */
  static setDottedKeyValue(key: string, value: any, object: any) {
    if (Utilities.isEmpty(key) || !Utilities.isObject(object)) { return }
    const parts = key.split(".");
    let data = object;
    parts.forEach((part, index) => {
      if (!data[part]) { data[part] = {} }
      if (index < parts.length - 1) { data = data[part] } else { data[part] = value }
    });
  }

  /**
   * Get all the keys for an object as an array of dot-separated strings.
   */
  static getKeysDeep(object: any, parent?: any): Array<any> {
    if (Utilities.isObject(object)) {
      return Object.keys(object).map(key => {
        return ObjectUtilities.getKeysDeep(object[key], `${parent ? parent + '.' : ''}${key}`);
      }).flat();
    }
    return parent;
  }

}
