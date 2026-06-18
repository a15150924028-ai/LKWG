const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const scriptPath = path.join(root, "scripts", "build-web-dist.mjs");
const docPath = path.join(root, "docs", "deploy-web-mainland.md");
const ignorePath = path.join(root, ".gitignore");
const testOutput = path.join(root, "dist", "test-web-mainland");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const script = read(path.join("scripts", "build-web-dist.mjs"));
const doc = read(path.join("docs", "deploy-web-mainland.md"));
const gitignore = fs.readFileSync(ignorePath, "utf8");

assert(fs.existsSync(scriptPath), "Missing web dist build script.");
assert(fs.existsSync(docPath), "Missing mainland deployment guide.");
assert(/dist\/(?:\r?\n|$)/.test(gitignore), "Generated dist/ output must be gitignored.");

for (const required of ["index.html", "assets", "data/local-bundle.json", "deploy-manifest.json"]) {
  assert(script.includes(required), `Build script must include ${required}.`);
}

assert(doc.includes("mainland China"), "Deployment guide must explicitly target mainland China users.");
assert(doc.includes("中国大陆") || doc.includes("mainland"), "Deployment guide must mention the mainland audience.");
assert(doc.includes("ICP备案") || doc.includes("ICP filing"), "Deployment guide must call out ICP filing.");
assert(doc.includes("Tencent Cloud COS") && doc.includes("Alibaba Cloud OSS"), "Deployment guide must cover COS and OSS.");
assert(doc.includes("Avoid GitHub Pages"), "Deployment guide must reject GitHub Pages as the primary mainland endpoint.");
assert(doc.includes("Upload only `dist/web/`"), "Deployment checklist must prevent uploading the repository root.");

try {
  fs.rmSync(testOutput, { recursive: true, force: true });
  childProcess.execFileSync(process.execPath, [scriptPath, "--out", testOutput], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });

  assert(fs.existsSync(path.join(testOutput, "index.html")), "Build output is missing index.html.");
  assert(fs.existsSync(path.join(testOutput, "assets", "type-icons", "fire.png")), "Build output is missing assets.");
  assert(fs.existsSync(path.join(testOutput, "data", "local-bundle.json")), "Build output is missing local data.");
  assert(!fs.existsSync(path.join(testOutput, "lkwgwechat")), "Build output must not include Mini Program source.");
  assert(!fs.existsSync(path.join(testOutput, "tests")), "Build output must not include tests.");

  const manifest = JSON.parse(fs.readFileSync(path.join(testOutput, "deploy-manifest.json"), "utf8"));
  assert(manifest.app === "lkwg-web", "Deploy manifest must identify the web app.");
  assert(manifest.entry === "index.html", "Deploy manifest must identify index.html as the entry.");
  assert(manifest.files.includes("data/local-bundle.json"), "Deploy manifest must include the local data bundle.");
} finally {
  fs.rmSync(testOutput, { recursive: true, force: true });
}

console.log("web-mainland-deploy-static.test.js passed");
