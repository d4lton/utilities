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

  getActualWorkingDirectory(): string {
    const binaryPath = process.argv[1];
    const binaryDir = path.dirname(binaryPath);
    const stats = fs.lstatSync(binaryPath);
    if (stats.isSymbolicLink()) {
      const symbolicLinkDir = path.dirname(fs.readlinkSync(binaryPath));
      return path.resolve(binaryDir, symbolicLinkDir);
    } else {
      return binaryDir;
    }
  }

  findPackageJson(dir?: string): string | undefined {
    if (!dir) { dir = this.getActualWorkingDirectory(); }
    const file = fs.readdirSync(dir).find(file => file === "package.json");
    if (file) { return path.join(dir, file) }
    const parent = path.dirname(dir);
    if (parent?.length > 0 && parent !== "/") { return this.findPackageJson(parent) }
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
