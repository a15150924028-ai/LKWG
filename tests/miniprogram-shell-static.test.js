const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const projectConfig = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "project.config.json"), "utf8")
);

assert.strictEqual(
  projectConfig.miniprogramRoot,
  "miniprogram/",
  "project.config.json must point WeChat Developer Tools at miniprogram/"
);

assert(
  !fs.existsSync(path.join(root, "miniprogram")),
  "the old root miniprogram directory must be moved into lkwgwechat"
);
assert(
  !fs.existsSync(path.join(root, "project.config.json")),
  "the WeChat project config must be moved into lkwgwechat"
);

const appJsonPath = path.join(packageRoot, "miniprogram", "app.json");
assert(fs.existsSync(appJsonPath), "miniprogram/app.json must exist");

const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
const appWxss = fs.readFileSync(path.join(packageRoot, "miniprogram", "app.wxss"), "utf8");
assert.deepStrictEqual(appJson.pages, [
  "pages/team/index",
  "pages/analysis/index",
  "pages/pvp/index"
]);
assert.deepStrictEqual(
  appJson.tabBar.list.map((item) => item.text),
  ["队伍", "分析", "PVP"]
);
assert.strictEqual(appJson.window.navigationBarBackgroundColor, "#f7f8ff");
assert.strictEqual(appJson.window.backgroundColor, "#eef7ff");
assert.strictEqual(appJson.tabBar.selectedColor, "#4DA3FF");
assert(
  appWxss.includes("linear-gradient(180deg, #F7F8FF 0%, #EEF7FF 45%, #F8FFFB 100%)"),
  "Mini Program global background should use the Liquid Glass page gradient from style.md"
);
assert(appWxss.includes("backdrop-filter: blur(18rpx)"), "global glass cards should use blur");
assert(appWxss.includes("rgba(255, 255, 255, 0.62)"), "global cards should use translucent glass white");
assert(appWxss.includes("border-radius: 48rpx"), "global hero cards should use large Liquid Glass radii");
assert(appWxss.includes("linear-gradient(135deg, #7C6DFF 0%, #4DA3FF 100%)"), "global primary buttons should use blue-purple gradient");
assert(appWxss.includes("padding-bottom: calc(120rpx + env(safe-area-inset-bottom))"), "pages should reserve space for the glass tab bar");

for (const page of appJson.pages) {
  for (const extension of ["js", "json", "wxml", "wxss"]) {
    const file = path.join(packageRoot, "miniprogram", `${page}.${extension}`);
    assert(fs.existsSync(file), `missing Mini Program page file: ${page}.${extension}`);
  }
}

for (const file of ["app.js", "app.wxss", "sitemap.json"]) {
  assert(
    fs.existsSync(path.join(packageRoot, "miniprogram", file)),
    `missing miniprogram/${file}`
  );
}

console.log("miniprogram shell static checks passed");
