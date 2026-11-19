// Leonida Trophy Tracker — entry program (Node 22, stdlib only).
// Copies app/ and screenshots/ from this repository to the output directory
// and writes /output/dossier.json with buildDossier from the kit's shim.
// Deterministic: files are copied byte for byte in sorted order, so two runs
// write identical bytes. No timestamps, no random data, no network.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// The bounty gate's caps, passed to buildDossier so the dossier it writes
// is the one the gate rebuilds: 160 KiB of text, 4 screenshots of at most
// 256 KiB each, app/ of at most 993 files and 48 MiB, paths of at most
// 1,000 UTF-8 bytes.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function copyTreeIntoOutput(name: string): void {
  const source = join(REPO_ROOT, name);
  const target = join(OUTPUT_DIR, name);
  if (!existsSync(source)) throw new Error("main.ts: missing " + name + "/ in the repository");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function main(): void {
  if (OUTPUT_DIR === REPO_ROOT || OUTPUT_DIR.startsWith(REPO_ROOT + "/")) {
    throw new Error("main.ts: MAKEFUN_OUTPUT_DIR must not be inside the repository");
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyTreeIntoOutput("app");
  copyTreeIntoOutput("screenshots");
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, "dossier.json"), dossier);
  console.log("Leonida Trophy Tracker handed in: app/ + screenshots/ -> " + OUTPUT_DIR);
}

main();
