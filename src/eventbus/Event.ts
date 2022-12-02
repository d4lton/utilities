/**
 * Copyright ©2022 Dana Basken
 */

import os from "node:os";

export class Event {

  hostname: string;
  pid: number;

  constructor(public type: string) {
    this.hostname = os.hostname();
    this.pid = process.pid;
  }

}
