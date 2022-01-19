/**
 * Copyright ©2022 Dana Basken
 */

import fs from "fs";
import path from "path";

export class Package {

  private _package: any = undefined;
  private _path?: string;

  get name() { return this.package?.name }
  get description() { return this.package?.description }
  get version() { return this.package?.version }
  get commit() { return this.package?.commit }

  findPackageJson(dir?: string): string | undefined {
    if (!dir) { dir = process.cwd() }
    const file = fs.readdirSync(dir).find(file => file === "package.json");
    if (file) { return path.join(dir, file) }
    const parent = path.dirname(dir);
    if (parent?.length > 0) { return this.findPackageJson(parent) }
    return undefined;
  }

  get package() {
    if (!this._package) {
      this._path = this.findPackageJson();
      if (this._path) {
        try {
          this._package = JSON.parse(fs.readFileSync(this._path).toString());
        } catch (error: any) {
          console.error(error.message);
        }
      }
    }
    return this._package;
  }

}
