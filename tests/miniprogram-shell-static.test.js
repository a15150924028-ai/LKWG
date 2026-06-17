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
assert.strictEqual(
  appJson.lazyCodeLoading,
  "requiredComponents",
  "Mini Program should enable requiredComponents lazy loading to reduce startup work in WeChat Developer Tools"
);
assert.deepStrictEqual(
  appJson.tabBar.list.map((item) => item.text),
  ["队伍", "分析", "PVP"]
);
assert.strictEqual(appJson.window.navigationBarBackgroundColor, "#f8fafc");
assert.strictEqual(appJson.window.backgroundColor, "#f4f7fb");
assert.strictEqual(appJson.tabBar.selectedColor, "#4DA3FF");
assert(
  appWxss.includes("linear-gradient(180deg, #F8FAFC 0%, #F4F7FB 100%)"),
  "Mini Program global background should use a neutral glass background without blue-green-purple wash"
);
for (const disallowedBackground of [
  "rgba(120, 190, 255, 0.28)",
  "rgba(80, 230, 200, 0.18)",
  "rgba(170, 130, 255, 0.22)"
]) {
  assert(
    !appWxss.includes(disallowedBackground),
    `global shell must not keep the old colored glow background ${disallowedBackground}`
  );
}
assert(
  !appWxss.includes(".page::before") && !appWxss.includes(".page::after") && !appWxss.includes(".hero::after"),
  "global shell must avoid pseudo-element glow layers that can destabilize the WeChat render layer"
);
assert(!appWxss.includes("backdrop-filter"), "global glass cards must not use runtime backdrop blur in Mini Program WXSS");
assert(!appWxss.includes("filter: blur"), "global shell must not use CSS blur filters in Mini Program WXSS");
assert(appWxss.includes("linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.44))"), "global glass cards should use static translucent gradients for depth");
assert(appWxss.includes("rgba(255, 255, 255, 0.52)"), "global cards should lower opacity for a wetter glass feel without losing readability");
assert(appWxss.includes("0 16rpx 40rpx rgba(80, 110, 160, 0.16)"), "global cards should use a softer deeper Liquid Glass shadow");
assert(appWxss.includes("inset 0 -1rpx 0 rgba(255, 255, 255, 0.36)"), "global cards should include an inner lower highlight edge");
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
