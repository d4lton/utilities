/**
 * Copyright ©2021-2022 Dana Basken
 */

export class EnglishMs {

  /**
   * Get milliseconds from a simple english string that consists of an optional sign (+/-), a decimal value, an a
   * timeframe indicator of s, m, h, d, w for seconds, minutes, hours, days, week. Example: "2w" for 2 weeks.
   */
  static ms(time: string): number {
    const matches = time.match(/([+-]*)(\d+)([smhdw])/);
    if (!matches) { throw new Error(`time string of '${time}' is not understood`) }
    const sign: string = matches[1] || "+";
    const timeframeCount: number = parseFloat(matches[2]);
    const timeframe: string = matches[3];
    const timeframeMs: number = EnglishMs.getTimeframeMs(timeframe);
    const totalMs: number = timeframeMs * timeframeCount;
    return sign === "+" ? totalMs : -totalMs;
  }

  /**
   * Get milliseconds from a simple english string and then increase or reduce that amount by a "fuzz" percentage.
   * The percent is a fraction, so 0.25 represents 25%. See EnglishMs.ms().
   */
  static fuzzedMs(time: string, percent: number): number {
    const baseMs = EnglishMs.ms(time);
    const fuzzMs = baseMs * percent;
    return baseMs + Math.ceil((Math.random() * fuzzMs) - (fuzzMs / 2.0));
  }

  /**
   * Get the number of milliseconds for a simple english string's timeframe. See EnglishMs.ms().
   */
  static getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case "s": return 1000;
      case "m": return 60000;
      case "h": return 3600000;
      case "d": return 86400000;
      case "w": return 604800000;
      default: throw new Error(`unknown timeframe: '${timeframe}'`);
    }
  }

}
