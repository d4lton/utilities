import {Package} from "../src";

describe("Package", function() {

  it("get() should return correct values", () => {
    const pkg = new Package();
    expect(pkg.name).not.toBeUndefined();
  });

});
