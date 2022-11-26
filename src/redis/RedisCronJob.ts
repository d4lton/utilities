/**
 * Copyright ©2021 Dana Basken
 */

import log4js from "log4js";
import {Redis} from "./Redis";

/**
 * A single component of a CRON expression.
 */
export interface CronTime {
  wildcard: boolean;
  values: string[];
}

/**
 * The definition of a standard CRON expression.
 */
export interface CronExpression {
  minute: CronTime;
  hour: CronTime;
  date: CronTime;
  month: CronTime;
  day: CronTime;
}

export interface CronJobOptions {
  serial: boolean;
}

const logger = log4js.getLogger("CronJob");

/**
 * perform a periodic task with 1 minute resolution
 * can be parallel or serial using redis locking
 */
export abstract class RedisCronJob {

  private static MINUTE_MS = 60000;
  private static LOCK_TTL_MS = 45000;

  private _interval?: any;
  private _lastMinute: number = 0;
  private _redis: Redis;

  /**
   * @param expression
   * @param options
   */
  protected constructor(
    public expression: CronExpression,
    public options: CronJobOptions = {serial: true}
  ) {
    this._redis = Redis.shared;
  }

  start(): void {
    this._interval = setInterval(async () => {
      const now = new Date();
      const minute = Math.floor(now.getTime() / RedisCronJob.MINUTE_MS);
      if (!this._lastMinute) { this._lastMinute = minute }
      if (minute > this._lastMinute && this._canRun(now)) {
        this._lastMinute = minute;
        try {
          if (this.options.serial) {
            if (this._redis.connected) {
              const lock = await this._redis.getLock(`cronjob.${this.constructor.name}`, false, RedisCronJob.LOCK_TTL_MS);
              if (lock) { this.run(now) }
            }
          } else {
            this.run(now);
          }
        } catch (error: any) {
          logger.error(error.message);
        }
      }
    }, 1000);
  }

  stop(): void {
    clearInterval(this._interval);
    this._redis.stop();
  }

  abstract run(now: Date): void;

  private _canRun(now: Date): boolean {
    if (!this.expression.minute.wildcard && !this.expression.minute.values.includes(`${now.getMinutes()}`)) { return false }
    if (!this.expression.hour.wildcard && !this.expression.hour.values.includes(`${now.getHours()}`)) { return false }
    if (!this.expression.date.wildcard && !this.expression.date.values.includes(`${now.getDate()}`)) { return false }
    if (!this.expression.month.wildcard && !this.expression.month.values.includes(`${now.getMonth()}`)) { return false }
    if (!this.expression.day.wildcard && !this.expression.day.values.includes(`${now.getDay()}`)) { return false }
    return true;
  }

  static get always(): CronExpression {
    return {
      minute: {wildcard: true, values: []},
      hour: {wildcard: true, values: []},
      date: {wildcard: true, values: []},
      month: {wildcard: true, values: []},
      day: {wildcard: true, values: []}
    };
  }

  static fromCronString(cron: string): CronExpression {
    const matches = cron.match(/^([*0-9/\-,]+)\s+([*0-9/\-,]+)\s+([*0-9/\-,]+)\s+([*0-9/\-,]+)\s+([*0-9/\-,]+)$/);
    if (!matches) { throw new Error(`invalid cron: '${cron}'`) }
    return {
      minute: RedisCronJob._parseCronTimeValue(matches[1], 0, 60),
      hour: RedisCronJob._parseCronTimeValue(matches[2], 0, 23),
      date: RedisCronJob._parseCronTimeValue(matches[3], 1, 31),
      month: RedisCronJob._parseCronTimeValue(matches[4], 0, 11),
      day: RedisCronJob._parseCronTimeValue(matches[5], 0, 6)
    };
  }

  private static _parseCronTimeValue(pattern: string, minValue: number, maxValue: number): any {
    if (pattern === "*") { return {wildcard: true, values: []} }
    const map = pattern
      .split(",")
      .map(it => {
        const matches = it.match(/\*\/(\d+)/);
        if (!matches) { return it }
        const interval = parseInt(matches[1]);
        if (interval < 1 || interval > maxValue) { throw new Error(`unexpected value: ${it}`) }
        return [...Array(Math.round(maxValue / interval)).keys()].map(it => `${it * interval}`);
      })
      .flat()
      .map((it: string) => {
        const matches = it.match(/(\d+)-(\d+)/);
        if (!matches) { return it }
        const start = parseInt(matches[1]);
        const end = parseInt(matches[2]);
        if (start < minValue || end <= start || end > maxValue) { throw new Error(`unexpected value: ${it}`) }
        return [...Array(end - start + 1).keys()].map(it => `${it + start}`);
      })
      .flat()
      .reduce((values, value) => {
        return {...values, [value]: true}
      }, {});
    const values = Object.keys(map);
    return {wildcard: values.length === 0, values: Object.keys(map)};
  }

}
