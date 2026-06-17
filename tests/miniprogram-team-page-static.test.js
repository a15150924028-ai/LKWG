const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const pageJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.js"),
  "utf8"
);
const pageWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.wxml"),
  "utf8"
);
const pageWxss = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.wxss"),
  "utf8"
);
const pageJson = JSON.parse(fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.json"),
  "utf8"
));
assert.strictEqual(
  pageJson.usingComponents["field-picker"],
  "/components/field-picker/index"
);
assert.strictEqual(
  pageJson.usingComponents["floating-picker"],
  "/components/floating-picker/index"
);
assert(pageJs.includes("activeTeamIndex: 0"));
assert(pageJs.includes("progressPercent: 0"));
assert(pageJs.includes("selectTeamSlot("));
assert(pageWxml.includes('wx:for="{{teamOverview}}"'));
assert(pageWxml.includes('data-team-slot="{{slot.slot}}"'));
assert(
  pageWxml.includes('<view\n      wx:for="{{teamOverview}}"'),
  "team overview slots should be view-based cards, not native buttons with WeChat button layout quirks"
);
assert(
  !pageWxml.includes('<button\n      wx:for="{{teamOverview}}"'),
  "team overview slots must not use native button elements because they can overlap adjacent grid cells"
);
assert(pageWxml.includes("activePet"));
assert(!pageWxml.includes('wx:for="{{team}}"'));
assert(pageWxml.includes("<page-meta"));
assert(pageWxml.includes("pickerScrollLocked"));
assert(pageWxml.includes("overflow: hidden"));
assert.strictEqual(
  (pageWxml.match(/bind:open="onPickerOpen"/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every team field-picker must open the shared floating picker"
);
assert.strictEqual(
  (pageWxml.match(/data-picker-handler=/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every team field-picker must declare its selection handler"
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

for (const binding of [
  "selectTeamSlot",
  "onMonsterChange",
  "onBloodlineChange",
  "onNatureChange",
  "onTalentChange",
  "onSkillChange",
  "rotateSkills",
  "undoRotation",
  "clearTeam"
]) {
  assert(
    pageJs.includes(`${binding}(`),
    `team page is missing ${binding}`
  );
}

assert(pageWxml.includes("配置完成"));
assert(pageWxml.includes("撤回过山车"));
assert(pageWxml.includes("team-progress-track"), "team page should render a Liquid Glass progress track");
assert(pageWxml.includes("team-progress-fill"), "team page should render a gradient progress fill");
assert(pageWxml.includes("progressPercent"), "team progress fill should be driven by view data");
assert(pageWxss.includes("rgba(255, 255, 255, 0.52)"), "team toolbar/cards should use wetter translucent glass cards");
assert(pageWxss.includes("backdrop-filter: blur(24rpx)"), "team large cards should use stronger glass blur");
assert(pageWxss.includes("0 16rpx 40rpx rgba(80, 110, 160, 0.16)"), "team large cards should use softer deeper glass shadows");
assert(pageWxss.includes("linear-gradient(90deg, #46D8CF, #6C63FF)"), "team progress fill should use teal to purple gradient");
assert(pageWxss.includes("border-radius: 999rpx"), "team action buttons and chips should be pill shaped");
assert(
  /\.detail-panel\s*{[^}]*background:\s*rgba\(255, 255, 255, 0\.46\);[^}]*backdrop-filter:\s*blur\(18rpx\);/s.test(pageWxss),
  "team passive/detail panels should use softer independent glass with blur, not a solid white fill"
);
assert(
  !pageWxss.includes("linear-gradient(135deg, rgba(108, 99, 255, 0.08), rgba(70, 216, 207, 0.08))"),
  "team passive/detail panels must not keep the old blue-green gradient background"
);
assert(
  /\.team-slot\s*{[^}]*box-sizing:\s*border-box;[^}]*width:\s*100%;[^}]*overflow:\s*hidden;/s.test(pageWxss),
  "team overview slots must be independent grid boxes that cannot overflow into adjacent slots"
);
assert(
  /\.team-slot\.active\s*{[^}]*box-shadow:\s*inset 0 0 0 2rpx rgba\(77, 163, 255, 0\.45\)/s.test(pageWxss),
  "active team slots should use an internal selection ring instead of an overlapping outer glow"
);
assert(
  pageWxml.includes('src="/assets/roller-skill.png"'),
  "roller action must show the synchronized web icon"
);
assert(pageWxml.includes('class="roller-button-icon"'));
assert(pageJs.includes("catalog.getPassive"), "team view must resolve monster passives");
assert(pageJs.includes("catalog.getSkill"), "team view must resolve selected skill details");
assert(
  pageJs.includes("const allSkillOptions = optionsWithBlank(catalog.skillOptions);"),
  "team skill configuration must expose the full skill catalog, not only the selected monster's native skill list"
);
assert(
  !pageJs.includes("const skillOptions = optionsWithBlank(catalog.monsterSkillOptions(pet.monsterId));"),
  "team skill configuration must not rebuild its picker from monsterSkillOptions"
);
assert(pageJs.includes("passives:"), "team view must expose passive details");
assert(pageJs.includes("skillDetails:"), "team view must expose selected skill details");
assert(pageWxml.includes("特性"), "team cards must show passive details");
assert(pageWxml.includes("技能说明"), "team cards must show selected skill details");
assert(
  pageWxml.includes("{{passive.description}}"),
  "team cards must render passive descriptions"
);
assert(
  pageWxml.includes("{{skillDetail.description}}"),
  "team cards must render selected skill descriptions"
);
assert(pageJs.includes("storage.saveTeam"));
assert(pageJs.includes("progressPercent: Math.round((configuredCount / 6) * 100)"));
assert(pageJs.includes("wx.showModal"));
assert(!pageWxml.includes("rollerSelection"));
assert(!pageWxml.includes('data-picker-handler="onRollerSkillChange"'));

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

assert(pageJs.includes("const BOSS_MONSTER_NAMES = new Set(["));
for (const name of bossMonsterNames) {
  assert(
    pageJs.includes(`"${name}"`),
    `team boss whitelist is missing ${name}`
  );
}
assert(pageJs.includes('bloodlineId = isBossMonster(monster) ? "bloodline-boss" : "";'));

const catalog = require(path.join(packageRoot, "miniprogram", "data", "catalog.js"));

function representativeMonster(baseName) {
  return catalog.monsterOptions.find((option) => {
    const monster = catalog.getMonster(option.id);
    const aliases = monster?.aliases || [];
    return monster?.name === baseName
      || monster?.name.startsWith(`${baseName}（`)
      || aliases.includes(baseName);
  });
}

let capturedPage = null;
global.Page = (config) => {
  capturedPage = config;
};
global.wx = {
  getStorageSync() {
    return null;
  },
  setStorageSync() {},
  removeStorageSync() {},
  showModal() {}
};
delete require.cache[require.resolve(path.join(packageRoot, "miniprogram", "pages", "team", "index.js"))];
require(path.join(packageRoot, "miniprogram", "pages", "team", "index.js"));
assert(capturedPage, "team page must register a Page config");

function createPageInstance() {
  return {
    ...capturedPage,
    data: JSON.parse(JSON.stringify(capturedPage.data)),
    setData(update) {
      this.data = {
        ...this.data,
        ...update
      };
    }
  };
}

for (const bossName of bossMonsterNames) {
  const representative = representativeMonster(bossName);
  assert(representative, `missing representative monster for ${bossName}`);
  const pageInstance = createPageInstance();
  pageInstance.onLoad();
  pageInstance.applyTeam(undefined, false);
  const optionIndex = pageInstance.data.monsterOptions.findIndex((option) => option.id === representative.id);
  assert(optionIndex > 0, `missing team monster option for ${bossName}`);
  pageInstance.onMonsterChange({
    currentTarget: { dataset: { petIndex: 0 } },
    detail: { index: optionIndex }
  });
  assert.strictEqual(
    pageInstance.data.team[0].bloodlineId,
    "bloodline-boss",
    `${bossName} should auto-fill boss bloodline in team editor`
  );
}

const nonBoss = catalog.monsterOptions.find((option) => {
  const monster = catalog.getMonster(option.id);
  return monster?.name === "音速犬";
});
assert(nonBoss, "missing non-boss 音速犬 fixture");
const nonBossPage = createPageInstance();
nonBossPage.onLoad();
nonBossPage.applyTeam(undefined, false);
const nonBossIndex = nonBossPage.data.monsterOptions.findIndex((option) => option.id === nonBoss.id);
assert(nonBossIndex > 0, "missing team monster option for 音速犬");
nonBossPage.onMonsterChange({
  currentTarget: { dataset: { petIndex: 0 } },
  detail: { index: nonBossIndex }
});
assert.strictEqual(
  nonBossPage.data.team[0].bloodlineId,
  "",
  "non-boss monsters should not keep or receive boss bloodline"
);

console.log("miniprogram team page static checks passed");
