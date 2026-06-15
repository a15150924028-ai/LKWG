const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "index.html");
const outputDir = path.join(root, "miniprogram", "domain", "generated");
const modules = [
  ["LKWG_PVP_DAMAGE_RULES", "damage-rules.js"],
  ["LKWG_PVP_TRAIT_RULES", "trait-rules.js"],
  ["LKWG_PVP_DAMAGE_CORE", "damage-core.js"],
  ["LKWG_PVP_WEATHER_RULES", "weather-rules.js"],
  ["LKWG_PVP_ENERGY_RULES", "energy-rules.js"],
  ["LKWG_PVP_COOLDOWN_RULES", "cooldown-rules.js"],
  ["LKWG_PVP_HP_RULES", "hp-rules.js"],
  ["LKWG_PVP_CLEANUP_RULES", "cleanup-rules.js"],
  ["LKWG_PVP_HISTORY_RULES", "history-rules.js"],
  ["LKWG_PVP_TURN_RULES", "turn-rules.js"],
  ["LKWG_PVP_EFFECT_RULES", "effect-rules.js"],
  ["LKWG_PVP_BUILD_RULES", "build-rules.js"]
];

function generatedSource(marker, source) {
  return [
    `// Generated from index.html module ${marker}. Do not edit directly.`,
    source.trim(),
    ""
  ].join("\n");
}

function main() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]);
  const checkOnly = process.argv.includes("--check");
  let stale = false;

  fs.mkdirSync(outputDir, { recursive: true });
  for (const [marker, filename] of modules) {
    const source = scripts.find((script) => script.includes(marker));
    if (!source) throw new Error(`Missing ${marker} in index.html`);
    const next = generatedSource(marker, source);
    const outputPath = path.join(outputDir, filename);
    const current = fs.existsSync(outputPath)
      ? fs.readFileSync(outputPath, "utf8")
      : "";

    if (checkOnly) {
      if (current !== next) {
        console.error(`${path.relative(root, outputPath)} is out of date.`);
        stale = true;
      }
    } else {
      fs.writeFileSync(outputPath, next, "utf8");
    }
  }

  if (stale) {
    process.exitCode = 1;
    return;
  }
  console.log(
    checkOnly
      ? "Mini Program PVP rules are synchronized."
      : `Generated ${modules.length} Mini Program PVP rule modules.`
  );
}

main();
