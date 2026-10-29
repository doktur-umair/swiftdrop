import { config } from "dotenv";
import { execFileSync } from "node:child_process";
config({ path: "../../.env", quiet: true });
const url = new URL(process.env.DATABASE_URL ?? "");
if (
  process.env.NODE_ENV === "production" ||
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.pathname !== "/swiftdrop"
)
  throw new Error(
    "Reset is restricted to the local disposable swiftdrop database.",
  );
execFileSync("pnpm", ["exec", "prisma", "migrate", "reset", "--force"], {
  stdio: "inherit",
});
execFileSync("pnpm", ["seed"], { stdio: "inherit" });
