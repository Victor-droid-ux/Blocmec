import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const nextRoot = path.join(projectRoot, ".next");
const standaloneRoot = path.join(nextRoot, "standalone");
const standaloneNextRoot = path.join(standaloneRoot, ".next");
const staticSource = path.join(nextRoot, "static");
const staticTarget = path.join(standaloneNextRoot, "static");
const publicSource = path.join(projectRoot, "public");
const publicTarget = path.join(standaloneRoot, "public");

if (!existsSync(standaloneRoot)) {
  console.warn("Standalone build output not found. Skipping asset copy.");
  process.exit(0);
}

mkdirSync(standaloneNextRoot, { recursive: true });

if (existsSync(staticSource)) {
  cpSync(staticSource, staticTarget, { recursive: true, force: true });
}

if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true, force: true });
}

console.info("Standalone assets prepared.");
