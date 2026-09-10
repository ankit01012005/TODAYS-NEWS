import { AuthenticatedUser } from "../common/authenticated-user";
import { BadRequestError, ConflictError } from "../common/http-errors";

const editor: AuthenticatedUser = { id: "editor-1", email: "e@test.local", displayName: "E", role: "EDITOR" };
const admin: AuthenticatedUser = { id: "admin-1", email: "a@test.local", displayName: "A", role: "ADMIN" };

const tx = {
  article: { findUnique: jest.fn(), update: jest.fn() },
  articleRevision: {
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  reviewDecision: { create: jest.fn() },
  articleSource: { findMany: jest.fn(), createMany: jest.fn() },
  auditLog: { create: jest.fn() },
};

jest.mock("../db", () => ({
  prisma: { $transaction: (fn: (tx: unknown) => unknown) => fn(tx) },
}));

// Imported AFTER the mock above so transition.service picks it up.
import * as transitions from "./transition.service";

describe("transition.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tx.articleSource.findMany.mockResolvedValue([]);
  });

  it("submitForReview refuses an incomplete revision — BR-09", async () => {
    tx.article.findUnique.mockResolvedValue({ id: "a1", ownerId: editor.id, deletedAt: null });
    tx.articleRevision.findFirst.mockResolvedValue({
      id: "r1",
      articleId: "a1",
      state: "DRAFT",
      headline: null,
      summary: "has a summary",
      body: null,
    });

    await expect(transitions.submitForReview(editor, "a1", 0)).rejects.toThrow(BadRequestError);
    expect(tx.articleRevision.updateMany).not.toHaveBeenCalled();
  });

  it("submitForReview refuses from a non-DRAFT/CHANGES_REQUESTED state — BR-10", async () => {
    tx.article.findUnique.mockResolvedValue({ id: "a1", ownerId: editor.id, deletedAt: null });
    tx.articleRevision.findFirst.mockResolvedValue({
      id: "r1",
      articleId: "a1",
      state: "IN_REVIEW",
      headline: "h",
      summary: "s",
      body: [],
    });

    await expect(transitions.submitForReview(editor, "a1", 0)).rejects.toThrow(ConflictError);
  });

  it("submitForReview succeeds once headline/summary/body are all present", async () => {
    tx.article.findUnique.mockResolvedValue({ id: "a1", ownerId: editor.id, deletedAt: null });
    tx.articleRevision.findFirst.mockResolvedValue({
      id: "r1",
      articleId: "a1",
      state: "DRAFT",
      headline: "h",
      summary: "s",
      body: [{ type: "paragraph", content: [] }],
    });
    tx.articleRevision.updateMany.mockResolvedValue({ count: 1 });
    tx.articleRevision.findUniqueOrThrow.mockResolvedValue({ id: "r1", state: "IN_REVIEW" });

    const result = await transitions.submitForReview(editor, "a1", 0);
    expect(result.state).toBe("IN_REVIEW");
    expect(tx.articleRevision.updateMany).toHaveBeenCalledWith({
      where: { id: "r1", version: 0 },
      data: expect.objectContaining({ state: "IN_REVIEW" }),
    });
  });

  it("submitForReview refuses when the version has moved — P2-23", async () => {
    tx.article.findUnique.mockResolvedValue({ id: "a1", ownerId: editor.id, deletedAt: null });
    tx.articleRevision.findFirst.mockResolvedValue({
      id: "r1",
      articleId: "a1",
      state: "DRAFT",
      headline: "h",
      summary: "s",
      body: [],
    });
    tx.articleRevision.updateMany.mockResolvedValue({ count: 0 });

    await expect(transitions.submitForReview(editor, "a1", 5)).rejects.toThrow(ConflictError);
  });

  it("approveAndPublish archives the previously live revision before publishing the new one — I-2", async () => {
    tx.article.findUnique.mockResolvedValue({
      id: "a1",
      ownerId: editor.id,
      currentPublishedRevisionId: "old-rev",
      firstPublishedAt: new Date("2026-01-01"),
      deletedAt: null,
    });
    tx.articleRevision.findFirst.mockResolvedValue({
      id: "new-rev",
      articleId: "a1",
      state: "IN_REVIEW",
      createdByUserId: editor.id,
    });
    tx.articleRevision.updateMany.mockResolvedValue({ count: 1 });
    tx.articleRevision.findUniqueOrThrow.mockResolvedValue({ id: "new-rev", state: "PUBLISHED" });
    tx.article.update.mockResolvedValue({ id: "a1", publicationStatus: "LIVE" });

    await transitions.approveAndPublish(admin, "a1", 0);

    expect(tx.articleRevision.update).toHaveBeenCalledWith({
      where: { id: "old-rev" },
      data: expect.objectContaining({ state: "ARCHIVED" }),
    });
  });

  it("a different admin can approve and publish cleanly", async () => {
    tx.article.findUnique.mockResolvedValue({
      id: "a1",
      ownerId: editor.id,
      currentPublishedRevisionId: null,
      firstPublishedAt: null,
      deletedAt: null,
    });
    tx.articleRevision.findFirst.mockResolvedValue({
      id: "r1",
      articleId: "a1",
      state: "IN_REVIEW",
      createdByUserId: editor.id,
    });
    tx.articleRevision.updateMany.mockResolvedValue({ count: 1 });
    tx.articleRevision.findUniqueOrThrow.mockResolvedValue({ id: "r1", state: "PUBLISHED" });
    tx.article.update.mockResolvedValue({ id: "a1", publicationStatus: "LIVE" });

    const { revision } = await transitions.approveAndPublish(admin, "a1", 0);
    expect(revision.state).toBe("PUBLISHED");
    expect(tx.reviewDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ decision: "APPROVED" }) }),
    );
  });

  describe("requestChanges — docs/26 §1.4 archive+copy, not a same-row flip", () => {
    it("archives the reviewed revision rather than flipping it in place", async () => {
      tx.article.findUnique.mockResolvedValue({ id: "a1", ownerId: editor.id, deletedAt: null });
      tx.articleRevision.findFirst.mockResolvedValue({
        id: "reviewed-rev",
        articleId: "a1",
        state: "IN_REVIEW",
        createdByUserId: editor.id,
      });
      tx.articleRevision.updateMany.mockResolvedValue({ count: 1 });
      tx.articleRevision.create.mockResolvedValue({
        id: "copy-rev",
        articleId: "a1",
        state: "CHANGES_REQUESTED",
        createdByUserId: editor.id,
      });

      const result = await transitions.requestChanges(admin, "a1", 0, "Please add a source.");

      expect(tx.articleRevision.updateMany).toHaveBeenCalledWith({
        where: { id: "reviewed-rev", version: 0 },
        data: expect.objectContaining({ state: "ARCHIVED" }),
      });
      // The returned revision is the NEW copy, not the archived one.
      expect(result.id).toBe("copy-rev");
      expect(result.state).toBe("CHANGES_REQUESTED");
    });

    it("writes the ReviewDecision against the reviewed (now-archived) revision, not the copy", async () => {
      tx.article.findUnique.mockResolvedValue({ id: "a1", ownerId: editor.id, deletedAt: null });
      tx.articleRevision.findFirst.mockResolvedValue({
        id: "reviewed-rev",
        articleId: "a1",
        state: "IN_REVIEW",
        createdByUserId: editor.id,
      });
      tx.articleRevision.updateMany.mockResolvedValue({ count: 1 });
      tx.articleRevision.create.mockResolvedValue({ id: "copy-rev", state: "CHANGES_REQUESTED" });

      await transitions.requestChanges(admin, "a1", 0, "Please add a source.");

      expect(tx.reviewDecision.create).toHaveBeenCalledWith({
        data: {
          articleRevisionId: "reviewed-rev",
          decision: "CHANGES_REQUESTED",
          comment: "Please add a source.",
          decidedByUserId: admin.id,
        },
      });
    });

    it("preserves the original author on the copy — the admin sending it back is not the author", async () => {
      tx.article.findUnique.mockResolvedValue({ id: "a1", ownerId: editor.id, deletedAt: null });
      tx.articleRevision.findFirst.mockResolvedValue({
        id: "reviewed-rev",
        articleId: "a1",
        state: "IN_REVIEW",
        createdByUserId: editor.id,
      });
      tx.articleRevision.updateMany.mockResolvedValue({ count: 1 });
      tx.articleRevision.create.mockResolvedValue({ id: "copy-rev", state: "CHANGES_REQUESTED" });

      await transitions.requestChanges(admin, "a1", 0, "Please add a source.");

      expect(tx.articleRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ createdByUserId: editor.id }) }),
      );
    });
  });

  describe("copyIntoNewRevision (via startCorrection) — carries sources forward", () => {
    it("copies the source revision's ArticleSource rows onto the new one", async () => {
      tx.article.findUnique.mockResolvedValue({
        id: "a1",
        ownerId: editor.id,
        currentPublishedRevisionId: "published-rev",
        deletedAt: null,
      });
      tx.articleRevision.findUniqueOrThrow.mockResolvedValue({
        id: "published-rev",
        articleId: "a1",
        state: "PUBLISHED",
      });
      tx.articleRevision.create.mockResolvedValue({ id: "new-draft", state: "DRAFT" });
      tx.articleSource.findMany.mockResolvedValue([
        { sourceId: "src-1", position: 0, isPublic: true, note: "Confirmed by phone" },
        { sourceId: "src-2", position: 1, isPublic: false, note: null },
      ]);

      await transitions.startCorrection(editor, "a1");

      expect(tx.articleSource.createMany).toHaveBeenCalledWith({
        data: [
          { articleRevisionId: "new-draft", sourceId: "src-1", position: 0, isPublic: true, note: "Confirmed by phone" },
          { articleRevisionId: "new-draft", sourceId: "src-2", position: 1, isPublic: false, note: null },
        ],
      });
    });

    it("skips the createMany call when the source revision has no sources", async () => {
      tx.article.findUnique.mockResolvedValue({
        id: "a1",
        ownerId: editor.id,
        currentPublishedRevisionId: "published-rev",
        deletedAt: null,
      });
      tx.articleRevision.findUniqueOrThrow.mockResolvedValue({ id: "published-rev", articleId: "a1" });
      tx.articleRevision.create.mockResolvedValue({ id: "new-draft", state: "DRAFT" });
      tx.articleSource.findMany.mockResolvedValue([]);

      await transitions.startCorrection(editor, "a1");

      expect(tx.articleSource.createMany).not.toHaveBeenCalled();
    });
  });
});
