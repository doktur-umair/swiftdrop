ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMPTZ(3);
CREATE TABLE "verification_tokens" (
  "id" UUID NOT NULL,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "token_hash" CHAR(64) NOT NULL,
  "generation" INTEGER NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3),
  "revoked_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_token_generation_positive" CHECK ("generation" > 0),
  CONSTRAINT "verification_token_expiry" CHECK ("expires_at" > "created_at"),
  CONSTRAINT "verification_token_single_use" CHECK (NOT ("consumed_at" IS NOT NULL AND "revoked_at" IS NOT NULL)),
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");
CREATE INDEX "verification_tokens_expires_at_idx" ON "verification_tokens"("expires_at");
