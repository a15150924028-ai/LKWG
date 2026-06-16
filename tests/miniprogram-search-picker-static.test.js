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

assert(pickerWxml.includes("<input"));
assert(pickerWxml.includes('bindfocus="onFocus"'));
assert(pickerWxml.includes('bindinput="onInput"'));
assert(pickerWxml.includes('bindblur="onBlur"'));
assert(pickerWxml.includes('bindtap="onSelect"'));
assert(pickerWxml.includes('bindtap="onClear"'));
assert(pickerWxml.includes('wx:for="{{suggestions}}"'));
assert(pickerWxml.includes("selectedOption"));
assert(pickerWxml.includes("option-icon-image"));
assert(pickerWxml.includes("option-icon-text"));
assert(pickerWxml.includes("{{item.detail}}"));
assert(!pickerWxml.includes("<picker"));

for (const method of [
  "onFocus",
  "onInput",
  "onBlur",
  "onSelect",
  "onClear"
]) {
  assert(pickerJs.includes(`${method}(`), `field picker is missing ${method}`);
}
assert(pickerJs.includes("selectedOption"));
assert(pickerJs.includes("optionView("));
assert(pickerJs.includes('require("../../utils/search-options")'));
assert(pickerJs.includes('this.triggerEvent("change", {'));
assert(pickerJs.includes("index"));

console.log("miniprogram searchable picker static checks passed");
