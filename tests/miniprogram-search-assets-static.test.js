const assert = require("assert");
const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const iconMatch = html.match(
  /class="button-icon roller-icon" src="data:image\/png;base64,([^"]+)"/
);

assert(iconMatch, "web roller icon must remain embedded");

const expectedIcon = Buffer.from(iconMatch[1], "base64");
const iconPath = path.join(
  packageRoot,
  "miniprogram",
  "assets",
  "roller-skill.png"
);
const actualIcon = fs.readFileSync(iconPath);

assert(actualIcon.equals(expectedIcon), "Mini Program roller icon must match web");
assert.strictEqual(actualIcon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");

const pinyinMap = require(path.join(
  packageRoot,
  "miniprogram",
  "utils",
  "generated",
  "pinyin-map"
));
assert(Object.keys(pinyinMap).length > 100, "generated pinyin map must be populated");

for (const type of [
  "grass", "water", "fire", "electric", "poison", "fantasy", "ice",
  "fighting", "cute", "light", "dragon", "mechanical", "ghost",
  "demon", "bug", "normal", "wing", "ground"
]) {
  const source = fs.readFileSync(path.join(root, "assets", "type-icons", `${type}.png`));
  const target = fs.readFileSync(path.join(
    packageRoot,
    "miniprogram",
    "assets",
    "type-icons",
    `${type}.png`
  ));
  assert(target.equals(source), `type icon must be synchronized: ${type}`);
}

const bossSource = fs.readFileSync(path.join(root, "assets", "bloodline-icons", "boss.png"));
const bossTarget = fs.readFileSync(path.join(
  packageRoot,
  "miniprogram",
  "assets",
  "bloodline-icons",
  "boss.png"
));
assert(bossTarget.equals(bossSource), "boss bloodline icon must be synchronized");

for (const stat of ["hp", "atk", "defense", "spa", "spd", "spe"]) {
  const statIcon = fs.readFileSync(path.join(
    packageRoot,
    "miniprogram",
    "assets",
    "stat-icons",
    `${stat}.png`
  ));
  assert.strictEqual(
    statIcon.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    `stat icon must be a PNG: ${stat}`
  );
}

childProcess.execFileSync(
  process.execPath,
  [path.join(packageRoot, "scripts", "sync-miniprogram-search-assets.js"), "--check"],
  { cwd: root, stdio: "pipe" }
);

console.log("miniprogram search asset synchronization checks passed");
