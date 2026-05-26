import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const dist = join(root, "dist");
const base = "/exam-progress-tracker01/";

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, "src"), join(dist, "src"), { recursive: true });

const html = await readFile(join(root, "index.html"), "utf8");
await writeFile(
  join(dist, "index.html"),
  html.replace('src="/src/main.js"', `src="${base}src/main.js"`),
);

console.log("Static build created in dist/");
