CREATE TYPE "ParcelStatus" AS ENUM ('CREATED');

CREATE TABLE "zones" (
  "id" SERIAL PRIMARY KEY,
  "district" VARCHAR(80) NOT NULL UNIQUE,
  "town" VARCHAR(80) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL
);

CREATE TABLE "price_versions" (
  "id" SERIAL PRIMARY KEY,
  "origin_zone_id" INTEGER NOT NULL REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "destination_zone_id" INTEGER NOT NULL REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "base_cents" INTEGER NOT NULL CHECK ("base_cents" >= 0),
  "per_extra_kg_cents" INTEGER NOT NULL CHECK ("per_extra_kg_cents" >= 0),
  "effective_from" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "price_versions_origin_zone_id_destination_zone_id_effective_key" UNIQUE ("origin_zone_id", "destination_zone_id", "effective_from"),
  CONSTRAINT "price_versions_distinct_zones_check" CHECK ("origin_zone_id" <> "destination_zone_id")
);
CREATE INDEX "price_versions_origin_zone_id_destination_zone_id_effective_idx" ON "price_versions"("origin_zone_id", "destination_zone_id", "effective_from");

CREATE TABLE "quotes" (
  "id" UUID PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "origin_zone_id" INTEGER NOT NULL REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "destination_zone_id" INTEGER NOT NULL REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "price_version_id" INTEGER NOT NULL REFERENCES "price_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "weight_grams" INTEGER NOT NULL CHECK ("weight_grams" BETWEEN 1 AND 30000),
  "length_mm" INTEGER NOT NULL CHECK ("length_mm" BETWEEN 1 AND 1500),
  "width_mm" INTEGER NOT NULL CHECK ("width_mm" BETWEEN 1 AND 1500),
  "height_mm" INTEGER NOT NULL CHECK ("height_mm" BETWEEN 1 AND 1500),
  "fee_cents" INTEGER NOT NULL CHECK ("fee_cents" >= 0),
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "quotes_user_id_expires_at_idx" ON "quotes"("user_id", "expires_at");

CREATE TABLE "parcels" (
  "id" UUID PRIMARY KEY,
  "tracking_number" VARCHAR(16) NOT NULL UNIQUE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "quote_id" UUID NOT NULL UNIQUE REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "origin_zone_id" INTEGER NOT NULL REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "destination_zone_id" INTEGER NOT NULL REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "status" "ParcelStatus" NOT NULL DEFAULT 'CREATED',
  "fee_cents" INTEGER NOT NULL CHECK ("fee_cents" >= 0),
  "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" > 0),
  "attempt_count" INTEGER NOT NULL DEFAULT 0 CHECK ("attempt_count" >= 0),
  "recipient_name" VARCHAR(120) NOT NULL,
  "recipient_phone" VARCHAR(16) NOT NULL,
  "recipient_address" VARCHAR(300) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "parcels_user_id_created_at_id_idx" ON "parcels"("user_id", "created_at", "id");
CREATE TABLE "parcel_history" (
  "id" BIGSERIAL PRIMARY KEY,
  "parcel_id" UUID NOT NULL REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "status" "ParcelStatus" NOT NULL,
  "town" VARCHAR(80) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "parcel_history_parcel_id_created_at_id_idx" ON "parcel_history"("parcel_id", "created_at", "id");

CREATE TABLE "idempotency_records" (
  "id" UUID PRIMARY KEY,
  "principal_key" VARCHAR(64) NOT NULL,
  "operation" VARCHAR(80) NOT NULL,
  "key" VARCHAR(128) NOT NULL,
  "request_hash" CHAR(64) NOT NULL,
  "response" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "idempotency_records_principal_key_operation_key_key" UNIQUE ("principal_key", "operation", "key")
);
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

CREATE TABLE "outbox_events" (
  "id" UUID PRIMARY KEY,
  "event_id" UUID NOT NULL UNIQUE,
  "event_type" VARCHAR(100) NOT NULL,
  "aggregate_id" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMPTZ(3),
  "attempts" INTEGER NOT NULL DEFAULT 0 CHECK ("attempts" >= 0)
);
CREATE INDEX "outbox_events_published_at_created_at_idx" ON "outbox_events"("published_at", "created_at");

CREATE TABLE "consumer_progress" (
  "event_id" UUID PRIMARY KEY,
  "event_type" VARCHAR(100) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
