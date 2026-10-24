// Builds the phone-app version of the site: a static export of the pages in
// out/, copied into the iOS and Android projects by `cap sync`.
//
// A static export can't contain server routes, so app/api is moved aside for
// the duration of the build. The app calls the live site's /api routes
// instead (NEXT_PUBLIC_API_BASE in .env.app).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, renameSync } from "node:fs";

const API_DIR = "app/api";
const PARKED_DIR = "app/_api.parked";

function run(cmd, args, env) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32", env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const env = { ...process.env, BUILD_TARGET: "app" };
for (const line of readFileSync(".env.app", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  // Values already in the environment (e.g. from CI) win over the file.
  if (m && !env[m[1]]) env[m[1]] = m[2];
}

if (existsSync(PARKED_DIR)) {
  console.error(`${PARKED_DIR} exists: a previous build:app was interrupted. Move it back to ${API_DIR} first.`);
  process.exit(1);
}

renameSync(API_DIR, PARKED_DIR);
try {
  run("npx", ["next", "build"], env);
} finally {
  renameSync(PARKED_DIR, API_DIR);
}
run("npx", ["cap", "sync"], env);
