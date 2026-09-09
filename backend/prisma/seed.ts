// Minimal, deterministic development seed data.
//
// This exists only to exercise the relationships defined in schema.prisma —
// ownership vs. authorship, the revision pointer, sources, media, review
// decisions and audit entries — against a real database. It is not
// production content and must never run against a production database.
// Re-running this script is a no-op once the fixed article below exists.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IDS = {
  adminOne: "00000000-0000-0000-0000-000000000001",
  adminTwo: "00000000-0000-0000-0000-000000000002",
  editorOne: "00000000-0000-0000-0000-000000000003",
  category: "00000000-0000-0000-0000-000000000010",
  source: "00000000-0000-0000-0000-000000000020",
  media: "00000000-0000-0000-0000-000000000030",
  articlePublished: "00000000-0000-0000-0000-000000000040",
  revisionPublished: "00000000-0000-0000-0000-000000000041",
  articleDraft: "00000000-0000-0000-0000-000000000050",
  revisionDraft: "00000000-0000-0000-0000-000000000051",
} as const;

// Not a real credential — no user can sign in with this. Real password
// hashing belongs to the auth phase, not the database seed.
const DEV_PASSWORD_HASH = "dev-seed-only:not-a-real-hash:do-not-use";

async function main() {
  const alreadySeeded = await prisma.article.findUnique({
    where: { id: IDS.articlePublished },
    select: { id: true },
  });
  if (alreadySeeded) {
    console.log("Seed data already present — skipping.");
    return;
  }

  const [adminOne, adminTwo, editorOne] = await Promise.all([
    prisma.user.create({
      data: {
        id: IDS.adminOne,
        email: "admin.one@dev.local",
        passwordHash: DEV_PASSWORD_HASH,
        displayName: "Admin One",
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        id: IDS.adminTwo,
        email: "admin.two@dev.local",
        passwordHash: DEV_PASSWORD_HASH,
        displayName: "Admin Two",
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        id: IDS.editorOne,
        email: "editor.one@dev.local",
        passwordHash: DEV_PASSWORD_HASH,
        displayName: "Editor One",
        role: "EDITOR",
      },
    }),
  ]);

  const category = await prisma.category.create({
    data: { id: IDS.category, name: "World", slug: "world" },
  });

  const source = await prisma.source.create({
    data: {
      id: IDS.source,
      name: "Press Office Briefing",
      verified: true,
      createdByUserId: editorOne.id,
      verifiedByUserId: adminOne.id,
      verifiedAt: new Date(),
    },
  });

  const media = await prisma.mediaAsset.create({
    data: {
      id: IDS.media,
      storageKey: "dev-seed/placeholder.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 123456,
      width: 1600,
      height: 900,
      uploadedByUserId: editorOne.id,
    },
  });

  // --- Article 1: taken through the full lifecycle to PUBLISHED, to
  // exercise the revision pointer (I-3), sources, media, review decisions
  // and audit entries together. Approved/published by adminOne, who is
  // neither the owner nor the revision author (BR-13). ---
  const article = await prisma.article.create({
    data: {
      id: IDS.articlePublished,
      slug: "world-leaders-meet-for-summit",
      ownerId: editorOne.id,
      categoryId: category.id,
    },
  });

  const revision = await prisma.articleRevision.create({
    data: {
      id: IDS.revisionPublished,
      articleId: article.id,
      state: "DRAFT",
      createdByUserId: editorOne.id,
      headline: "World leaders meet for summit",
      summary: "Delegates gathered to discuss the agenda for next year.",
      body: [
        {
          type: "paragraph",
          content: [{ text: "The summit opened this morning.", marks: [] }],
        },
      ],
      featuredImageId: media.id,
      featuredImageAlt: "Delegates seated around a conference table",
      featuredImageCredit: "Press Office",
    },
  });

  await prisma.articleSource.create({
    data: {
      articleRevisionId: revision.id,
      sourceId: source.id,
      position: 0,
      isPublic: true,
    },
  });

  await prisma.articleRevision.update({
    where: { id: revision.id },
    data: { state: "IN_REVIEW", submittedAt: new Date() },
  });

  await prisma.reviewDecision.create({
    data: {
      articleRevisionId: revision.id,
      decision: "APPROVED",
      decidedByUserId: adminOne.id,
    },
  });

  await prisma.articleRevision.update({
    where: { id: revision.id },
    data: { state: "APPROVED" },
  });

  const publishedAt = new Date();
  await prisma.articleRevision.update({
    where: { id: revision.id },
    data: { state: "PUBLISHED", publishedAt, publishedByUserId: adminOne.id },
  });

  await prisma.article.update({
    where: { id: article.id },
    data: {
      publicationStatus: "LIVE",
      currentPublishedRevisionId: revision.id,
      firstPublishedAt: publishedAt,
      publishedAt,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: editorOne.id,
        entityType: "Article",
        entityId: article.id,
        action: "CREATE",
        articleId: article.id,
      },
      {
        actorUserId: editorOne.id,
        entityType: "ArticleRevision",
        entityId: revision.id,
        action: "SUBMIT",
        articleId: article.id,
      },
      {
        actorUserId: adminOne.id,
        entityType: "ArticleRevision",
        entityId: revision.id,
        action: "APPROVE",
        articleId: article.id,
      },
      {
        actorUserId: adminOne.id,
        entityType: "ArticleRevision",
        entityId: revision.id,
        action: "PUBLISH",
        articleId: article.id,
      },
    ],
  });

  // --- Article 2: left mid-draft, to show an article can exist with just
  // one open revision and nothing else yet (I-1). ---
  const draftArticle = await prisma.article.create({
    data: {
      id: IDS.articleDraft,
      slug: "draft-a-look-ahead-to-next-quarter",
      ownerId: editorOne.id,
      categoryId: category.id,
    },
  });

  await prisma.articleRevision.create({
    data: {
      id: IDS.revisionDraft,
      articleId: draftArticle.id,
      state: "DRAFT",
      createdByUserId: editorOne.id,
      headline: "A look ahead to next quarter",
    },
  });

  console.log("Seed complete:", {
    users: [adminOne.email, adminTwo.email, editorOne.email],
    articles: [article.slug, draftArticle.slug],
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
