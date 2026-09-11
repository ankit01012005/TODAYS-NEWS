import { Router, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import * as socialService from "./social.service";
import { CreateSocialPickDto } from "./dto/create-social-pick.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";
import { CurrentUser } from "../common/current-user";

/// Public — mounted BEFORE sessionAuth in app.ts. Only live (non-deleted)
/// picks, newest first, capped.
export const socialPublicRouter = Router();

socialPublicRouter.get("/public/social-picks", async (_req: Request, res: Response) => {
  res.status(200).json(await socialService.listPublic());
});

/// Staff — mounted at /social-picks AFTER sessionAuth; every route needs
/// social:manage (admin). Same mount-with-prefix warning as usersRouter:
/// `router.use(requireCapability(...))` matches everything reaching this
/// router, so it must never be mounted bare.
export const socialRouter = Router();
socialRouter.use(requireCapability("social:manage"));

socialRouter.get("/", async (_req: Request, res: Response) => {
  res.status(200).json(await socialService.listForStaff());
});

socialRouter.post(
  "/",
  validateBody(CreateSocialPickDto),
  async (req: Request<ParamsDictionary, unknown, CreateSocialPickDto>, res: Response) => {
    res.status(201).json(await socialService.create(CurrentUser(req), req.body));
  },
);

socialRouter.delete("/:id", requireUuidParam("id"), async (req: Request<{ id: string }>, res: Response) => {
  await socialService.remove(CurrentUser(req), req.params.id);
  res.status(204).end();
});
