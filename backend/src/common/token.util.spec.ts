import { generateOpaqueToken, hashToken } from "./token.util";

describe("token.util", () => {
  it("generates a different raw token on every call", () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a.raw).not.toEqual(b.raw);
  });

  it("hashes deterministically — the same raw value always hashes the same way", () => {
    const { raw, hash } = generateOpaqueToken();
    expect(hashToken(raw)).toEqual(hash);
  });

  it("produces a hash that reveals nothing about the raw value", () => {
    const { raw, hash } = generateOpaqueToken();
    expect(hash).not.toEqual(raw);
    expect(hash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex digest
  });
});
