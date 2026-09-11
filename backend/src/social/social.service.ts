import { prisma } from "../db";
import { AuthenticatedUser } from "../common/authenticated-user";
import { BadRequestError, NotFoundError } from "../common/http-errors";
import { writeAudit } from "../common/audit";
import { isSafeHref } from "../articles/body.util";
import { CreateSocialPickDto } from "./dto/create-social-pick.dto";
import { PublicSocialPickView, SocialPickView, toPublicSocialPickView, toSocialPickView } from "./social.view";

/// "Top on social" is curated by hand, every day, by whoever holds
/// social:manage (admin — it publishes straight to the front page, and
/// publishing is the admin's job, BR-02). There is deliberately no
/// platform integration here: decided 2026-09-12, see docs/27 and the
/// SocialPick model comment.

const PUBLIC_LIMIT = 8;
const HANDLE_RE = /^@?[A-Za-z0-9._]{1,64}$/;

/// Newest first; the front page shows at most PUBLIC_LIMIT. Staff keep it
/// fresh by removing yesterday's picks — nothing expires on its own, so a
/// quiet day never leaves the rail empty by accident.
export async function listPublic(): Promise<PublicSocialPickView[]> {
  const picks = await prisma.socialPick.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: PUBLIC_LIMIT,
  });
  return picks.map(toPublicSocialPickView);
}

export async function listForStaff(): Promise<SocialPickView[]> {
  const picks = await prisma.socialPick.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return picks.map(toSocialPickView);
}

export async function create(user: AuthenticatedUser, input: CreateSocialPickDto): Promise<SocialPickView> {
  const url = input.url.trim();
  if (!/^https?:\/\//i.test(url) || !isSafeHref(url)) {
    throw new BadRequestError("url must be a full http(s) address");
  }
  const handle = input.accountHandle.trim();
  if (!HANDLE_RE.test(handle)) {
    throw new BadRequestError("accountHandle must look like @handle");
  }

  return prisma.$transaction(async (tx) => {
    const pick = await tx.socialPick.create({
      data: {
        platform: input.platform,
        accountHandle: handle.startsWith("@") ? handle : `@${handle}`,
        headline: input.headline.trim(),
        url,
        createdByUserId: user.id,
      },
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "SocialPick",
      entityId: pick.id,
      action: "CREATE",
      metadata: { platform: pick.platform, accountHandle: pick.accountHandle },
    });
    return toSocialPickView(pick);
  });
}

/// Soft delete — the audit row keeps pointing at a real record.
export async function remove(user: AuthenticatedUser, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const result = await tx.socialPick.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundError("No such social pick");
    await writeAudit(tx, { actorUserId: user.id, entityType: "SocialPick", entityId: id, action: "DELETE" });
  });
}
