import { createDatabase } from "@swiftdrop/db";
import { loadConfig } from "./shared/config.js";
import { cleanupAuth } from "./modules/auth/index.js";
const config = loadConfig();
const db = createDatabase(config.DATABASE_URL);
try {
  const removed = await cleanupAuth(db);
  console.log(
    `Removed up to ${removed.grants} expired grants, ${removed.families} expired families, ${removed.verificationTokens} expired verification tokens and ${removed.oauthTransactions} expired OAuth transactions. Run in bounded scheduled batches.`,
  );
} finally {
  await db.$disconnect();
}
