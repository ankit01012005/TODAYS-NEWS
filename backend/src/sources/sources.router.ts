import { Router, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import * as sourcesService from "./sources.service";
import { CreateSourceDto } from "./dto/create-source.dto";
import { UpdateSourceDto } from "./dto/update-source.dto";
import { AttachSourceDto } from "./dto/attach-source.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";
import { CurrentUser } from "../common/current-user";

/// Mounted at /sources in app.ts. Editor creates a source; admin manages
/// (edits, verifies, deactivates) one — admin cannot author, so it no
/// longer creates sources either (docs/03 §2.3, §3.2).
export const sourcesRouter = Router();

sourcesRouter.post(
  "/",
  requireCapability("source:create"),
  validateBody(CreateSourceDto),
  async (req: Request<ParamsDictionary, unknown, CreateSourceDto>, res: Response) => {
    const source = await sourcesService.createSource(
      CurrentUser(req).id,
      req.body.name,
      req.body.description,
      req.body.url,
    );
    res.status(201).json(source);
  },
);

sourcesRouter.get("/", async (_req: Request, res: Response) => {
  res.status(200).json(await sourcesService.listSources());
});

sourcesRouter.patch(
  "/:id",
  requireCapability("source:manage"),
  requireUuidParam("id"),
  validateBody(UpdateSourceDto),
  async (req: Request<{ id: string }, unknown, UpdateSourceDto>, res: Response) => {
    res.status(200).json(await sourcesService.updateSource(req.params.id, req.body));
  },
);

sourcesRouter.post(
  "/:id/verify",
  requireCapability("source:manage"),
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await sourcesService.verifySource(req.params.id, CurrentUser(req).id));
  },
);

sourcesRouter.patch(
  "/:id/deactivate",
  requireCapability("source:manage"),
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await sourcesService.deactivateSource(req.params.id));
  },
);

/// Article-scoped attach/detach — mounted bare (full paths), like
/// articlesRouter/reviewsRouter. Gated the same as saving content
/// (article:save — editor only, since admin cannot author, docs/03 §2.3);
/// ownership is then checked in the service.
export const articleSourcesRouter = Router();

articleSourcesRouter.get(
  "/articles/:id/sources",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await sourcesService.listAttachedSources(CurrentUser(req), req.params.id));
  },
);

articleSourcesRouter.post(
  "/articles/:id/sources",
  requireCapability("article:save"),
  requireUuidParam("id"),
  validateBody(AttachSourceDto),
  async (req: Request<{ id: string }, unknown, AttachSourceDto>, res: Response) => {
    const attached = await sourcesService.attachSource(CurrentUser(req), req.params.id, req.body);
    res.status(201).json(attached);
  },
);

articleSourcesRouter.delete(
  "/articles/:id/sources/:articleSourceId",
  requireCapability("article:save"),
  requireUuidParam("id"),
  requireUuidParam("articleSourceId"),
  async (req: Request<{ id: string; articleSourceId: string }>, res: Response) => {
    await sourcesService.detachSource(CurrentUser(req), req.params.id, req.params.articleSourceId);
    res.status(204).end();
  },
);
