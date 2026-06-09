const BWIKI_API_URL = "https://wiki.biligame.com/rocom/api.php";

function plainText(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n+/g, "\n")
    .trim();
}

function parseRenderedSkillNames(html) {
  const lines = plainText(html).split("\n").map((line) => line.trim()).filter(Boolean);
  const skillNames = [];
  lines.forEach((line, index) => {
    if (!/^\u89e3\u9501[：:]/.test(line)) return;
    const candidates = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const current = lines[cursor];
      if (/^\u89e3\u9501[：:]/.test(current)) break;
      if (current === "\u8017\u80fd") break;
      if (!current || current === "\u00d7" || current === "&#215;") continue;
      candidates.push(current);
    }
    const skillName = candidates[candidates.length - 1];
    if (skillName) skillNames.push(skillName);
  });
  return [...new Set(skillNames)];
}

(async () => {
  const params = new URLSearchParams({
    action: "parse",
    page: "\u673a\u5e55\u65b9\u821f",
    prop: "text",
    format: "json",
    origin: "*"
  });
  const response = await fetch(`${BWIKI_API_URL}?${params}`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`BWiki \u673a\u5e55\u65b9\u821f parse HTTP ${response.status}`);
  const payload = await response.json();
  const skillNames = parseRenderedSkillNames(payload?.parse?.text?.["*"] || "");
  if (!skillNames.includes("\u8fc7\u5c71\u8f66")) {
    throw new Error(`BWiki rendered \u673a\u5e55\u65b9\u821f skills did not include \u8fc7\u5c71\u8f66: ${skillNames.join(", ")}`);
  }
  console.log(`BWiki rendered \u673a\u5e55\u65b9\u821f skill cards include \u8fc7\u5c71\u8f66 (${skillNames.length} skills).`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
