import { sniffImageType } from "./image-sniff";

describe("sniffImageType — SEC-10, type checked by content not extension", () => {
  it("recognises a JPEG by its magic bytes", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(sniffImageType(buf)).toEqual({ mimeType: "image/jpeg", extension: "jpg" });
  });

  it("recognises a PNG by its magic bytes", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    expect(sniffImageType(buf)).toEqual({ mimeType: "image/png", extension: "png" });
  });

  it("recognises a WEBP by its RIFF/WEBP markers", () => {
    const buf = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from("WEBP", "ascii"),
    ]);
    expect(sniffImageType(buf)).toEqual({ mimeType: "image/webp", extension: "webp" });
  });

  it("refuses a file whose extension claims to be an image but whose bytes don't match", () => {
    const fakeImage = Buffer.from("<script>alert(1)</script>", "ascii");
    expect(sniffImageType(fakeImage)).toBeNull();
  });

  it("refuses an empty buffer", () => {
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
  });
});
