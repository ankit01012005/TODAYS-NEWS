import { SocialPick, SocialPlatform } from "@prisma/client";

/// What readers get: nothing about who curated it or when it was edited.
export interface PublicSocialPickView {
  id: string;
  platform: SocialPlatform;
  accountHandle: string;
  headline: string;
  url: string;
  createdAt: string;
}

/// The CMS view adds curator + timestamps for the management page.
export interface SocialPickView extends PublicSocialPickView {
  createdByUserId: string;
  updatedAt: string;
}

export function toPublicSocialPickView(pick: SocialPick): PublicSocialPickView {
  return {
    id: pick.id,
    platform: pick.platform,
    accountHandle: pick.accountHandle,
    headline: pick.headline,
    url: pick.url,
    createdAt: pick.createdAt.toISOString(),
  };
}

export function toSocialPickView(pick: SocialPick): SocialPickView {
  return {
    ...toPublicSocialPickView(pick),
    createdByUserId: pick.createdByUserId,
    updatedAt: pick.updatedAt.toISOString(),
  };
}
