CREATE TYPE "RoleName" AS ENUM ('CUSTOMER', 'MERCHANT', 'COURIER', 'DISPATCHER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');
CREATE TABLE "roles" ("id" "RoleName" NOT NULL PRIMARY KEY);
INSERT INTO "roles" ("id") VALUES ('CUSTOMER'), ('MERCHANT'), ('COURIER'), ('DISPATCHER'), ('ADMIN');
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(254) NOT NULL,
  "password_hash" TEXT,
  "full_name" VARCHAR(120) NOT NULL,
  "phone" VARCHAR(16) NOT NULL,
  "role_id" "RoleName" NOT NULL REFERENCES "roles"("id") ON UPDATE CASCADE,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "canonical_email" CHECK ("email" = lower(btrim("email")))
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE TABLE "auth_sessions" (
  "id" UUID PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE,
  "role_at_authentication" "RoleName" NOT NULL,
  "authenticated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_refreshed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "idle_expires_at" TIMESTAMPTZ(3) NOT NULL,
  "absolute_expires_at" TIMESTAMPTZ(3) NOT NULL,
  "revoked_at" TIMESTAMPTZ(3),
  "revocation_reason" VARCHAR(32),
  CONSTRAINT "session_expiry_order" CHECK ("idle_expires_at" <= "absolute_expires_at")
);
CREATE INDEX "auth_sessions_user_id_revoked_at_idx" ON "auth_sessions"("user_id", "revoked_at");
CREATE INDEX "auth_sessions_absolute_expires_at_idx" ON "auth_sessions"("absolute_expires_at");
CREATE TABLE "refresh_tokens" (
  "id" UUID PRIMARY KEY,
  "token_hash" CHAR(64) NOT NULL,
  "family_id" UUID NOT NULL REFERENCES "auth_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "parent_id" UUID REFERENCES "refresh_tokens"("id") ON UPDATE CASCADE,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "consumed_at" TIMESTAMPTZ(3)
);
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE UNIQUE INDEX "refresh_tokens_parent_id_key" ON "refresh_tokens"("parent_id");
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");
CREATE TABLE "access_grants" (
  "jti" UUID PRIMARY KEY,
  "family_id" UUID NOT NULL REFERENCES "auth_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "expires_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "access_grants_family_id_idx" ON "access_grants"("family_id");
CREATE INDEX "access_grants_expires_at_idx" ON "access_grants"("expires_at");
