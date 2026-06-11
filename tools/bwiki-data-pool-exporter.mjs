import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { execFile } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const GENERATED_POOL_FILES = {
  monsterPool: "bwiki-monster-pool.json",
  monsterSkillPool: "bwiki-monster-skill-pool.json",
  monsterStats: "bwiki-monster-stats.json",
  skillPool: "bwiki-skill-pool.json",
  comparison: "bwiki-html-pool-comparison.json"
};

const STAT_KEYS = ["hp", "atk", "defense", "spa", "spd", "spe"];
const GENERATED_BY = "tools/bwiki-data-pool-exporter.mjs";
const CURL_USER_AGENT = "Mozilla/5.0";

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function byName(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""), "zh-CN");
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function normalizeList(values) {
  return unique(values).slice().sort((a, b) => String(a).localeCompare(String(b), "zh-CN"));
}

function sourceMeta(data, pool) {
  return {
    pool,
    generatedAt: data?.generatedAt || "",
    currentSeason: data?.currentSeason || "",
    sourceCommit: data?.sourceCommit || "",
    generatedBy: GENERATED_BY
  };
}

function rawFor(entry) {
  return entry?.raw || {};
}

function rawStatsFor(monster) {
  const raw = rawFor(monster);
  const candidates = [
    raw.stats,
    raw.raw?.stats,
    {
      hp: raw.hp,
      atk: raw.atk,
      defense: raw.defense,
      spa: raw.spa,
      spd: raw.spd,
      spe: raw.spe
    }
  ];
  const stats = candidates.find((candidate) => {
    return candidate && STAT_KEYS.every((key) => Number.isFinite(Number(candidate[key])));
  });
  if (!stats) return {};
  return Object.fromEntries(STAT_KEYS.map((key) => [key, Number(stats[key])]));
}

function hasRenderedBwikiStats(monster) {
  const raw = rawFor(monster);
  return Boolean(raw.rendered_bwiki_stats || raw.raw?.rendered_bwiki_stats);
}

function evolutionChainKey(monster) {
  const raw = rawFor(monster);
  const candidates = [
    raw.chainId,
    raw.evolutionChainId,
    raw.familyId,
    raw.baseId,
    raw.evolution_chain_id,
    raw.family_id,
    raw.base_id,
    monster?.chainId,
    monster?.evolutionChainId,
    monster?.familyId,
    monster?.baseId
  ];
  const key = candidates.find((value) => value != null && String(value).trim() !== "");
  return key == null ? "" : String(key);
}

function evolutionStage(monster) {
  const raw = rawFor(monster);
  const candidates = [
    raw.evolutionStage,
    raw.evolution_stage,
    raw.stage,
    monster?.evolutionStage,
    monster?.evolution_stage,
    monster?.stage
  ];
  const stage = candidates.map(Number).find((value) => Number.isFinite(value));
  return Number.isFinite(stage) ? stage : null;
}

function monsterImage(monster) {
  return monster?.icon || rawFor(monster).image_url || rawFor(monster).rendered_bwiki_image_url || "";
}

function skillImage(skill) {
  return skill?.icon || rawFor(skill).image_url || "";
}

function buildSkillNameIndex(data) {
  return new Map((data?.skills || []).map((skill) => [skill.id, skill.name]));
}

function buildEvolutionChains(monsters) {
  const groups = new Map();
  (monsters || []).forEach((monster) => {
    const chainKey = evolutionChainKey(monster);
    if (!chainKey) return;
    if (!groups.has(chainKey)) groups.set(chainKey, []);
    groups.get(chainKey).push(monster);
  });

  const chains = new Map();
  groups.forEach((items, chainKey) => {
    const chain = items
      .slice()
      .sort((a, b) => {
        const stageA = evolutionStage(a);
        const stageB = evolutionStage(b);
        if (stageA != null && stageB != null && stageA !== stageB) return stageA - stageB;
        if (stageA != null && stageB == null) return -1;
        if (stageA == null && stageB != null) return 1;
        return byName(a, b);
      })
      .map((monster) => ({
        id: monster.id,
        name: monster.name,
        stage: evolutionStage(monster),
        image: monsterImage(monster)
      }));
    chains.set(chainKey, chain);
  });
  return chains;
}

function expectedEvolutionChain(monster, chains) {
  const chain = chains.get(evolutionChainKey(monster));
  if (chain?.length) return chain;
  return [{
    id: monster.id,
    name: monster.name,
    stage: evolutionStage(monster),
    image: monsterImage(monster)
  }];
}

function buildMonsterPool(data) {
  const monsters = (data?.monsters || []).slice().sort(byName);
  const chains = buildEvolutionChains(monsters);
  return {
    meta: sourceMeta(data, "monsterPool"),
    itemCount: monsters.length,
    items: monsters.map((monster) => ({
      id: monster.id,
      name: monster.name,
      aliases: monster.aliases || [],
      types: monster.types || [],
      image: monsterImage(monster),
      sourceImage: rawFor(monster).image_url || "",
      evolutionChainId: evolutionChainKey(monster),
      evolutionStage: evolutionStage(monster),
      evolutionChain: expectedEvolutionChain(monster, chains),
      isBossForm: Boolean(rawFor(monster).bossFormAvailable || rawFor(monster).boss_form_available || rawFor(monster).isGeneratedBossForm)
    }))
  };
}

function buildMonsterSkillPool(data) {
  const skillNamesById = buildSkillNameIndex(data);
  const monsters = (data?.monsters || []).slice().sort(byName);
  return {
    meta: sourceMeta(data, "monsterSkillPool"),
    itemCount: monsters.length,
    items: monsters.map((monster) => {
      const skills = (monster.skillIds || [])
        .map((id) => ({ id, name: skillNamesById.get(id) || "" }))
        .filter((skill) => skill.name);
      return {
        id: monster.id,
        name: monster.name,
        skillCount: skills.length,
        skills
      };
    })
  };
}

function buildMonsterStats(data) {
  const monsters = (data?.monsters || []).slice().sort(byName);
  return {
    meta: sourceMeta(data, "monsterStats"),
    itemCount: monsters.length,
    items: monsters.map((monster) => ({
      id: monster.id,
      name: monster.name,
      stats: rawStatsFor(monster),
      source: hasRenderedBwikiStats(monster) ? "rendered-bwiki" : "normalized-raw"
    }))
  };
}

function buildSkillPool(data) {
  const skills = (data?.skills || []).slice().sort(byName);
  return {
    meta: sourceMeta(data, "skillPool"),
    itemCount: skills.length,
    items: skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      aliases: skill.aliases || [],
      icon: skillImage(skill),
      type: skill.type || "",
      category: skill.category || "",
      power: skill.power ?? null,
      accuracy: skill.accuracy ?? null,
      pp: skill.pp ?? null,
      priority: skill.priority ?? 0,
      description: skill.description || "",
      raw: cloneJson(rawFor(skill))
    }))
  };
}

export function buildDataPoolExports(normalizedData) {
  return {
    monsterPool: buildMonsterPool(normalizedData),
    monsterSkillPool: buildMonsterSkillPool(normalizedData),
    monsterStats: buildMonsterStats(normalizedData),
    skillPool: buildSkillPool(normalizedData)
  };
}

function mapById(items) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function addMismatch(mismatches, pool, kind, id, name, expected, actual) {
  mismatches.push({
    pool,
    kind,
    id,
    name,
    expected,
    actual
  });
}

function addExtraRecordMismatches(mismatches, pool, kind, actualItems, expectedItems) {
  const expectedIds = new Set((expectedItems || []).map((item) => item.id));
  (actualItems || []).forEach((item) => {
    if (!expectedIds.has(item.id)) {
      addMismatch(mismatches, pool, kind, item.id, item.name, null, item);
    }
  });
}

function statsSignature(stats) {
  return JSON.stringify(Object.fromEntries(STAT_KEYS.map((key) => [key, Number(stats?.[key])])));
}

function chainSignature(chain) {
  return JSON.stringify((chain || []).map((entry) => ({
    id: entry.id,
    name: entry.name,
    stage: entry.stage ?? null,
    image: entry.image || ""
  })));
}

export function compareExportsToHtmlPools(exports, normalizedData) {
  const expected = buildDataPoolExports(normalizedData);
  const mismatches = [];

  const actualMonsterPool = mapById(exports?.monsterPool?.items);
  const expectedMonsterPool = mapById(expected.monsterPool.items);
  expectedMonsterPool.forEach((expectedMonster, id) => {
    const actual = actualMonsterPool.get(id);
    if (!actual) {
      addMismatch(mismatches, "monsterPool", "missing-monster", id, expectedMonster.name, expectedMonster, null);
      return;
    }
    if ((actual.image || "") !== (expectedMonster.image || "")) {
      addMismatch(mismatches, "monsterPool", "image", id, expectedMonster.name, expectedMonster.image, actual.image || "");
    }
    if (chainSignature(actual.evolutionChain) !== chainSignature(expectedMonster.evolutionChain)) {
      addMismatch(mismatches, "monsterPool", "evolution-chain", id, expectedMonster.name, expectedMonster.evolutionChain, actual.evolutionChain || []);
    }
  });
  addExtraRecordMismatches(
    mismatches,
    "monsterPool",
    "extra-monster",
    exports?.monsterPool?.items,
    expected.monsterPool.items
  );

  const actualMonsterSkillPool = mapById(exports?.monsterSkillPool?.items);
  const expectedMonsterSkillPool = mapById(expected.monsterSkillPool.items);
  expectedMonsterSkillPool.forEach((expectedMonster, id) => {
    const actual = actualMonsterSkillPool.get(id);
    if (!actual) {
      addMismatch(mismatches, "monsterSkillPool", "missing-monster", id, expectedMonster.name, expectedMonster, null);
      return;
    }
    const expectedSkills = expectedMonster.skills.map((skill) => skill.name);
    const actualSkills = (actual.skills || []).map((skill) => skill.name);
    if (JSON.stringify(expectedSkills) !== JSON.stringify(actualSkills)) {
      addMismatch(mismatches, "monsterSkillPool", "skill-list", id, expectedMonster.name, expectedSkills, actualSkills);
    }
  });
  addExtraRecordMismatches(
    mismatches,
    "monsterSkillPool",
    "extra-monster",
    exports?.monsterSkillPool?.items,
    expected.monsterSkillPool.items
  );

  const actualMonsterStats = mapById(exports?.monsterStats?.items);
  const expectedMonsterStats = mapById(expected.monsterStats.items);
  expectedMonsterStats.forEach((expectedMonster, id) => {
    const actual = actualMonsterStats.get(id);
    if (!actual) {
      addMismatch(mismatches, "monsterStats", "missing-monster", id, expectedMonster.name, expectedMonster, null);
      return;
    }
    if (statsSignature(actual.stats) !== statsSignature(expectedMonster.stats)) {
      addMismatch(mismatches, "monsterStats", "stats", id, expectedMonster.name, expectedMonster.stats, actual.stats || {});
    }
  });
  addExtraRecordMismatches(
    mismatches,
    "monsterStats",
    "extra-monster",
    exports?.monsterStats?.items,
    expected.monsterStats.items
  );

  const actualSkillPool = mapById(exports?.skillPool?.items);
  const expectedSkillPool = mapById(expected.skillPool.items);
  expectedSkillPool.forEach((expectedSkill, id) => {
    const actual = actualSkillPool.get(id);
    if (!actual) {
      addMismatch(mismatches, "skillPool", "missing-skill", id, expectedSkill.name, expectedSkill, null);
      return;
    }
    ["name", "type", "category", "power", "accuracy", "pp", "priority", "description", "icon"].forEach((field) => {
      const expectedValue = expectedSkill[field] ?? null;
      const actualValue = actual[field] ?? null;
      if (JSON.stringify(expectedValue) !== JSON.stringify(actualValue)) {
        addMismatch(mismatches, "skillPool", `skill-field:${field}`, id, expectedSkill.name, expectedValue, actualValue);
      }
    });
  });
  addExtraRecordMismatches(
    mismatches,
    "skillPool",
    "extra-skill",
    exports?.skillPool?.items,
    expected.skillPool.items
  );

  return {
    meta: sourceMeta(normalizedData, "comparison"),
    comparedAt: new Date().toISOString(),
    summary: {
      monsterPoolItems: expected.monsterPool.items.length,
      monsterSkillPoolItems: expected.monsterSkillPool.items.length,
      monsterStatsItems: expected.monsterStats.items.length,
      skillPoolItems: expected.skillPool.items.length,
      totalMismatches: mismatches.length,
      mismatchesByPool: Object.fromEntries(
        ["monsterPool", "monsterSkillPool", "monsterStats", "skillPool"]
          .map((pool) => [pool, mismatches.filter((entry) => entry.pool === pool).length])
      )
    },
    mismatches
  };
}

export async function writeDataPoolExportFiles(exports, comparison, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  const files = {
    [GENERATED_POOL_FILES.monsterPool]: exports.monsterPool,
    [GENERATED_POOL_FILES.monsterSkillPool]: exports.monsterSkillPool,
    [GENERATED_POOL_FILES.monsterStats]: exports.monsterStats,
    [GENERATED_POOL_FILES.skillPool]: exports.skillPool
  };
  if (comparison) files[GENERATED_POOL_FILES.comparison] = comparison;
  await Promise.all(Object.entries(files).map(([fileName, payload]) => {
    return fs.writeFile(path.join(outputDir, fileName), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }));
  return Object.keys(files).map((fileName) => path.join(outputDir, fileName));
}

export async function readDataPoolExportFiles(outputDir) {
  const entries = await Promise.all(
    ["monsterPool", "monsterSkillPool", "monsterStats", "skillPool"].map(async (key) => {
      const fileName = GENERATED_POOL_FILES[key];
      const payload = JSON.parse(await fs.readFile(path.join(outputDir, fileName), "utf8"));
      return [key, payload];
    })
  );
  return Object.fromEntries(entries);
}

function extractFunctionSource(html, name) {
  const lineMatch = new RegExp(`(^[ \\t]*)(?:async\\s+)?function\\s+${name}\\s*\\(`, "m").exec(html);
  if (lineMatch) {
    const start = lineMatch.index;
    const indent = lineMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nextFunctionPattern = new RegExp(`^${indent}(?:async\\s+)?function\\s+[A-Za-z0-9_]+\\s*\\(`, "gm");
    nextFunctionPattern.lastIndex = start + lineMatch[0].length;
    const next = nextFunctionPattern.exec(html);
    if (next) return html.slice(start, next.index);
  }

  const match = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(html);
  if (!match) throw new Error(`${name} is missing from app HTML.`);
  const start = match.index;
  const open = html.indexOf("{", start);
  let depth = 0;
  let stringQuote = "";
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < html.length; index += 1) {
    const char = html[index];
    const next = html[index + 1] || "";
    const previous = html[index - 1] || "";

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (stringQuote) {
      if (char === "\\" && previous !== "\\") {
        index += 1;
        continue;
      }
      if (char === stringQuote && previous !== "\\") stringQuote = "";
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      stringQuote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete in app HTML.`);
}

function extractBwikiConstantBlock(html) {
  const start = html.indexOf("const DATA_URL");
  const end = html.indexOf("const teamGrid", start);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not extract app BWiki constant block.");
  }
  return html.slice(start, end)
    .replace("const BWIKI_PAGE_BATCH_SIZE = 8;", "const BWIKI_PAGE_BATCH_SIZE = 20;")
    .replace("const BWIKI_PAGE_FETCH_CONCURRENCY = 2;", "const BWIKI_PAGE_FETCH_CONCURRENCY = 4;");
}

function extractBwikiMappingConstantBlock(html) {
  const start = html.indexOf("const BWIKI_ELEMENT_TO_ELEMENT");
  const end = html.indexOf("function bwikiApiUrl", start);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not extract app BWiki mapping constant block.");
  }
  return html.slice(start, end);
}

function createBwikiRuntime(html) {
  const functionNames = [
    "typeIcon",
    "absoluteUrl",
    "unique",
    "normalizeSearchText",
    "bwikiApiUrl",
    "fetchBwikiJsonp",
    "wait",
    "fetchBwikiJson",
    "decodeHtmlEntities",
    "cleanWikiText",
    "parseBwikiNumber",
    "bwikiId",
    "splitBwikiList",
    "parseBwikiTemplate",
    "parseBwikiTemplateParams",
    "parseBwikiIndexEntries",
    "fetchBwikiParsedHtml",
    "revisionWikitext",
    "bwikiPageRevisionKey",
    "readBwikiRenderedProfileCache",
    "writeBwikiRenderedProfileCache",
    "getCachedBwikiRenderedProfile",
    "setCachedBwikiRenderedProfile",
    "updateBwikiProgress",
    "fetchBwikiWikitextBatch",
    "fetchBwikiWikitextBatchResilient",
    "mapWithConcurrency",
    "fetchBwikiWikitextPages",
    "firstBwikiImageUrl",
    "plainBwikiText",
    "parseBwikiSkillLearnerNames",
    "parseBwikiRenderedMonsterSkillNames",
    "bwikiImageTagUrl",
    "isBwikiPlaceholderImageUrl",
    "isUsableBwikiImageUrl",
    "isBwikiMonsterPortraitTag",
    "firstUsableBwikiImageUrl",
    "parseBwikiRenderedMonsterImageUrl",
    "parseBwikiRenderedEvolutionLine",
    "parseBwikiRenderedBossFormNames",
    "parseBwikiRenderedMonsterProfile",
    "fetchBwikiRenderedMonsterProfileMap",
    "compactBwikiNameKey",
    "bwikiNamesFor",
    "bwikiMonsterByNameMap",
    "missingBwikiEvolutionFormNames",
    "mergeBwikiMonsterRecords",
    "applyBwikiRenderedMonsterSkills",
    "applyBwikiRenderedMonsterProfiles",
    "fetchBwikiSkillLearnerMap",
    "applyBwikiSkillLearners",
    "inferRenderedSkillCategory",
    "parseBwikiRenderedSkillProfile",
    "fetchBwikiRenderedSkillProfileMap",
    "applyBwikiRenderedSkillProfiles",
    "fetchBwikiSupplementalSkillPages",
    "parseBwikiSkillPage",
    "parseBwikiMonsterPage",
    "supplementalBwikiMonsterTitles",
    "fetchBwikiBundle",
    "fetchRemoteBundle",
    "normalizeBundle"
  ];
  const functionSources = functionNames.map((name) => extractFunctionSource(html, name)).join("\n");
  const localStorageStub = `
    const localStorage = {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    };
    let lastLoggedBwikiProgress = "";
    const dataStatus = {
      set textContent(value) {
        const text = String(value || "");
        const match = text.match(/ (\\d+)\\/(\\d+)/);
        const done = match ? Number(match[1]) : 0;
        const total = match ? Number(match[2]) : 0;
        if (!match || done === 0 || done === total || done % 25 === 0) {
          if (text !== lastLoggedBwikiProgress && typeof console !== "undefined") console.error(text);
          lastLoggedBwikiProgress = text;
        }
      }
    };
  `;
  const curlFetch = async (url) => {
    const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
    let stdout = "";
    let lastError = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        ({ stdout } = await execFileAsync(curlBin, [
          "-L",
          "--http1.1",
          "--tlsv1.2",
          "--ssl-no-revoke",
          "--compressed",
          "--silent",
          "--show-error",
          "--retry",
          "2",
          "--retry-all-errors",
          "--retry-delay",
          "2",
          "--connect-timeout",
          "30",
          "--max-time",
          "120",
          "--write-out",
          "\n%{http_code}",
          "-A",
          CURL_USER_AGENT,
          "-e",
          "https://wiki.biligame.com/rocom/%E9%A6%96%E9%A1%B5",
          "-H",
          "Accept: application/json,text/html,*/*",
          "-H",
          "Accept-Language: zh-CN,zh;q=0.9",
          String(url)
        ], {
          encoding: "utf8",
          maxBuffer: 80 * 1024 * 1024
        }));
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
    if (lastError) throw lastError;
    const separator = stdout.lastIndexOf("\n");
    const body = separator >= 0 ? stdout.slice(0, separator) : stdout;
    const status = Number(separator >= 0 ? stdout.slice(separator + 1).trim() : 0);
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() {
        return JSON.parse(body);
      },
      async text() {
        return body;
      }
    };
  };
  const fetchWithHeaders = async (url, options = {}) => {
    if (/^https:\/\/wiki\.biligame\.com\/rocom\//i.test(String(url))) {
      return curlFetch(url);
    }
    const headers = {
      "user-agent": CURL_USER_AGENT,
      ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
  };
  const context = {
    console,
    fetch: fetchWithHeaders,
    setTimeout,
    clearTimeout,
    URLSearchParams,
    Promise,
    Map,
    Set,
    Date,
    Number,
    String,
    RegExp,
    JSON,
    Object,
    Array,
    Math
  };
  vm.createContext(context);
  vm.runInContext(`
    ${extractBwikiConstantBlock(html)}
    ${extractBwikiMappingConstantBlock(html)}
    ${localStorageStub}
    ${functionSources}
    this.fetchRemoteBundle = fetchRemoteBundle;
    this.normalizeBundle = normalizeBundle;
  `, context, { timeout: 10000 });
  return context;
}

export async function loadBwikiNormalizedDataFromHtml(htmlPath) {
  const html = await fs.readFile(htmlPath, "utf8");
  const runtime = createBwikiRuntime(html);
  const bundle = await runtime.fetchRemoteBundle();
  return runtime.normalizeBundle(bundle);
}

function parseCliArgs(argv) {
  const args = {
    html: path.resolve("克制面查询.html"),
    outDir: path.resolve("data", "generated")
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--html") {
      args.html = path.resolve(argv[index + 1] || args.html);
      index += 1;
    } else if (arg === "--out-dir") {
      args.outDir = path.resolve(argv[index + 1] || args.outDir);
      index += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const normalizedData = await loadBwikiNormalizedDataFromHtml(args.html);
  const exports = buildDataPoolExports(normalizedData);
  await writeDataPoolExportFiles(exports, null, args.outDir);
  const writtenExports = await readDataPoolExportFiles(args.outDir);
  const comparison = compareExportsToHtmlPools(writtenExports, normalizedData);
  const files = await writeDataPoolExportFiles(writtenExports, comparison, args.outDir);
  console.log(`Generated ${files.length} files in ${args.outDir}`);
  console.log(`Comparison mismatches: ${comparison.summary.totalMismatches}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fileURLToPath(import.meta.url)).href && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
