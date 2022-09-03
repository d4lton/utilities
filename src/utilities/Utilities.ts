/**
 * Copyright ©2022 Dana Basken
 */

export class Utilities {

  /**
   * Pause execution for a number of milliseconds.
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve: Function) => setTimeout(() => resolve(), ms));
  }

  /**
   * Is a given value set (not null or undefined)?
   */
  static isSet(value: any): boolean {
    return value !== undefined && value !== null;
  }

  /**
   * Is a given value empty, meaning, does it have a value? For a string, this means it contains characters. For an
   * Array, this means it has at least one element. For an object, does it contain any keys? For all, it means it's
   * not null or undefined.
   * Note: for objects, only a simple object works. object instances will need their own check for "empty"
   */
  static isEmpty(value: any): boolean {
    if (!Utilities.isSet(value)) { return true; }
    if (Array.isArray(value)) { return value.length === 0; }
    if (typeof value === "string") { return value.length === 0; }
    if (Utilities.isObject(value)) { return Object.keys(value).length === 0; }
    return false;
  }

  /**
   * Is the given value an object?
   */
  static isObject(value: any): boolean {
    if (!Utilities.isSet(value)) { return false; }
    return (typeof value === "object" && !Array.isArray(value));
  }

  /**
   * Parse a float and return a fixed number of decimals, as a float.
   */
  static trimFloat(number: number | string, decimals: number): number {
    number = typeof number === "number" ? number : parseFloat(number);
    return parseFloat(number.toFixed(decimals));
  }

  /**
   * Check a value to see if it is a given type.
   */
  static isType(value: any, type: string): boolean {
    try {
      switch (type) {
        case "string":
          if (typeof value !== "string") { return false; }
          break;
        case "number":
          if (typeof value !== "number" && Number.isNaN(parseFloat(value))) { return false; }
          break;
        default:
          return true; // unknown type
      }
      return true;
    } catch (error: any) {
      return false;
    }
  }

  static get environment(): string {
    return process.env.NODE_ENV || process.env.environment;
  }

}
