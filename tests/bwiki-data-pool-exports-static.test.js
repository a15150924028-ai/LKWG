const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const exporterSource = fs.readFileSync(path.join(__dirname, "..", "tools", "bwiki-data-pool-exporter.mjs"), "utf8");
  [
    "bwikiImageTagUrl",
    "isBwikiPlaceholderImageUrl",
    "isUsableBwikiImageUrl",
    "isBwikiMonsterPortraitTag",
    "firstUsableBwikiImageUrl",
    "parseBwikiRenderedMonsterImageUrl"
  ].forEach((name) => {
    assert(exporterSource.includes(`"${name}"`), `Exporter runtime should extract ${name} from app HTML.`);
  });

  const modulePath = pathToFileURL(path.join(__dirname, "..", "tools", "bwiki-data-pool-exporter.mjs"));
  const {
    GENERATED_POOL_FILES,
    buildDataPoolExports,
    compareExportsToHtmlPools
  } = await import(modulePath.href);

  assert.deepStrictEqual(
    GENERATED_POOL_FILES,
    {
      monsterPool: "bwiki-monster-pool.json",
      monsterSkillPool: "bwiki-monster-skill-pool.json",
      monsterStats: "bwiki-monster-stats.json",
      skillPool: "bwiki-skill-pool.json",
      comparison: "bwiki-html-pool-comparison.json"
    },
    "Generator should publish the five requested independent output files."
  );

  const normalizedData = {
    generatedAt: "fixture-time",
    currentSeason: "BWiki fixture",
    sourceCommit: "https://wiki.biligame.com/rocom/%E9%A6%96%E9%A1%B5",
    monsters: [
      {
        id: "guard",
        name: "护主犬",
        aliases: [],
        icon: "https://patchwiki.biligame.com/images/rocom/guard.png",
        types: ["fire"],
        skillIds: ["flash"],
        passiveIds: [],
        raw: {
          image_url: "https://patchwiki.biligame.com/images/rocom/guard.png",
          chainId: "bwiki-evolution-护主犬",
          evolutionStage: 1,
          rendered_bwiki_evolution: true,
          stats: { hp: 51, atk: 52, defense: 53, spa: 54, spd: 55, spe: 56 },
          raw: { rendered_bwiki_stats: true }
        }
      },
      {
        id: "sonic",
        name: "音速犬",
        aliases: ["音速"],
        icon: "https://patchwiki.biligame.com/images/rocom/sonic.png",
        types: ["fire"],
        skillIds: ["guard", "flash"],
        passiveIds: [],
        raw: {
          image_url: "https://patchwiki.biligame.com/images/rocom/sonic.png",
          chainId: "bwiki-evolution-护主犬",
          evolutionStage: 2,
          rendered_bwiki_evolution: true,
          stats: { hp: 61, atk: 62, defense: 63, spa: 64, spd: 65, spe: 66 }
        }
      },
      {
        id: "storm",
        name: "风暴战犬",
        aliases: [],
        icon: "https://patchwiki.biligame.com/images/rocom/storm.png",
        types: ["fire"],
        skillIds: ["flash", "guard"],
        passiveIds: [],
        raw: {
          image_url: "https://patchwiki.biligame.com/images/rocom/storm.png",
          chainId: "bwiki-evolution-护主犬",
          evolutionStage: 3,
          bossFormAvailable: true,
          rendered_bwiki_evolution: true,
          stats: { hp: 71, atk: 72, defense: 73, spa: 74, spd: 75, spe: 76 }
        }
      }
    ],
    skills: [
      {
        id: "flash",
        name: "闪光",
        aliases: [],
        icon: "https://patchwiki.biligame.com/images/rocom/flash.png",
        type: "light",
        category: "special",
        power: 60,
        accuracy: null,
        pp: 2,
        priority: 0,
        description: "造成魔法伤害。",
        raw: {
          image_url: "https://patchwiki.biligame.com/images/rocom/flash.png",
          rendered: { element: "light", pp: 2, category: "special", power: 60, description: "造成魔法伤害。" }
        }
      },
      {
        id: "guard",
        name: "守护",
        aliases: [],
        icon: "https://patchwiki.biligame.com/images/rocom/guard-skill.png",
        type: "fire",
        category: "status",
        power: null,
        accuracy: null,
        pp: 4,
        priority: 0,
        description: "提升自身能力。",
        raw: {
          image_url: "https://patchwiki.biligame.com/images/rocom/guard-skill.png",
          rendered: { element: "fire", pp: 4, category: "status", power: null, description: "提升自身能力。" }
        }
      }
    ]
  };

  const exports = buildDataPoolExports(normalizedData);
  assert.strictEqual(exports.monsterPool.items.length, 3, "Monster pool should include every normalized monster.");
  assert.deepStrictEqual(
    exports.monsterPool.items.find((monster) => monster.name === "风暴战犬").evolutionChain.map((entry) => entry.name),
    ["护主犬", "音速犬", "风暴战犬"],
    "Monster pool should record each monster's complete evolution chain."
  );
  assert.strictEqual(
    exports.monsterPool.items.find((monster) => monster.name === "风暴战犬").image,
    "https://patchwiki.biligame.com/images/rocom/storm.png",
    "Monster pool should record each monster image."
  );

  assert.deepStrictEqual(
    exports.monsterSkillPool.items.find((monster) => monster.name === "音速犬").skills.map((skill) => skill.name),
    ["守护", "闪光"],
    "Monster skill pool should preserve the normalized HTML skillIds order while recording only learnable skill identities."
  );
  assert(!Object.hasOwn(exports.monsterSkillPool.items[0].skills[0], "description"), "Per-monster skill pool should not duplicate skill details.");

  assert.deepStrictEqual(
    exports.monsterStats.items.find((monster) => monster.name === "护主犬").stats,
    { hp: 51, atk: 52, defense: 53, spa: 54, spd: 55, spe: 56 },
    "Monster stats file should use rendered BWiki stats from normalized raw data."
  );
  assert.strictEqual(
    exports.monsterStats.items.find((monster) => monster.name === "护主犬").source,
    "rendered-bwiki",
    "Monster stats file should preserve rendered-page provenance from the nested normalized raw record."
  );

  assert.strictEqual(exports.skillPool.items.length, 2, "Total skill pool should include every normalized skill.");
  assert.deepStrictEqual(
    Object.keys(exports.skillPool.items[0]).sort(),
    ["accuracy", "aliases", "category", "description", "icon", "id", "name", "power", "pp", "priority", "raw", "type"].sort(),
    "Total skill pool should include all app skill information."
  );

  const comparison = compareExportsToHtmlPools(exports, normalizedData);
  assert.strictEqual(comparison.summary.totalMismatches, 0, "Generated files should match the corresponding normalized HTML pools.");

  const tampered = JSON.parse(JSON.stringify(exports));
  tampered.monsterSkillPool.items[1].skills.pop();
  const mismatch = compareExportsToHtmlPools(tampered, normalizedData);
  assert(mismatch.summary.totalMismatches > 0, "Comparison should report mismatches when a generated pool drifts.");
  assert(
    mismatch.mismatches.some((entry) => entry.pool === "monsterSkillPool" && entry.kind === "skill-list"),
    "Comparison should categorize per-monster skill-pool mismatches."
  );

  const extra = JSON.parse(JSON.stringify(exports));
  extra.skillPool.items.push({ ...extra.skillPool.items[0], id: "extra-skill", name: "额外技能" });
  const extraMismatch = compareExportsToHtmlPools(extra, normalizedData);
  assert(
    extraMismatch.mismatches.some((entry) => entry.pool === "skillPool" && entry.kind === "extra-skill"),
    "Comparison should report extra generated records that do not exist in the normalized HTML pool."
  );

  console.log("BWiki data pool export static checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
