const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const projectConfig = JSON.parse(
  fs.readFileSync(path.join(root, "project.config.json"), "utf8")
);

assert.strictEqual(
  projectConfig.miniprogramRoot,
  "miniprogram/",
  "project.config.json must point WeChat Developer Tools at miniprogram/"
);

const appJsonPath = path.join(root, "miniprogram", "app.json");
assert(fs.existsSync(appJsonPath), "miniprogram/app.json must exist");

const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
assert.deepStrictEqual(appJson.pages, [
  "pages/team/index",
  "pages/analysis/index",
  "pages/pvp/index"
]);
assert.deepStrictEqual(
  appJson.tabBar.list.map((item) => item.text),
  ["队伍", "分析", "PVP"]
);

for (const page of appJson.pages) {
  for (const extension of ["js", "json", "wxml", "wxss"]) {
    const file = path.join(root, "miniprogram", `${page}.${extension}`);
    assert(fs.existsSync(file), `missing Mini Program page file: ${page}.${extension}`);
  }
}

for (const file of ["app.js", "app.wxss", "sitemap.json"]) {
  assert(
    fs.existsSync(path.join(root, "miniprogram", file)),
    `missing miniprogram/${file}`
  );
}

console.log("miniprogram shell static checks passed");
