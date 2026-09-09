import { Router, Request, Response } from "express";
import * as categoriesService from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";

/// Mounted at /categories in app.ts, after sessionAuth. Any signed-in staff
/// member can list categories (an editor needs the list to write an
/// article); only admins may create, edit or deactivate one (docs/03 §3.3).
/// Public category browsing is a separate, unauthenticated concern —
/// see public/public.router.ts.
export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req: Request, res: Response) => {
  res.status(200).json(await categoriesService.listCategories());
});

categoriesRouter.post(
  "/",
  requireCapability("category:manage"),
  validateBody(CreateCategoryDto),
  async (req: Request<unknown, unknown, CreateCategoryDto>, res: Response) => {
    const category = await categoriesService.createCategory(req.body.name, req.body.slug);
    res.status(201).json(category);
  },
);

categoriesRouter.patch(
  "/:id",
  requireCapability("category:manage"),
  requireUuidParam("id"),
  validateBody(UpdateCategoryDto),
  async (req: Request<{ id: string }, unknown, UpdateCategoryDto>, res: Response) => {
    res.status(200).json(await categoriesService.updateCategory(req.params.id, req.body));
  },
);

categoriesRouter.patch(
  "/:id/deactivate",
  requireCapability("category:manage"),
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await categoriesService.deactivateCategory(req.params.id));
  },
);
