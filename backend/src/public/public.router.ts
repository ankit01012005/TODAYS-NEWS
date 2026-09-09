import { Router, Request, Response } from "express";
import * as publicService from "./public.service";

/// Mounted in app.ts BEFORE sessionAuth — fully public, no session
/// required. Every query here is filtered to publicationStatus = LIVE
/// (BR-01), and anything not found returns a plain 404 — never a 403 that
/// would confirm an unpublished story exists (SEC-03).
export const publicRouter = Router();

publicRouter.get("/public/articles", async (req: Request, res: Response) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  res.status(200).json(await publicService.listPublished(cursor));
});

publicRouter.get("/public/categories/:categorySlug", async (req: Request<{ categorySlug: string }>, res: Response) => {
  const category = await publicService.getCategory(req.params.categorySlug);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const { articles, nextCursor } = await publicService.listPublished(cursor, req.params.categorySlug);
  res.status(200).json({ category, articles, nextCursor });
});

/// The address shape decided for Phase 4C-3: /{category}/{slug} — fixed
/// forever once first published (BR-15).
publicRouter.get(
  "/public/articles/:categorySlug/:slug",
  async (req: Request<{ categorySlug: string; slug: string }>, res: Response) => {
    const article = await publicService.getPublishedArticle(req.params.categorySlug, req.params.slug);
    res.status(200).json(article);
  },
);
