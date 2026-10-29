ALTER TABLE "users" ALTER COLUMN "full_name" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "google_sub" VARCHAR(255);
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");
ALTER TABLE "users" ADD CONSTRAINT "users_incomplete_google_only" CHECK (("full_name" IS NOT NULL AND "phone" IS NOT NULL) OR ("google_sub" IS NOT NULL AND "password_hash" IS NULL AND "role_id" = 'CUSTOMER'));
CREATE TABLE "oauth_transactions" (
  "id" UUID NOT NULL,
  "state_hash" CHAR(64) NOT NULL,
  "nonce" VARCHAR(128) NOT NULL,
  "encrypted_verifier" TEXT NOT NULL,
  "browser_hash" CHAR(64) NOT NULL,
  "intent" VARCHAR(8) NOT NULL,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "family_id" UUID,
  "password_hash" TEXT,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oauth_transaction_intent" CHECK ("intent" IN ('login', 'link')),
  CONSTRAINT "oauth_transaction_binding" CHECK (("intent" = 'login' AND "user_id" IS NULL AND "family_id" IS NULL) OR ("intent" = 'link' AND "user_id" IS NOT NULL AND "family_id" IS NOT NULL)),
  CONSTRAINT "oauth_transaction_expiry" CHECK ("expires_at" > "created_at"),
  PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "oauth_transactions_state_hash_key" ON "oauth_transactions"("state_hash");
CREATE INDEX "oauth_transactions_expires_at_idx" ON "oauth_transactions"("expires_at");
