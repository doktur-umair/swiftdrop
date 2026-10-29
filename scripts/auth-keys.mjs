import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
if (process.env.NODE_ENV === "production")
  throw new Error("Provision production keys through your secret manager.");
const dir = new URL("../.local/auth/", import.meta.url);
const names = [
  "private.pem",
  "public-keys.json",
  "csrf.key",
  "rate-limit.key",
  "oauth.key",
];
const existing = names.filter((name) => existsSync(new URL(name, dir)));
if (
  existing.length &&
  existing.length === names.length - 1 &&
  !existing.includes("oauth.key")
) {
  writeFileSync(
    new URL("oauth.key", dir),
    randomBytes(48).toString("base64url"),
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    "Added the OAuth transaction key without changing existing development keys.",
  );
  process.exit(0);
}
if (existing.length)
  throw new Error(
    "Keys already exist; use a separate directory for rotation. Existing files were preserved.",
  );
mkdirSync(dir, { recursive: true, mode: 0o700 });
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 3072,
});
const values = [
  privateKey.export({ type: "pkcs8", format: "pem" }),
  JSON.stringify({
    "local-1": publicKey.export({ type: "spki", format: "pem" }),
  }),
  randomBytes(48).toString("base64url"),
  randomBytes(48).toString("base64url"),
  randomBytes(48).toString("base64url"),
];
names.forEach((name, index) =>
  writeFileSync(new URL(name, dir), values[index], { mode: 0o600, flag: "wx" }),
);
console.log(
  "Development signing, CSRF and OAuth transaction keys created in ignored .local/auth.",
);
