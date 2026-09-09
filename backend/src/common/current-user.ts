import { Request } from "express";
import { AuthenticatedUser } from "./authenticated-user";

/// The Express equivalent of the old @CurrentUser() param decorator — reads
/// the user sessionAuth already attached to the request. Only valid on
/// routes behind that middleware, which every route in this app is by
/// default (see app.ts).
export function CurrentUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new Error("CurrentUser() used on a route with no sessionAuth — nothing to read");
  }
  return req.user;
}
