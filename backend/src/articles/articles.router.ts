import { Router, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import * as articlesService from "./articles.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleContentDto } from "./dto/update-article-content.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";
import { CurrentUser } from "../common/current-user";
import { toArticleDetailView, toRevisionView } from "./article.view";

/// Mounted in app.ts after sessionAuth. CRUD only — no transitions here
/// (docs/23 §8.3: ARTICLES "owns no transitions"; that's the Reviews router).
export const articlesRouter = Router();

articlesRouter.post(
  "/articles",
  requireCapability("article:create"),
  validateBody(CreateArticleDto),
  async (req: Request<ParamsDictionary, unknown, CreateArticleDto>, res: Response) => {
    const user = CurrentUser(req);
    const { article, revision } = await articlesService.createArticle(user, req.body);
    res.status(201).json(toArticleDetailView(article, revision, null));
  },
);

articlesRouter.get("/articles", async (req: Request, res: Response) => {
  const user = CurrentUser(req);
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const articles = await articlesService.listArticles(user, { limit, offset });
  res.status(200).json(articles);
});

articlesRouter.get(
  "/articles/:id",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    const user = CurrentUser(req);
    const { article, openRevision, publishedRevision } = await articlesService.getArticleWithRevisions(
      user,
      req.params.id,
    );
    res.status(200).json(toArticleDetailView(article, openRevision, publishedRevision));
  },
);

articlesRouter.patch(
  "/articles/:id",
  requireUuidParam("id"),
  requireCapability("article:save"),
  validateBody(UpdateArticleContentDto),
  async (req: Request<{ id: string }, unknown, UpdateArticleContentDto>, res: Response) => {
    const user = CurrentUser(req);
    const revision = await articlesService.saveArticleContent(user, req.params.id, req.body);
    res.status(200).json(toRevisionView(revision));
  },
);

/// docs/26 §1.5 — every revision ever frozen, oldest first, each with its
/// review decisions. Backs PG-ADM-05 (Article history) and the feedback
/// panel's "earlier rounds" list (docs/19 §4.5, §4.7).
articlesRouter.get(
  "/articles/:id/revisions",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    const user = CurrentUser(req);
    res.status(200).json(await articlesService.getRevisionHistory(user, req.params.id));
  },
);
