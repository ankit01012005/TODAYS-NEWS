import { Router, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import * as usersService from "./users.service";
import { InviteUserDto } from "./dto/invite-user.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { validateBody } from "../common/middleware/validate-body.middleware";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";
import { CurrentUser } from "../common/current-user";

/// Mounted at /users in app.ts (`app.use("/users", usersRouter)`), after
/// sessionAuth — every route here also needs user:manage (docs/03 §2.3:
/// admin only). IMPORTANT: this router MUST be mounted with the "/users"
/// prefix, not bare — `router.use(requireCapability(...))` with no path
/// matches every request that reaches this router, so mounting it
/// unprefixed would gate every other route in the app on user:manage too.
export const usersRouter = Router();
usersRouter.use(requireCapability("user:manage"));

usersRouter.post(
  "/",
  validateBody(InviteUserDto),
  async (req: Request<ParamsDictionary, unknown, InviteUserDto>, res: Response) => {
    const result = await usersService.invite(req.body.email, req.body.displayName, req.body.role, CurrentUser(req));
    res.status(201).json(result);
  },
);

usersRouter.post(
  "/:id/resend-invitation",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await usersService.resendInvitation(req.params.id, CurrentUser(req)));
  },
);

usersRouter.get("/", async (_req: Request, res: Response) => {
  res.status(200).json(await usersService.list());
});

usersRouter.patch(
  "/:id/role",
  requireUuidParam("id"),
  validateBody(ChangeRoleDto),
  async (req: Request<{ id: string }, unknown, ChangeRoleDto>, res: Response) => {
    res.status(200).json(await usersService.changeRole(req.params.id, req.body.role));
  },
);

usersRouter.patch(
  "/:id/deactivate",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await usersService.deactivate(req.params.id));
  },
);

usersRouter.patch(
  "/:id/reactivate",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    res.status(200).json(await usersService.reactivate(req.params.id));
  },
);
