// Generates a local server-only key; prints only its non-secret SHA-256 digest.
// The matching digest must be configured in Supabase and the same key provisioned
// as an encrypted server environment value before deploying the new auth routes.
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
const path = ".env.local";
let env = "";
try {
  env = await readFile(path, "utf8");
} catch {}
const old = env.match(/^SECURITY_RPC_SECRET=(.+)$/m)?.[1]?.trim();
const secret = old || randomBytes(32).toString("base64url");
if (!/^[a-zA-Z0-9_-]{32,200}$/.test(secret))
  throw new Error(
    "Existing gateway key format needs review; it was not changed.",
  );
if (!old)
  await writeFile(
    path,
    env.trimEnd() + "\nSECURITY_RPC_SECRET=" + secret + "\n",
  );
console.log(createHash("sha256").update(secret).digest("hex"));
