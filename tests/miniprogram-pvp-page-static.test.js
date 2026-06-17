const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const pageJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.js"),
  "utf8"
);
const pageWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.wxml"),
  "utf8"
);
const pageJson = JSON.parse(fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.json"),
  "utf8"
));
const statGridWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "components", "stat-grid", "index.wxml"),
  "utf8"
);
const pickerWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "components", "field-picker", "index.wxml"),
  "utf8"
);
const pickerWxss = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "components", "field-picker", "index.wxss"),
  "utf8"
);
const pageWxss = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.wxss"),
  "utf8"
);
const buildRulesJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "domain", "generated", "build-rules.js"),
  "utf8"
);

assert.strictEqual(
  pageJson.usingComponents["field-picker"],
  "/components/field-picker/index"
);
assert.strictEqual(
  pageJson.usingComponents["floating-picker"],
  "/components/floating-picker/index"
);
assert.strictEqual(
  pageJson.usingComponents["stat-grid"],
  "/components/stat-grid/index"
);
assert.strictEqual(
  (pageWxml.match(/<field-picker/g) || []).length,
  5,
  "PVP must keep only the compact selector templates: monster/team, bloodline, nature, talents, and skill picker"
);
assert(pageWxml.includes("<page-meta"));
assert(pageWxml.includes("pickerScrollLocked"));
assert(pageWxml.includes("overflow: hidden"));
assert.strictEqual(
  (pageWxml.match(/bind:open="onPickerOpen"/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every PVP field-picker must open the shared floating picker"
);
assert.strictEqual(
  (pageWxml.match(/data-picker-handler=/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every PVP field-picker must declare its selection handler"
);
assert.strictEqual((pageWxml.match(/<floating-picker/g) || []).length, 1);
assert(pageWxml.includes('bind:select="onFloatingPickerSelect"'));
assert(pageWxml.includes('bind:close="onFloatingPickerClose"'));
assert(pageJs.includes("pickerScrollLocked: false"));
assert(pageJs.includes("floatingPicker:"));
assert(pageJs.includes("onPickerOpen("));
assert(pageJs.includes("onFloatingPickerSelect("));
assert(pageJs.includes("onFloatingPickerClose("));
assert(pageJs.includes("pickerHandler"));
assert(pageJs.includes("allyMonsterOptions"));
assert(pageJs.includes("buildMergedMonsterOptions("));
assert(pageJs.includes("source: \"team\""));
assert(
  pageJs.includes("const allSkillOptions = optionsWithBlank(catalog.skillOptions);"),
  "PVP skill configuration must expose the full skill catalog"
);
assert(
  !pageJs.includes("const skillOptions = optionsWithBlank(catalog.monsterSkillOptions(state.monsterId));"),
  "PVP skill configuration must not limit the picker to the selected monster's native skill list"
);
assert(
  pageJs.includes("state.skillIds = state.skillIds.map((id) => catalog.getSkill(id) ? id : \"\");"),
  "PVP state sanitization must preserve any valid catalog skill selected in the skill configuration"
);
assert(pageJs.includes("forceImpactSkill("));
assert(pageJs.includes("forceImpactOption("));
assert(pageJs.includes("onSkillActionTap("));
assert(pageJs.includes("advancedExpanded: { ally: false, enemy: false }"));
assert(pageJs.includes("onToggleAdvanced("));
assert(pageJs.includes("advancedModifierCount("));
assert(pageJs.includes("showTraitLayers"));
assert(pageJs.includes("resultTitle"));
assert(pageJs.includes("resultMeta"));
assert(pageJs.includes("responseVariants"));
assert(pageJs.includes("weatherClass"));
assert(pageJs.includes("icon: \"/assets/type-icons/water.png\""));
assert(pageJs.indexOf('key: "hitCount"') < pageJs.indexOf('key: "energy"'), "Energy must be placed after hit count in the compact control grid.");
assert(pageJs.includes("storage.loadTeam"));
assert(!pageWxml.includes('label="从队伍导入"'), "PVP ally team import must be merged into the monster selector.");
assert(!pageWxml.includes("teamPetOptions"), "PVP page must not render a separate team-pet selector.");
assert(!pageWxml.includes('label="本回合技能"'), "PVP page must use skill-card taps instead of a separate current-skill selector.");
assert(!pageWxml.includes("设为本回合"), "Skill cards must not show a separate current-turn button label.");
assert(!pageWxml.includes("本回合"), "Skill cards and Force Impact must use visual selection without current-turn text.");
assert(!pageWxml.includes("side.forceImpact.hint"), "Force Impact must not render secondary helper text below the button.");
assert(!pageWxml.includes('<text class="section-title">天气</text>'), "Weather card must not render the weather section title.");
assert(!pageJs.includes("onTeamPetChange("));
assert(!pageJs.includes("onActionChange("));
assert(!pageJs.includes("actionOptions"));
assert(!pageJs.includes("actionSelection"));
assert(pageWxml.includes("side.monsterOptions"));
assert(pageWxml.includes("side.skillCards"));
assert(pageWxml.includes("skill-action-grid"));
assert(pageWxml.includes("data-action-skill-id"));
assert(pageWxml.includes("force-action-row"));
assert(
  pageWxml.includes('active="{{skillCard.active}}"'),
  "PVP selected skill cards should apply the selected frame directly to the field-picker, not an outer wrapper."
);
assert(pageWxml.includes('open-on-tap="{{!skillCard.skillId}}"'));
assert(pageWxml.includes('show-edit-trigger="{{!!skillCard.skillId}}"'));
assert(pageWxml.includes("wx:if=\"{{side.showTraitLayers}}\""));
assert(pageWxml.includes("weatherItem.icon"));
assert(pageWxml.includes("{{weatherItem.weatherClass}}"));
assert(
  pageWxml.includes('<view\n          class="weather-button'),
  "PVP weather choices should be view-based segmented cells, not native buttons with WeChat button layout quirks."
);
assert(
  !pageWxml.includes('<button\n          class="weather-button'),
  "PVP weather choices must not use native button elements because they can overlap adjacent segmented cells."
);
assert(pageWxml.includes("side.forceImpact.label"));
assert(!pageWxml.includes("side.result.resultTitle"), "PVP result card must not repeat the damage summary as a black text line.");
assert(!pageWxml.includes("damage-line-title"), "PVP result card should keep only the colored damage number and subtitle.");
assert(pageWxml.includes("side.result.damage"));
assert(pageWxml.includes("side.result.hpPercent"));
assert(pageWxml.includes("side.result.resultMeta"));
assert(pageWxml.includes("side.result.responseVariants"));
assert(pageWxml.includes("advanced-toggle"));
assert(pageWxml.includes("side.advancedOpen"));
assert(pageWxml.includes("side.advancedModifierCount"));
assert(pageWxml.includes("wx:if=\"{{side.advancedOpen}}\""), "PVP advanced modifiers must be collapsed by default and expand on demand.");
assert(pageWxml.includes("damage-main-number"), "PVP result should promote the final damage as a large number.");
assert(!pageWxml.includes("sticky-calculate-button"), "PVP page should not show the bottom immediate-calculate sticky window.");
assert(!pageWxml.includes("立即计算伤害"), "PVP page should remove the bottom immediate-calculate text.");
assert(!pageJs.includes("scrollToResults("), "PVP page should remove the now-unused sticky calculate scroll handler.");
assert(pageWxml.includes("清空{{side.title}}"), "PVP clear button should say 清空我方 or 清空敌方 according to the side card.");
assert(!pageWxml.includes("清空本方"), "Enemy PVP side must not show the ally-only 清空本方 label.");
assert(pageWxml.includes("compact-control-grid"), "PVP manual controls should share one compact three-column grid.");
assert(!pageWxml.includes('class="counter-row"'), "Trait layers should not occupy a separate row above the compact control grid.");
assert(pageWxml.includes('<text class="counter-label">{{side.traitName}}</text>'), "Trait layer control should use only the trait name as its compact label.");
assert(!pageWxml.includes("特性层数 ·"), "Trait layer control must not spend compact-grid width on the four-character prefix.");
assert(pageWxss.includes("grid-template-columns: repeat(3, minmax(0, 1fr))"), "PVP manual controls should fit three items per row.");
assert(pageWxss.includes("text-overflow: ellipsis"), "Compact PVP control labels must truncate instead of pushing into steppers.");
assert(pageWxss.includes("grid-template-columns: 48rpx minmax(42rpx, 1fr) 48rpx"), "PVP advanced steppers should use larger +/- controls.");
assert(pageWxss.includes("height: 48rpx"), "PVP advanced +/- buttons should be tall enough to tap comfortably.");
assert(pageWxss.includes("font-size: 34rpx"), "PVP advanced +/- symbols should be visibly larger.");
assert(pageWxss.includes("rgba(255, 255, 255, 0.62)"), "PVP cards should use translucent glass cards.");
assert(pageWxss.includes("linear-gradient(135deg, #607089, #4DA3FF)"), "PVP selected weather should use the Liquid Glass segmented gradient.");
assert(pageWxss.includes("linear-gradient(135deg, rgba(77, 163, 255, 0.13), rgba(70, 216, 207, 0.12))"), "PVP damage card should use the blue/teal result gradient.");
assert(pageWxss.includes("font-size: 64rpx"), "PVP damage result should use a large numeric display.");
assert(!pageWxss.includes(".sticky-calculate-button"), "PVP stylesheet should not keep the removed sticky calculate button.");
assert(
  /\.weather-button\s*{[^}]*box-sizing:\s*border-box;[^}]*width:\s*100%;[^}]*overflow:\s*hidden;/s.test(pageWxss),
  "PVP weather buttons must be independent segmented cells that cannot overlap adjacent cells."
);
assert(
  /\.weather-button\.active\s*{[^}]*box-shadow:\s*inset 0 0 0 1rpx rgba\(255, 255, 255, 0\.35\)/s.test(pageWxss),
  "PVP selected weather buttons should use an internal highlight instead of an overlapping outer glow."
);
assert(
  !/\.weather-button\.active\s*{[^}]*box-shadow:\s*0 /s.test(pageWxss),
  "PVP selected weather buttons must not use external glow shadows that bleed into neighboring buttons."
);
assert(!pageWxml.includes('<text class="counter-label">能量</text>'), "Energy must move into the compact control grid instead of its own row.");
assert(!pageWxml.includes("damage-grid"), "PVP result must use the compact line-style result instead of the large metric grid.");
assert(!pageWxss.includes(".damage-line-title"), "PVP result should not keep styles for the removed duplicate black summary line.");
for (const removedResultLabel of ["计算模式", "最终威力", "连击数", "单段伤害", "总伤害"]) {
  assert(!pageWxml.includes(removedResultLabel), `PVP result must not render large-card label: ${removedResultLabel}`);
}
assert(pageJs.includes("原力冲击"));
assert(
  !pageJs.includes('label: "愿力冲击 / 原力冲击"'),
  "PVP Force Impact action row should display only 原力冲击, not two names."
);
assert(!pickerWxml.includes("<input"), "PVP field-picker must be read-only");
assert(!pickerWxml.includes("suggestion-list"), "PVP field-picker must not inline suggestions");
assert(!pickerWxml.includes("<picker"), "PVP must not fall back to native picker");
assert(pickerWxml.includes("field-label-chip"), "PVP selectors must use embedded border labels to reduce height.");
assert(pickerWxml.includes("field-frame"), "PVP selectors must render the compact inner frame.");
assert(
  pickerWxml.includes("{{active ? 'active' : ''}}"),
  "field-picker should expose an active class so selected skill frames can merge with the picker frame."
);
assert(
  /\.field-picker\.active \.field-frame\s*{[^}]*border-color:\s*rgba\(77, 163, 255, 0\.65\);/s.test(pickerWxss),
  "field-picker selected state should draw the blue frame on the inner field itself."
);
assert(
  !/\.skill-action-row\.active\s*{[^}]*padding:\s*3rpx/s.test(pageWxss),
  "PVP skill selection must not add an outer active frame with padding around the picker."
);
assert(statGridWxml.includes("nature-up"));
assert(statGridWxml.includes("nature-down"));
assert(statGridWxml.includes("talent-mark"));
assert(statGridWxml.includes("stat-inline-row"), "Stat labels and values must share one inline row to reduce vertical height.");
assert(pageWxss.includes(".force-action-row"), "Force Impact must occupy its own full-width row in the skill grid.");
assert(pageWxss.includes("grid-column: 1 / -1"), "Force Impact row must span the full grid width.");
assert(pageWxss.includes("justify-content: center"), "Force Impact row should center its content inside the full-width bar.");
assert(pageWxss.includes("white-space: nowrap"), "Force Impact row text must stay on one line.");
assert(pageWxss.includes("width: 100%"), "Force Impact row should stretch full width instead of staying as a centered narrow button.");
assert(
  pageWxml.includes('<view\n            class="force-action-button force-action-row'),
  "Force Impact row should be a view-based full-row control, not a native button that can shrink visually."
);
assert(
  !pageWxml.includes('<button\n            class="force-action-button'),
  "Force Impact row must not use a native button for the full-width row."
);
assert(
  /\.force-action-button\s*{[^}]*box-sizing:\s*border-box;[^}]*width:\s*100%;[^}]*border:\s*1rpx solid rgba\(190, 205, 225, 0\.55\);/s.test(pageWxss),
  "Force Impact full-width row should draw a full-row border."
);
assert(pageWxss.includes(".default-note"));
assert(pageWxss.includes("color: #d92d20"), "Default build note should be highlighted in red.");
assert(
  /\.advanced-toggle\s*{[^}]*background:\s*rgba\(255, 255, 255, 0\.58\);/s.test(pageWxss),
  "PVP advanced toggle should use neutral white glass, not a blue-green colored fill"
);
assert(
  !pageWxss.includes("linear-gradient(135deg, rgba(108, 99, 255, 0.08), rgba(70, 216, 207, 0.08))"),
  "PVP surfaces must not keep the old blue-green gradient background"
);
assert(pageWxss.includes(".preset-button"), "Enemy preset buttons must keep dedicated styling.");
assert(pageWxml.includes("preset-button-label"), "Enemy preset buttons should render an explicit label wrapper for reliable centering.");
assert(!pageWxml.includes("preset-hidden-labels"), "Enemy preset labels should come from the real segmented control, not hidden fallback text.");
assert(pageWxss.includes(".preset-button-label"), "Enemy preset buttons should style the inner label wrapper directly.");
assert(pageWxss.includes("border-radius: 999rpx"), "Enemy preset buttons should use full pill corners instead of small rounded corners.");
assert(pageWxss.includes("width: 100%"), "Enemy preset buttons should stretch to fill their grid cells.");
assert(pageWxss.includes("height: 58rpx"), "Enemy preset buttons should keep a fixed height for stable centering.");
assert(pageWxss.includes("display: flex"), "Enemy preset buttons should use flex centering instead of relying on native button text layout.");
assert(pageWxss.includes("justify-content: center"), "Enemy preset buttons should center content horizontally.");
assert(pageWxss.includes("align-items: center"), "Enemy preset buttons should center content vertically.");
assert(pageWxss.includes("min-height: 58rpx"), "Enemy preset buttons should keep stable button height.");
assert(pageJs.includes("未应对成功"));
assert(pageJs.includes("应对成功"));
assert(
  pageJs.includes("const adjustableStatKeys = Object.keys(statLabels).filter((key) => key !== \"hp\");"),
  "PVP compact manual controls must omit HP/生命 while keeping the HP stat available for display and damage formulas."
);
assert(
  pageJs.includes("...adjustableStatKeys.map((key) => ({"),
  "PVP compact manual controls should be built from adjustableStatKeys, not every stat label."
);
assert(
  !pageJs.includes("Math.min(100, Math.round((settled.damage / defenderMaxHp) * 100))"),
  "PVP HP-loss percentage must show the real damage ratio instead of clamping at 100%."
);
assert(
  pageJs.includes("const hpPercent = Math.max(0, Math.round((settled.damage / defenderMaxHp) * 100));"),
  "PVP HP-loss percentage should keep overkill values such as 125% visible."
);

for (const handler of [
  "onMonsterChange",
  "onBloodlineChange",
  "onNatureChange",
  "onTalentChange",
  "onSkillChange",
  "onSkillActionTap",
  "selectPreset",
  "selectWeather",
  "adjustValue",
  "clearSide"
]) {
  assert(pageJs.includes(`${handler}(`), `PVP page is missing ${handler}`);
}

for (const text of [
  "\u6280\u80fd\u63cf\u8ff0"
]) {
  assert(pageWxml.includes(text), `PVP page is missing visible text: ${text}`);
}
for (const presetLabel of ["\u6700\u8089", "\u6700\u901f", "\u6700\u9ad8\u653b\u51fb"]) {
  assert(buildRulesJs.includes(presetLabel), `PVP preset label is missing from build rules: ${presetLabel}`);
}
assert(pageJs.includes('label: "能量"'), "Energy must still be available as a compact control item.");

assert(pageJs.includes("damageCore.calculateDamage"));
assert(pageJs.includes("damageRules.resolvePvpVariableDamage"));
assert(pageJs.includes("turn.resolveTurnOrder"));
assert(pageJs.includes("storage.savePvp"));
assert(
  pageJs.includes("const attackerBaseStats = damageStatValues(attacker, attackerState, attackerTrait);"),
  "PVP damage must keep an unboosted base stat snapshot for formula attack/defense inputs."
);
assert(
  pageJs.includes("const attackerStats = damageStatValues(attacker, attackerState, attackerTrait, attackerMods);"),
  "PVP variable damage and turn order may use the fully boosted battle stats."
);
assert(
  pageJs.includes("damageMode(action, attackerBaseStats, defenderBaseStats)"),
  "PVP damage mode must match the web path and choose physical/special from base battle stats."
);
assert(
  pageJs.includes("attackerState.skillStatMods") && pageJs.includes("defenderState.skillStatMods"),
  "PVP ability-level calculation must include settled skill stat changes, not only manual changes."
);
assert(
  pageJs.includes("attack: attackerBaseStats[attackKey]") && pageJs.includes("defense: defenderBaseStats[defenseKey]"),
  "PVP core damage attack/defense inputs must use base battle stats so passive percentage boosts are not double-counted."
);

const catalog = require(path.join(packageRoot, "miniprogram", "data", "catalog.js"));
const pvpState = require(path.join(packageRoot, "miniprogram", "domain", "pvp-state.js"));

let capturedPage = null;
global.Page = (config) => {
  capturedPage = config;
};
global.wx = {
  getStorageSync() { return null; },
  setStorageSync() {},
  removeStorageSync() {}
};
delete require.cache[require.resolve(path.join(packageRoot, "miniprogram", "pages", "pvp", "index.js"))];
require(path.join(packageRoot, "miniprogram", "pages", "pvp", "index.js"));
assert(capturedPage, "PVP page config must be loadable in the static harness");

const pageInstance = {
  ...capturedPage,
  data: JSON.parse(JSON.stringify(capturedPage.data)),
  setData(update) {
    this.data = { ...this.data, ...update };
  }
};
const speedDog = catalog.bundle.monsters.find((monster) => monster.name === "音速犬");
const burn = catalog.bundle.skills.find((skill) => skill.name === "灼伤");
assert(speedDog && burn, "音速犬 and 灼伤 fixtures must exist");
const dogSide = (side) => ({
  ...pvpState.defaultSide(side),
  monsterId: speedDog.id,
  natureId: "nature-jolly",
  talentIds: ["talent-hp", "talent-atk", "talent-spe"],
  traitLayers: 10,
  skillIds: [burn.id, "", "", ""],
  action: burn.id
});
pageInstance.applyState({
  ...pvpState.defaultPvpState(),
  ally: dogSide("ally"),
  enemy: dogSide("enemy")
}, false);
assert.strictEqual(
  pageInstance.data.sides[0].result.damage,
  370,
  "Mini Program PVP should match web damage for 开朗生命/物攻/速度 音速犬 灼伤 mirror matchup."
);

const waterCannon = catalog.bundle.skills.find((skill) => skill.name === "水炮");
const listeningBridge = catalog.bundle.skills.find((skill) => skill.name === "听桥");
assert(waterCannon && listeningBridge, "水炮 and 听桥 fixtures must exist");
pageInstance.applyState({
  ...pvpState.defaultPvpState(),
  ally: {
    ...dogSide("ally"),
    skillIds: [listeningBridge.id, "", "", ""],
    action: listeningBridge.id
  },
  enemy: {
    ...dogSide("enemy"),
    skillIds: [waterCannon.id, "", "", ""],
    action: waterCannon.id
  }
}, false);
const bridgeResult = pageInstance.data.sides[0].result;
const cannonResult = pageInstance.data.sides[1].result;
assert(cannonResult.singleDamage > 0, "水炮 should produce a final single-hit damage value.");
assert.strictEqual(
  bridgeResult.power,
  cannonResult.singleDamage,
  "Mini Program 听桥 response power should equal the enemy action's final single-hit damage, not the enemy skill's base power."
);
assert(
  bridgeResult.resultMeta.includes(`威力${cannonResult.singleDamage}`),
  "Mini Program 听桥 result meta should display the enemy final damage as its effective power."
);

const bossMonsterNames = [
  "彩虹独角兽",
  "叶冕魔力猫",
  "烈火战神",
  "圣水守护",
  "鸭吉吉国王",
  "波普鹿",
  "恶魔狼王",
  "风暴战犬",
  "雪影冰灵",
  "奇梦咪",
  "伊兰龙",
  "幻影荆棘",
  "蹦蹦果",
  "奇丽果",
  "女王蜂",
  "神谕鲨",
  "霜翼领主",
  "迷嶂布莱克",
  "祭礼巨像",
  "钻石蜗",
  "千棘海针",
  "圣剑骑士",
  "黑猫密探",
  "棋契陛下"
];
assert(
  pageJs.includes("const BOSS_MONSTER_NAMES = new Set(["),
  "PVP page should keep an explicit complete boss monster whitelist."
);
assert(pageJs.includes("\"鸭吉吉国王\""), "Boss whitelist must include 鸭吉吉国王 variants.");
assert(pageJs.includes("\"蹦蹦果\""), "Boss whitelist must include 蹦蹦果 variants.");

function representativeMonster(baseName) {
  return catalog.bundle.monsters.find((monster) => (
    monster.name === baseName
    || monster.name.startsWith(`${baseName}（`)
    || (monster.aliases || []).includes(baseName)
  ));
}

for (const bossName of bossMonsterNames) {
  const monster = representativeMonster(bossName);
  assert(monster, `${bossName} boss representative must exist in the local bundle.`);
  pageInstance.applyState(pvpState.defaultPvpState(), false);
  const enemyView = pageInstance.data.sides.find((side) => side.side === "enemy");
  const monsterIndex = enemyView.monsterOptions.findIndex((option) => option.id === monster.id);
  assert(monsterIndex > 0, `${monster.name} must be selectable from the enemy monster picker.`);
  pageInstance.onMonsterChange({
    currentTarget: { dataset: { side: "enemy" } },
    detail: { index: monsterIndex }
  });
  assert.strictEqual(
    pageInstance.pvpState.enemy.bloodlineId,
    "bloodline-boss",
    `${monster.name} should auto-fill 首领血脉 when selected manually.`
  );
}

pageInstance.applyState(pvpState.defaultPvpState(), false);
const enemyView = pageInstance.data.sides.find((side) => side.side === "enemy");
const speedDogIndex = enemyView.monsterOptions.findIndex((option) => option.id === speedDog.id);
pageInstance.onMonsterChange({
  currentTarget: { dataset: { side: "enemy" } },
  detail: { index: speedDogIndex }
});
assert.strictEqual(
  pageInstance.pvpState.enemy.bloodlineId,
  "",
  "Non-boss monsters should not auto-fill 首领血脉."
);

console.log("miniprogram PVP page static checks passed");
