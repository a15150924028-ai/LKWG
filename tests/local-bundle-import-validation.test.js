const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const formalBundle = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8"));

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete.`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = {};
vm.runInNewContext(`
  const TYPE_MAP = Object.fromEntries([
    "grass", "water", "fire", "electric", "poison", "fantasy", "ice", "fighting", "cute",
    "light", "dragon", "mechanical", "ghost", "demon", "bug", "normal", "wing", "ground"
  ].map((key) => [key, { key }]));
  ${extractFunction("rejectMutableDataFields")}
  ${extractFunction("rejectForbiddenBundleContent")}
  ${extractFunction("validateLocalBundleShape")}
  this.validate = (bundle) => {
    rejectMutableDataFields(bundle);
    rejectForbiddenBundleContent(bundle);
    validateLocalBundleShape(bundle);
  };
`, sandbox);

function validBundle() {
  return {
    schemaVersion: 1,
    generatedAt: "",
    currentSeason: "本地数据包",
    monsters: [{
      kind: "monster",
      id: "monster-demo",
      name: "示例精灵",
      aliases: [],
      types: ["fire"],
      skillIds: ["skill-demo"],
      passiveIds: ["passive-demo"],
      stats: { hp: 1, atk: 2, defense: 3, spa: 4, spd: 5, spe: 6 },
      raw: {}
    }],
    skills: [{
      kind: "skill",
      id: "skill-demo",
      name: "示例技能",
      aliases: [],
      type: "fire",
      category: "physical",
      mode: "attack",
      power: 80,
      pp: 2,
      energyCost: 2,
      accuracy: null,
      priority: 0,
      description: "造成伤害。",
      raw: {}
    }],
    passives: [{
      kind: "passive",
      id: "passive-demo",
      name: "示例特性",
      aliases: [],
      description: "示例描述。",
      raw: {}
    }]
  };
}

function expectRejected(mutator, label) {
  const bundle = validBundle();
  mutator(bundle);
  let rejected = false;
  try {
    sandbox.validate(bundle);
  } catch {
    rejected = true;
  }
  assert(rejected, `${label} must be rejected.`);
}

sandbox.validate(validBundle());
sandbox.validate(formalBundle);
expectRejected((bundle) => { delete bundle.schemaVersion; }, "Missing schemaVersion");
expectRejected((bundle) => { bundle.bloodlines = []; }, "Imported bloodlines");
expectRejected((bundle) => { bundle.pvpPresets = []; }, "Imported PVP presets");
expectRejected((bundle) => { bundle.monsters[0].stats.hp = null; }, "Missing monster HP");
expectRejected((bundle) => { bundle.monsters[0].skillIds = ["skill-missing"]; }, "Missing skill reference");
expectRejected((bundle) => { bundle.skills[0].id = "external-skill"; }, "Non-neutral skill id");
expectRejected((bundle) => { bundle.skills[0].description = ["wi", "ki"].join(""); }, "Source marker");
expectRejected((bundle) => { bundle.skills[0].description = "https" + "://example.invalid"; }, "External URL");
expectRejected((bundle) => { bundle.skills[0].description = "icon." + "png"; }, "Image path");
expectRejected((bundle) => { bundle.skills[0][["image", "url"].join("_")] = "x"; }, "Image field");
expectRejected((bundle) => { bundle.skills[0][["source", "commit"].join("_")] = "x"; }, "Source field");
expectRejected((bundle) => { bundle.passives[0].description = ["bili", "game"].join(""); }, "Source host marker");

console.log("Local bundle import validation checks passed.");
