/**
 * Copyright ©2022 Dana Basken
 */

import log4js from "log4js";
import {Redis} from "./Redis";

const logger = log4js.getLogger("RedisVariable");

export class RedisVariable extends EventTarget {

  private _value?: any;
  private _redis: Redis = new Redis();
  private _subscription?: any;

  constructor(public key: string, public timeoutMs: number = 0) {
    super();
    this._redis
      .start()
      .then(async () => {
        this._subscription = await this._redis.subscribe(this.key, async () => await this._updateValueFromRedis())
        await this._updateValueFromRedis();
      });
  }

  stop(): void {
    this._subscription.disconnect();
  }

  private async _updateValueFromRedis(): Promise<void> {
    let value = await this._redis.get(this.key);
    if (value !== this._value) {
      logger.trace(`value change for "${this.key}": ${JSON.stringify(this._value)} => ${JSON.stringify(value)}`);
      this._value = value;
      this.dispatchEvent(new Event("changed"));
    }
  }

  set value(value: any) {
    this._redis
      .set(this.key, value, this.timeoutMs)
      .then(() => this._redis.publish(this.key, value));
  }

  get value(): any {
    return this._value;
  }

}
