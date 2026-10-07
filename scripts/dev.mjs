import { watch } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";

const root = resolve(import.meta.dirname, "..");
let building = false;
let queued = false;
async function build() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const status = await new Promise((resolveExit) => {
    const child = spawn(process.execPath, ["scripts/build.mjs"], {
      cwd: root,
      stdio: "inherit",
    });
    child.on("exit", resolveExit);
  });
  building = false;
  if (queued) {
    queued = false;
    return build();
  }
  return status;
}
if ((await build()) !== 0) process.exit(1);
serve();
let timer;
for (const dir of ["src", "public"])
  watch(resolve(root, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
