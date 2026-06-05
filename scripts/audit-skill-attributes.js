const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const HTML_PATH = path.join(__dirname, "..", "克制面查询.html");
const DATA_URL = "https://rocomwiki.app/data/bundle.json";
const AUDITED_FIELDS = ["type", "category", "power", "pp"];

function extractConstObject(source, name) {
  const marker = `const ${name} = `;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`${name} not found`);

  const objectStart = source.indexOf("{", markerIndex);
  if (objectStart === -1) throw new Error(`${name} object start not found`);

  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let i = objectStart; i < source.length; i += 1) {
    const char = source[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(objectStart, i + 1);
    }
  }

  throw new Error(`${name} object end not found`);
}

function normalizeRemoteSkill(skill) {
  return {
    type: skill.element || "",
    category: skill.category ?? null,
    power: skill.power ?? null,
    pp: skill.pp ?? null
  };
}

function pickAuditedFields(value) {
  return Object.fromEntries(
    AUDITED_FIELDS
      .filter((field) => Object.hasOwn(value, field))
      .map((field) => [field, value[field]])
  );
}

async function main() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const overrides = vm.runInNewContext(
    `(${extractConstObject(html, "S2_SKILL_OVERRIDES")})`
  );

  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${DATA_URL}: ${response.status}`);
  }
  const bundle = await response.json();
  const remoteByName = new Map((bundle.skills || []).map((skill) => [skill.name, skill]));

  const attributeOverrides = [];
  const redundantOverrides = [];
  const missingOverrideSkills = [];

  for (const [name, override] of Object.entries(overrides)) {
    const remote = remoteByName.get(name);
    if (!remote) {
      missingOverrideSkills.push(name);
      continue;
    }

    const auditedOverride = pickAuditedFields(override);
    if (!Object.keys(auditedOverride).length) continue;

    const auditedRemote = normalizeRemoteSkill(remote);
    const diff = {};

    for (const [field, localValue] of Object.entries(auditedOverride)) {
      const remoteField = field === "type" ? "type" : field;
      const remoteValue = auditedRemote[remoteField];
      if (localValue !== remoteValue) {
        diff[field] = { remote: remoteValue, override: localValue };
      }
    }

    const row = {
      name,
      remote: auditedRemote,
      override: auditedOverride,
      diff
    };

    if (Object.keys(diff).length) attributeOverrides.push(row);
    else redundantOverrides.push(row);
  }

  console.log(JSON.stringify({
    remoteSkillCount: (bundle.skills || []).length,
    localOverrideCount: Object.keys(overrides).length,
    attributeOverrideCount: attributeOverrides.length,
    redundantAttributeOverrideCount: redundantOverrides.length,
    missingOverrideSkills,
    redundantAttributeOverrides: redundantOverrides.map((row) => row.name),
    attributeOverrides
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
