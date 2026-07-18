import { getMigrations } from "better-auth/db/migration";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { auth } = await import("../src/lib/auth");
  const { database } = await import("../src/lib/database");

  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);

  if (toBeCreated.length === 0 && toBeAdded.length === 0) {
    console.log("Better Auth schema is already up to date.");
  } else {
    console.log(`Creating ${toBeCreated.length} table(s) and adding ${toBeAdded.length} column(s).`);
    await runMigrations();
    console.log("Better Auth migration completed.");
  }

  await database.end();
}

main().catch((error) => {
  console.error("Better Auth migration failed", error);
  process.exitCode = 1;
});
