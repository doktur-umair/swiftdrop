import type { RequestHandler } from "express";
import { doubleCsrf } from "csrf-csrf";
import type { Config } from "./config.js";
import { HttpError } from "./problem.js";
import { cookieNames } from "../modules/auth/routes.js";

export function protectMutations(config: Config): RequestHandler {
  const names = cookieNames(config.secure);
  const protection = doubleCsrf({
    getSecret: () => config.csrfSecret,
    getSessionIdentifier: (req) =>
      req.cookies[names.refresh] ?? req.cookies[names.context] ?? "",
    cookieName: names.csrf,
    cookieOptions: {
      httpOnly: true,
      secure: config.secure,
      sameSite: "strict",
      path: "/",
    },
  }).doubleCsrfProtection;
  return (req, res, next) => {
    let origin = req.get("origin");
    if (!origin && req.get("referer")) {
      try {
        origin = new URL(req.get("referer")!).origin;
      } catch {
        /* rejected below */
      }
    }
    if (origin !== config.APP_ORIGIN)
      return next(
        new HttpError(403, "ORIGIN", "Request origin is not allowed."),
      );
    if (!req.is("application/json"))
      return next(new HttpError(415, "CONTENT_TYPE", "Send application/json."));
    protection(req, res, next);
  };
}
