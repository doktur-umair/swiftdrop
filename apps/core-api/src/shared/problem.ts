import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import type { Logger } from "pino";
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export const unauthorised = () =>
  new HttpError(401, "UNAUTHENTICATED", "Sign in again to continue.");
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    let issue: HttpError;
    if (error instanceof ZodError) {
      const fields: Record<string, string[]> = {};
      for (const item of error.issues)
        (fields[String(item.path[0] ?? "form")] ??= []).push(item.message);
      issue = new HttpError(
        400,
        "VALIDATION",
        "Check the highlighted fields.",
        fields,
      );
    } else if (error instanceof HttpError) issue = error;
    else if (error?.code === "EBADCSRFTOKEN")
      issue = new HttpError(
        403,
        "CSRF",
        "Your security context changed. Please try again.",
      );
    else if (error?.type === "entity.too.large")
      issue = new HttpError(413, "BODY_TOO_LARGE", "Request is too large.");
    else if (error instanceof SyntaxError && "body" in error)
      issue = new HttpError(400, "INVALID_JSON", "Send valid JSON.");
    else {
      // Log classifications only: database errors can contain submitted credentials or PII.
      logger.error({
        correlationId: res.locals.correlationId,
        event: "request_failed",
      });
      issue = new HttpError(
        503,
        "UNAVAILABLE",
        "Service temporarily unavailable. Please try again.",
      );
    }
    res
      .status(issue.status)
      .type("application/problem+json")
      .json({
        type: `urn:swiftdrop:problem:${issue.code.toLowerCase()}`,
        title: issue.status >= 500 ? "Service unavailable" : "Request rejected",
        status: issue.status,
        code: issue.code,
        detail: issue.message,
        correlationId: res.locals.correlationId,
        ...(issue.errors ? { errors: issue.errors } : {}),
      });
  };
}
