import { AuthenticatedUser } from "../common/authenticated-user";
import { BadRequestError, ConflictError, ForbiddenError } from "../common/http-errors";

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

  it("approveAndPublish refuses self-approval by the article owner — BR-13", async () => {
    tx.article.findUnique.mockResolvedValue({
      id: "a1",
      ownerId: admin.id, // admin owns the article
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

    await expect(transitions.approveAndPublish(admin, "a1", 0)).rejects.toThrow(ForbiddenError);
    expect(tx.reviewDecision.create).not.toHaveBeenCalled();
    expect(tx.articleRevision.updateMany).not.toHaveBeenCalled();
  });

  it("approveAndPublish refuses self-approval by the revision's author", async () => {
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
      createdByUserId: admin.id, // admin substantially rewrote it
    });

    await expect(transitions.approveAndPublish(admin, "a1", 0)).rejects.toThrow(ForbiddenError);
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
});
