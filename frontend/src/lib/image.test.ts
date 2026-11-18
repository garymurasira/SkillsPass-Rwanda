import { describe, expect, it } from "vitest";
import { prepareImage } from "./image";

describe("prepareImage", () => {
  it("returns the original file when the browser can't process images (the server then handles it)", async () => {
    const file = new File(["pixels"], "work.jpg", { type: "image/jpeg" });
    expect(await prepareImage(file)).toBe(file); // jsdom has no createImageBitmap
  });
});
