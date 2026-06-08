const LEGACY_DATA_URL = "https://rocomwiki.app/data/bundle.json";

(async () => {
  const response = await fetch(LEGACY_DATA_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Fallback source returned HTTP ${response.status}`);
  }

  const bundle = await response.json();
  const rollerSkill = (bundle.skills || []).find((skill) => skill.name === "\u8fc7\u5c71\u8f66");
  if (!rollerSkill?.id) {
    throw new Error("Fallback website data does not contain the \u8fc7\u5c71\u8f66 skill.");
  }

  const ark = (bundle.monsters || []).find((monster) => /(?:\u673a\u5e55|\u79ef\u6728)\u65b9\u821f/.test(monster.name));
  if (!ark) {
    throw new Error("Fallback website data does not contain \u673a\u5e55\u65b9\u821f or \u79ef\u6728\u65b9\u821f.");
  }

  if (!Array.isArray(ark.skills) || !ark.skills.includes(rollerSkill.id)) {
    throw new Error(`${ark.name} website skill pool does not include \u8fc7\u5c71\u8f66 (${rollerSkill.id}).`);
  }

  console.log(`Website source includes ${rollerSkill.name} in ${ark.name}'s skill pool.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
