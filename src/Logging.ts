/**
 * Copyright ©2021-2022 Dana Basken
 */

import log4js from "log4js";
import {Config} from "./";

export class Logging {

  static channel?: string;

  static initializeLogging(channel?: string) {
    if (channel) { Logging.channel = channel }

    const level = Config.get("logger.root.level", "trace");

    const appenders: any = {
      stdout: {
        type: "stdout",
        layout: {
          type: "pattern",
          pattern: Config.get("logger.stdout.format", "%d [%p] [%c-%z] %m")
        }
      },
    };

    if (Config.get("logger.redis.host")) {
      appenders.redis = {
        type: "@log4js-node/redis",
        host: Config.get("logger.redis.host"),
        port: Config.get("logger.redis.port", 6379),
        pass: Config.get("logger.redis.pass"),
        channel: `${Config.get("logger.redis.prefix", "logs")}.${Logging.channel || "default"}`,
        layout: {
          type: "pattern",
          pattern: Config.get("logger.redis.pattern", "%d [%p] [%h] [%c-%z] %m")
        }
      }
    }

    const appenderNames = Object.keys(appenders);
    const levels: any = Config.get("logger.levels", {});
    const categories: any = Object.keys(levels).reduce((categories: any, category: any) => {
      return {...categories, [category]: {appenders: appenderNames, level: levels[category]}};
    }, {default: {appenders: appenderNames, level: level}});

    log4js.configure({appenders: appenders, categories: categories});
  }

}
