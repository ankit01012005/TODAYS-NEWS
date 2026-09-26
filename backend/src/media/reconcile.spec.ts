jest.mock("../db", () => ({
  prisma: {
    mediaAsset: { findMany: jest.fn(), deleteMany: jest.fn() },
    articleRevision: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("./storage", () => ({ storage: { existingKeys: jest.fn() } }));
jest.mock("../common/audit", () => ({ writeAudit: jest.fn() }));

import { prisma } from "../db";
import { storage } from "./storage";
import { writeAudit } from "../common/audit";
import { reconcileWithStorage } from "./media.service";
import { ConflictError } from "../common/http-errors";
import { AuthenticatedUser } from "../common/authenticated-user";

const db = prisma as unknown as {
  mediaAsset: { findMany: jest.Mock; deleteMany: jest.Mock };
  articleRevision: { findMany: jest.Mock };
  $transaction: jest.Mock;
};
const existingKeys = storage.existingKeys as jest.Mock;
const admin = { id: "admin-1", role: "ADMIN" } as AuthenticatedUser;

function row(id: string, storageKey: string) {
  return {
    id,
    storageKey,
    url: `https://res.cloudinary.com/demo/image/upload/${storageKey}`,
    originalFilename: `${id}.jpg`,
    mimeType: "image/jpeg",
    sizeBytes: 1000,
    width: 800,
    height: 600,
    uploadedByUserId: "editor-1",
  };
}

describe("media.service reconcileWithStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(prisma));
    db.articleRevision.findMany.mockResolvedValue([]);
  });

  it("asks the provider about each row's own key, whatever folder it was uploaded under", async () => {
    const rows = [row("a", "today-news/a"), row("b", "anvay-tv/b")];
    db.mediaAsset.findMany.mockResolvedValue(rows);
    existingKeys.mockResolvedValue(new Set(["today-news/a", "anvay-tv/b"]));

    const result = await reconcileWithStorage(admin);

    expect(existingKeys).toHaveBeenCalledWith(["today-news/a", "anvay-tv/b"]);
    expect(result.removed).toEqual([]);
    expect(db.mediaAsset.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses, and removes nothing, when the provider reports every image missing", async () => {
    db.mediaAsset.findMany.mockResolvedValue([row("a", "today-news/a"), row("b", "today-news/b")]);
    existingKeys.mockResolvedValue(new Set());

    await expect(reconcileWithStorage(admin)).rejects.toThrow(ConflictError);
    expect(db.mediaAsset.deleteMany).not.toHaveBeenCalled();
  });

  it("removes only the genuinely missing rows, auditing enough to restore them", async () => {
    db.mediaAsset.findMany.mockResolvedValue([row("a", "today-news/a"), row("b", "today-news/b")]);
    existingKeys.mockResolvedValue(new Set(["today-news/a"]));
    db.articleRevision.findMany
      .mockResolvedValueOnce([]) // findProtectedUses
      .mockResolvedValueOnce([{ id: "rev-1", featuredImageId: "b" }]);

    const result = await reconcileWithStorage(admin);

    expect(result.removed.map((r) => r.id)).toEqual(["b"]);
    expect(db.mediaAsset.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["b"] } } });
    expect(writeAudit).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        action: "RECONCILE_REMOVED",
        metadata: expect.objectContaining({
          storageKey: "today-news/b",
          url: expect.any(String),
          uploadedByUserId: "editor-1",
          featuredInRevisionIds: ["rev-1"],
        }),
      }),
    );
  });
});
