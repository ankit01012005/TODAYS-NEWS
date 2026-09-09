import { Router, Request, Response } from "express";
import multer from "multer";
import * as mediaService from "./media.service";
import { requireUuidParam } from "../common/middleware/uuid-param.middleware";
import { requireCapability } from "../common/middleware/require-capability.middleware";
import { CurrentUser } from "../common/current-user";
import { BadRequestError } from "../common/http-errors";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB — SCL-06

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

/// Mounted at /media in app.ts.
export const mediaRouter = Router();

mediaRouter.post(
  "/",
  requireCapability("media:upload"),
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestError('No file provided (expected multipart field "file")');
    }
    const media = await mediaService.uploadMedia(CurrentUser(req), {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      size: req.file.size,
    });
    res.status(201).json(media);
  },
);

mediaRouter.get("/", async (_req: Request, res: Response) => {
  res.status(200).json(await mediaService.listMedia());
});

mediaRouter.delete(
  "/:id",
  requireUuidParam("id"),
  async (req: Request<{ id: string }>, res: Response) => {
    await mediaService.deleteMedia(CurrentUser(req), req.params.id);
    res.status(204).end();
  },
);
