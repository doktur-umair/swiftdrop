import { Router } from "express";
import {
  bookingRequestSchema,
  priceInputSchema,
  quoteRequestSchema,
  trackingNumberSchema,
  zoneInputSchema,
} from "@swiftdrop/contracts";
import { HttpError } from "../../shared/problem.js";
import { protectMutations } from "../../shared/mutations.js";
import type { Config } from "../../shared/config.js";
import type { RateLimiter } from "../../shared/rate-limit.js";
import {
  authenticate,
  requireCompleteProfile,
  requireRole,
} from "../auth/index.js";
import type { AuthService } from "../auth/service.js";
import { ParcelService } from "./service.js";

export function createParcelRouter(
  service: ParcelService,
  auth: AuthService,
  limiter: RateLimiter,
  config: Config,
) {
  const router = Router();
  const customer = [
    authenticate(auth),
    requireRole("CUSTOMER"),
    requireCompleteProfile,
  ];
  const admin = [
    authenticate(auth),
    requireRole("ADMIN"),
    requireCompleteProfile,
  ];
  router.post(
    "/quotes",
    protectMutations(config),
    ...customer,
    async (req, res) => {
      res
        .status(201)
        .json(
          await service.createQuote(
            res.locals.user.id,
            quoteRequestSchema.parse(req.body),
          ),
        );
    },
  );
  router.post(
    "/parcels",
    protectMutations(config),
    ...customer,
    async (req, res) => {
      const key = req.get("Idempotency-Key") ?? "";
      res
        .status(201)
        .json(
          await service.book(
            res.locals.user.id,
            key,
            bookingRequestSchema.parse(req.body),
          ),
        );
    },
  );
  router.get("/parcels", ...customer, async (req, res) => {
    const cursor =
      typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    if (req.query.cursor !== undefined && !cursor)
      throw new HttpError(
        400,
        "INVALID_CURSOR",
        "The booking page cursor is invalid.",
      );
    res.json(await service.list(res.locals.user.id, cursor));
  });
  router.get("/parcels/:id", ...customer, async (req, res) => {
    res.json(await service.detail(res.locals.user.id, String(req.params.id)));
  });
  router.get(
    "/track/:trackingNumber",
    limiter.middleware("public-tracking", 30, 60),
    async (req, res) => {
      const number = trackingNumberSchema.parse(
        String(req.params.trackingNumber),
      );
      res.setHeader(
        "Cache-Control",
        "public, max-age=15, stale-while-revalidate=15",
      );
      res.json(await service.track(number));
    },
  );
  router.get("/admin/zones", ...admin, async (_req, res) =>
    res.json(await service.zones()),
  );
  router.post(
    "/admin/zones",
    protectMutations(config),
    ...admin,
    async (req, res) =>
      res
        .status(201)
        .json(await service.createZone(zoneInputSchema.parse(req.body))),
  );
  router.patch(
    "/admin/zones/:id",
    protectMutations(config),
    ...admin,
    async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1)
        throw new HttpError(400, "INVALID_ZONE", "District id is invalid.");
      res.json(await service.updateZone(id, zoneInputSchema.parse(req.body)));
    },
  );
  router.delete(
    "/admin/zones/:id",
    protectMutations(config),
    ...admin,
    async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id < 1)
        throw new HttpError(400, "INVALID_ZONE", "District id is invalid.");
      await service.deleteZone(id);
      res.status(204).end();
    },
  );
  router.get("/admin/pricing", ...admin, async (_req, res) =>
    res.json(await service.prices()),
  );
  router.post(
    "/admin/pricing",
    protectMutations(config),
    ...admin,
    async (req, res) =>
      res
        .status(201)
        .json(await service.createPrice(priceInputSchema.parse(req.body))),
  );
  return router;
}
