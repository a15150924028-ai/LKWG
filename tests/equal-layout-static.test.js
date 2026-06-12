const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cssBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m"));
  return match ? match[1] : "";
}

function mediaBlock(query) {
  const marker = `@media ${query} {`;
  const start = html.indexOf(marker);
  assert(start !== -1, `Missing media query: ${query}`);
  const bodyStart = start + marker.length;
  let depth = 1;
  for (let index = bodyStart; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") depth -= 1;
    if (depth === 0) return html.slice(bodyStart, index);
  }
  throw new Error(`Unclosed media query: ${query}`);
}

assert(/\.view-tabs\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(html), "队伍/分析/伤害导航必须三等分。");
assert(!/\.view-tabs\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,/.test(html), "导航不应保留四列网格。");
assert(/\.actions\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(html), "过山车、撤回过山车、清空必须三等分。");
assert(/\.actions\s+\.button\s*\{[\s\S]*?width:\s*100%;/.test(html), "操作按钮必须填满各自等分列。");
assert(/\.topbar\s*\{[\s\S]*?grid-template-columns:\s*minmax\(280px,\s*0\.9fr\)\s+minmax\(360px,\s*0\.7fr\)\s+minmax\(480px,\s*1fr\)/.test(html), "桌面导航列必须有足够宽度承载三等分标签。");

const overviewBlock = cssBlock(".team-overview");
assert(/grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/.test(overviewBlock), "横屏/默认队伍概览必须六个并排。");
assert(!/overflow-x:\s*auto/.test(html), "队伍概览不应出现横向拖动条。");
assert(!/scroll-snap-type/.test(html), "队伍概览不应保留横向拖动吸附。");
assert(!/scroll-snap-align/.test(html), "队伍席位不应保留横向拖动吸附。");

const portraitBlock = mediaBlock("(max-width: 760px) and (orientation: portrait)");
assert(/\.team-overview\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(portraitBlock), "竖屏队伍概览必须上三下三。");

const phoneBlock = mediaBlock("(max-width: 760px)");
assert(/\.actions\s+\.button\s*\{[\s\S]*?padding:\s*0 6px;[\s\S]*?font-size:\s*14px;/.test(phoneBlock), "窄屏三等分操作按钮必须压缩内边距避免文字被挤坏。");

console.log("equal-layout-static.test.js passed");
