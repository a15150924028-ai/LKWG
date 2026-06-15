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

const pickerJs = fs.readFileSync(path.join(componentRoot, "index.js"), "utf8");
const pickerWxml = fs.readFileSync(path.join(componentRoot, "index.wxml"), "utf8");

assert(pickerWxml.includes("<input"));
assert(pickerWxml.includes('bindfocus="onFocus"'));
assert(pickerWxml.includes('bindinput="onInput"'));
assert(pickerWxml.includes('bindblur="onBlur"'));
assert(pickerWxml.includes('bindtap="onSelect"'));
assert(pickerWxml.includes('bindtap="onClear"'));
assert(pickerWxml.includes('wx:for="{{suggestions}}"'));
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
assert(pickerJs.includes('require("../../utils/search-options")'));
assert(pickerJs.includes('this.triggerEvent("change", {'));
assert(pickerJs.includes("index"));

console.log("miniprogram searchable picker static checks passed");
