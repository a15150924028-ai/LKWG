const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function expect(pattern, message) {
  if (!pattern.test(html)) {
    throw new Error(message);
  }
}

function expectAbsent(pattern, message) {
  if (pattern.test(html)) {
    throw new Error(message);
  }
}

expect(/<title>rock工具<\/title>/, "页面标题必须改为rock工具");
expect(/<h1>rock工具<\/h1>/, "页头标题必须改为rock工具");
expect(/data-scroll-target="teamSection"[^>]*>队伍</, "缺少队伍导航");
expect(/data-scroll-target="resultsSection"[^>]*>分析</, "缺少分析导航");
expect(/data-scroll-target="pvpDamageSim"[^>]*>伤害</, "缺少伤害导航");
expect(/class="team-overview"/, "缺少六席队伍概览");
expect(/class="team-overview-slot/, "缺少队伍席位按钮");
expect(/class="pet-card-layout"/, "缺少单席紧凑编辑布局");
expectAbsent(/class="pet-summary"/, "队伍编辑区不应继续显示战斗摘要面板");
expect(/placeholder: "选择\/搜索血脉名称"/, "血脉占位文案不正确");
expect(/<span class="skill-meta-label">能耗<\/span>/, "技能信息必须显示能耗");
expect(/hideIcon: true/, "精灵输入框必须隐藏首字占位图标");
expect(/data:image\/png;base64,/, "使用过山车按钮必须保留内置图片");
expect(/--primary: #0071e3;/, "界面必须使用确认稿的蓝色主色");
expect(/\.type-badge\s*\{[\s\S]*border-radius: 999px;/, "属性徽章必须为圆形图标");
expect(/function calculatePvpDamage|function renderPvpDamageResult/, "PVP 伤害逻辑必须保留");
expect(/function applyPvpCuteLayerDelta/, "萌化逻辑必须保留");
expect(/function rotateSkillsDown/, "过山车逻辑必须保留");

console.log("apple-layout-static.test.js passed");
