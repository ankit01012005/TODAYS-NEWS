import { Router, Request, Response } from "express";
import * as usersService from "./users.service";
import { InviteUserDto } from "./dto/invite-user.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";

/// Mounted in app.ts after sessionAuth — every route here also needs
/// user:manage (docs/03 §2.3: admin only).
export const usersRouter = Router();
usersRouter.use(requireCapability("user:manage"));

usersRouter.post(
  "/users",
  validateBody(InviteUserDto),
  async (req: Request<unknown, unknown, InviteUserDto>, res: Response) => {
    const result = await usersService.invite(req.body.email, req.body.displayName, req.body.role);
    res.status(201).json(result);
  },
);

usersRouter.get("/users", async (_req: Request, res: Response) => {
  res.status(200).json(await usersService.list());
});

usersRouter.patch(
  "/users/:id/role",
  requireUuidParam("id"),
  validateBody(ChangeRoleDto),
  async (req: Request<{ id: string }, unknown, ChangeRoleDto>, res: Response) => {
    res.status(200).json(await usersService.changeRole(req.params.id, req.body.role));
  },
);

usersRouter.patch(
  "/users/:id/deactivate",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await usersService.deactivate(req.params.id));
  },
);

usersRouter.patch(
  "/users/:id/reactivate",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await usersService.reactivate(req.params.id));
  },
);
