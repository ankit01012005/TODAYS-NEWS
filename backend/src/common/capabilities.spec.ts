import { roleHasCapability } from "./capabilities";

describe("roleHasCapability", () => {
  it("gives editors the article-authoring capabilities", () => {
    expect(roleHasCapability("EDITOR", "article:create")).toBe(true);
    expect(roleHasCapability("EDITOR", "article:submit")).toBe(true);
    expect(roleHasCapability("EDITOR", "source:create")).toBe(true);
  });

  it("never gives editors a review:* capability — BR-05, by construction", () => {
    expect(roleHasCapability("EDITOR", "review:publish")).toBe(false);
    expect(roleHasCapability("EDITOR", "review:approve")).toBe(false);
    expect(roleHasCapability("EDITOR", "review:reject")).toBe(false);
    expect(roleHasCapability("EDITOR", "review:request-changes")).toBe(false);
  });

  it("never gives editors user or category management", () => {
    expect(roleHasCapability("EDITOR", "user:manage")).toBe(false);
    expect(roleHasCapability("EDITOR", "category:manage")).toBe(false);
  });

  it("gives admins the review and management capabilities", () => {
    expect(roleHasCapability("ADMIN", "article:view-any")).toBe(true);
    expect(roleHasCapability("ADMIN", "review:publish")).toBe(true);
    expect(roleHasCapability("ADMIN", "user:manage")).toBe(true);
    expect(roleHasCapability("ADMIN", "audit:view")).toBe(true);
  });

  it("never gives admins an authoring capability — the split is strict, not a hierarchy", () => {
    expect(roleHasCapability("ADMIN", "article:create")).toBe(false);
    expect(roleHasCapability("ADMIN", "article:save")).toBe(false);
    expect(roleHasCapability("ADMIN", "article:submit")).toBe(false);
    expect(roleHasCapability("ADMIN", "article:withdraw")).toBe(false);
    expect(roleHasCapability("ADMIN", "article:correct")).toBe(false);
    expect(roleHasCapability("ADMIN", "source:create")).toBe(false);
    expect(roleHasCapability("ADMIN", "media:upload")).toBe(false);
  });
});
