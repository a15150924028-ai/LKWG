const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const componentRoot = path.join(
  packageRoot,
  "miniprogram",
  "components",
  "field-picker"
);
const floatingComponentRoot = path.join(
  packageRoot,
  "miniprogram",
  "components",
  "floating-picker"
);
const { searchOptions } = require(path.join(
  packageRoot,
  "miniprogram",
  "utils",
  "search-options"
));
const catalog = require(path.join(
  packageRoot,
  "miniprogram",
  "data",
  "catalog"
));
const {
  BLOODLINES,
  NATURES,
  TALENTS
} = require(path.join(
  packageRoot,
  "miniprogram",
  "domain",
  "constants"
));

const options = [
  { id: "", label: "请选择" },
  { id: "fire", label: "Fire Dragon" },
  { id: "ice", label: "寒冰龙" },
  { id: "small-ice", label: "小寒冰龙" }
];

assert.deepStrictEqual(searchOptions(options, "FIRE", 20), [
  { id: "fire", label: "Fire Dragon", index: 1 }
]);
assert.deepStrictEqual(searchOptions(options, "寒冰", 20), [
  { id: "ice", label: "寒冰龙", index: 2 },
  { id: "small-ice", label: "小寒冰龙", index: 3 }
]);
assert.deepStrictEqual(searchOptions(options, "", 2), [
  { id: "fire", label: "Fire Dragon", index: 1 },
  { id: "ice", label: "寒冰龙", index: 2 }
]);

const manyOptions = [
  { id: "", label: "请选择" },
  ...Array.from({ length: 30 }, (_, index) => ({
    id: `monster-${index}`,
    label: `精灵 ${index}`
  }))
];
assert.strictEqual(searchOptions(manyOptions, "", 20).length, 20);
assert.strictEqual(searchOptions(manyOptions, "").length, 30);

const fuzzyOptions = [
  {
    id: "fire-warrior",
    label: "烈火战神",
    aliases: ["火神"]
  },
  {
    id: "ice-dragon",
    label: "寒冰龙",
    aliases: ["冰龙"]
  },
  {
    id: "fire-dragon",
    label: "烈火龙",
    aliases: []
  }
];

assert.strictEqual(searchOptions(fuzzyOptions, "huoshen", 20)[0].id, "fire-warrior");
assert.strictEqual(searchOptions(fuzzyOptions, "lhzs", 20)[0].id, "fire-warrior");
assert.strictEqual(
  searchOptions(fuzzyOptions, "liehuozanshen", 20)[0].id,
  "fire-warrior"
);
assert.strictEqual(searchOptions(fuzzyOptions, "烈火战", 20)[0].id, "fire-warrior");
assert.deepStrictEqual(
  searchOptions(fuzzyOptions, "完全不存在", 20).map((item) => item.id),
  fuzzyOptions.map((item) => item.id)
);

assert.strictEqual(
  searchOptions(catalog.skillOptions, "hyc", 20)[0].id,
  "skill-火云车",
  "exact pinyin-initial searches such as hyc must rank 火云车 first"
);

const aliasedMonster = catalog.monsterOptions.find(
  (option) => Array.isArray(option.aliases) && option.aliases.length
);
assert(aliasedMonster, "monster options must preserve local aliases");
for (const [name, records] of [
  ["bloodline", BLOODLINES],
  ["nature", NATURES],
  ["talent", TALENTS]
]) {
  assert(
    records.every((record) => Array.isArray(record.aliases) && record.aliases.length),
    `${name} options must provide searchable aliases`
  );
  assert(
    records.every((record) => record.icon),
    `${name} options must provide selector icons`
  );
}
assert(
  BLOODLINES.some((record) => record.icon === "/assets/bloodline-icons/boss.png"),
  "boss bloodline must use the synchronized boss icon"
);
assert(
  NATURES.every((record) => record.detail && record.name.includes("↑") && record.name.includes("↓")),
  "nature options must show stat up/down details"
);
assert(
  TALENTS.every((record) => record.icon.startsWith("/assets/stat-icons/")),
  "talent options must use stat icons"
);

const teamJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.js"),
  "utf8"
);
const pvpJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.js"),
  "utf8"
);
assert(teamJs.includes("aliases: [...(item.aliases || [])]"));
assert(pvpJs.includes("aliases: [...(item.aliases || [])]"));
assert(teamJs.includes("icon: item.icon"));
assert(teamJs.includes("detail: item.detail"));
assert(pvpJs.includes("icon: item.icon"));
assert(pvpJs.includes("detail: item.detail"));

const pickerJs = fs.readFileSync(path.join(componentRoot, "index.js"), "utf8");
const pickerWxml = fs.readFileSync(path.join(componentRoot, "index.wxml"), "utf8");
const floatingJs = fs.readFileSync(path.join(floatingComponentRoot, "index.js"), "utf8");
const floatingWxml = fs.readFileSync(path.join(floatingComponentRoot, "index.wxml"), "utf8");
const floatingWxss = fs.readFileSync(path.join(floatingComponentRoot, "index.wxss"), "utf8");

assert(!pickerWxml.includes("<input"), "field-picker must be read-only display");
assert(!pickerWxml.includes("suggestion-list"), "field-picker must not render inline suggestions");
assert(pickerWxml.includes('bindtap="onOpen"'));
assert(pickerWxml.includes('catchtap="onClear"'));
assert(pickerWxml.includes("selectedOption"));
assert(pickerWxml.includes("option-icon-image"));
assert(pickerWxml.includes("option-icon-text"));
assert(pickerWxml.includes("field-label-chip"));
assert(pickerWxml.includes("field-frame"));
assert(pickerWxml.includes("field-content-row"));
assert(pickerWxml.includes("edit-trigger"));
assert(pickerWxml.includes('catchtap="onOpenTrigger"'));
assert(pickerWxml.includes("iconClass"));
assert(!pickerWxml.includes("{{item.detail}}"));
assert(!pickerWxml.includes("suggestion-detail"));
assert(!pickerWxml.includes("<picker"));

for (const method of [
  "onOpen",
  "onOpenTrigger",
  "onClear",
]) {
  assert(pickerJs.includes(`${method}(`), `field picker is missing ${method}`);
}
assert(pickerJs.includes("selectedOption"));
assert(pickerJs.includes("optionView("));
assert(pickerJs.includes("iconClass"));
assert(pickerJs.includes("openOnTap"));
assert(pickerJs.includes("showEditTrigger"));
assert(!pickerJs.includes('require("../../utils/search-options")'));
assert(pickerJs.includes('this.triggerEvent("open"'));
assert(!pickerJs.includes("getSystemInfo"));
assert(!pickerJs.includes("searchOptions(this.properties.options, query, 20)"));
assert(pickerJs.includes('this.triggerEvent("change", {'));
assert(pickerJs.includes("index"));

const pickerWxss = fs.readFileSync(path.join(componentRoot, "index.wxss"), "utf8");
assert(pickerWxss.includes("position: relative"));
assert(pickerWxss.includes(".field-label-chip"));
assert(pickerWxss.includes("top: -"));
assert(pickerWxss.includes(".field-frame"));
assert(pickerWxss.includes(".field-content-row"));
assert(pickerWxss.includes(".edit-trigger"));
assert(pickerWxss.includes("min-height: 40rpx"));
assert(pickerWxss.includes("rgba(255, 255, 255, 0.56)"), "field picker controls should use wetter translucent glass input backgrounds");
assert(!pickerWxss.includes("backdrop-filter"), "field picker controls must avoid runtime backdrop blur in Mini Program WXSS");
assert(pickerWxss.includes("border-radius: 28rpx"), "field picker controls should use rounded Liquid Glass input corners");
assert(
  pickerWxss.includes("box-shadow: inset 0 0 0 2rpx rgba(77, 163, 255, 0.14)"),
  "field picker selected/focused affordance should stay inside the control instead of overlapping neighboring fields"
);
assert(pickerWxss.includes(".stat-atk-icon"));
assert(pickerWxss.includes("transform: translate"));

assert(floatingWxml.includes("<input"));
assert(floatingWxml.includes('focus="{{visible}}"'));
assert(floatingWxml.includes('adjust-position="{{false}}"'));
assert(floatingWxml.includes('hold-keyboard="{{true}}"'));
assert(floatingWxml.includes('bindblur="onInputBlur"'));
assert(floatingWxml.includes('bindkeyboardheightchange="onKeyboardHeightChange"'));
assert(floatingWxml.includes("<scroll-view"));
assert(floatingWxml.includes('scroll-y="{{true}}"'));
assert(floatingWxml.includes('bindtouchstart="onSuggestionTouchStart"'));
assert(floatingWxml.includes('bindtouchend="onSuggestionTouchEnd"'));
assert(floatingWxml.includes('bindtouchcancel="onSuggestionTouchEnd"'));
assert(floatingWxml.includes('wx:for="{{suggestions}}"'));
assert(floatingWxml.includes('bindtap="onSelect"'));
assert(floatingWxml.includes('catchtap="onClose"'));
assert(floatingWxml.includes("panelBottom"));
assert(!floatingWxml.includes("bottom: {{keyboardHeight}}px"));
assert(floatingWxml.includes("option-icon-image"));
assert(floatingWxml.includes("option-icon-text"));
assert(floatingWxml.includes("iconClass"));
for (const method of [
  "onInput",
  "onSelect",
  "onClose",
  "onInputBlur",
  "onKeyboardHeightChange",
  "onSuggestionTouchStart",
  "onSuggestionTouchEnd",
  "refreshSuggestions"
]) {
  assert(floatingJs.includes(`${method}(`), `floating picker is missing ${method}`);
}
assert(floatingJs.includes('require("../../utils/search-options")'));
assert(
  floatingJs.includes("const SUGGESTION_LIMIT = 40;"),
  "floating picker should cap rendered suggestions to avoid heavy WXML updates after repeated taps."
);
assert(
  floatingJs.includes("searchOptions(this.properties.options, query, SUGGESTION_LIMIT)"),
  "floating picker must pass the suggestion render limit into searchOptions."
);
assert(floatingJs.includes('this.triggerEvent("select"'));
assert(floatingJs.includes('this.triggerEvent("close"'));
assert(!floatingJs.includes("commitFreeText"));
assert(floatingJs.includes("KEYBOARD_HEIGHT_COMPENSATION"));
assert(floatingJs.includes("calibrateKeyboardHeight("));
assert(floatingJs.includes("panelBottom: 0"));
assert(floatingWxss.includes("position: fixed"));
assert(floatingWxss.includes("z-index"));
assert(floatingWxss.includes("max-height: 360rpx"));
assert(floatingWxss.includes("floating-picker-panel"));
assert(floatingWxss.includes("border-radius: 56rpx 56rpx 0 0"), "floating picker should look like a rounded bottom glass drawer");
assert(floatingWxss.includes("rgba(255, 255, 255, 0.76)"), "floating picker drawer should use strong but still translucent glass white");
assert(!floatingWxss.includes("backdrop-filter"), "floating picker drawer must avoid runtime backdrop blur in Mini Program WXSS");

const skillWithIcon = catalog.skillOptions.find(
  (option) => option.icon && option.icon.startsWith("/assets/type-icons/")
);
assert(skillWithIcon, "skill options must expose type icons");

let capturedFloatingPicker = null;
global.Component = (config) => {
  capturedFloatingPicker = config;
};
delete require.cache[require.resolve(path.join(floatingComponentRoot, "index.js"))];
require(path.join(floatingComponentRoot, "index.js"));
assert(capturedFloatingPicker, "floating picker component must be loadable in the static harness");
const floatingInstance = {
  properties: {
    options: catalog.skillOptions,
    valueIndex: 0,
    valueLabel: "请选择"
  },
  data: JSON.parse(JSON.stringify(capturedFloatingPicker.data)),
  setData(update) {
    this.data = { ...this.data, ...update };
  },
  ...capturedFloatingPicker.methods
};
floatingInstance.refreshSuggestions("");
assert(
  floatingInstance.data.suggestions.length <= 40,
  `floating picker should render at most 40 suggestions for an empty query, got ${floatingInstance.data.suggestions.length}`
);

console.log("miniprogram searchable picker static checks passed");
