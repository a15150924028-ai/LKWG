import { execFileSync } from "node:child_process";
import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

function readArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}.`);
  }
  return value;
}

function safeOutputPath(input) {
  const outputPath = path.resolve(repoRoot, input);
  const relative = path.relative(repoRoot, outputPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Output path must stay inside the repository: ${input}`);
  }
  return outputPath;
}

function gitValue(args, fallback) {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
}

async function assertFile(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error(`${relativePath} must be a file.`);
}

async function main() {
  const outputPath = safeOutputPath(readArg("--out", path.join("dist", "web")));
  const buildId = gitValue(["rev-parse", "--short", "HEAD"], "unknown");
  const commit = gitValue(["rev-parse", "HEAD"], "unknown");

  await assertFile("index.html");
  await assertFile(path.join("data", "local-bundle.json"));

  await rm(outputPath, { recursive: true, force: true });
  await mkdir(outputPath, { recursive: true });
  await cp(path.join(repoRoot, "index.html"), path.join(outputPath, "index.html"));
  await cp(path.join(repoRoot, "assets"), path.join(outputPath, "assets"), { recursive: true });
  await cp(path.join(repoRoot, "data"), path.join(outputPath, "data"), { recursive: true });

  const manifest = {
    app: "lkwg-web",
    buildId,
    commit,
    builtAt: new Date().toISOString(),
    entry: "index.html",
    files: ["index.html", "assets/", "data/local-bundle.json"]
  };

  await writeFile(path.join(outputPath, "deploy-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Built web static package at ${path.relative(repoRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
