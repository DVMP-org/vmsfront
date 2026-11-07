import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const packagesRoot = path.resolve("packages");
const forbiddenImport = /^(?:@\/|apps\/|src\/|store\/|stores\/|next(?:\/|$))/;
const importPattern =
  /(?:import|export)\s+(?:[^"'()]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(target)));
    } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(target);
    }
  }
  return files;
}

const violations = [];
for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const sourceRoot = path.join(packagesRoot, entry.name, "src");
  let files;
  try {
    files = await sourceFiles(sourceRoot);
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1] || match[2];
      if (forbiddenImport.test(specifier)) {
        violations.push(`${path.relative(".", file)} imports ${specifier}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Shared package boundary violations:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("Shared package boundaries are clean.");
}
