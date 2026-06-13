const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bundle = JSON.parse(fs.readFileSync(path.join(root, "data", "local-bundle.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function monster(name) {
  const item = bundle.monsters.find((entry) => entry.name === name);
  assert(item, `Missing monster ${name}.`);
  return item;
}

function assertFormalLine(line) {
  const monsters = line.map(monster);
  const chainIds = new Set(monsters.map((entry) => entry.raw?.chainId));
  assert(chainIds.size === 1 && [...chainIds][0], `${line.join(" > ")} must share one chainId.`);
  monsters.forEach((entry, index) => {
    assert(entry.raw?.evolutionChainId === entry.raw?.chainId, `${entry.name} must mirror chainId into evolutionChainId.`);
    assert(Number(entry.raw?.evolutionStage) === index + 1, `${entry.name} must have evolutionStage ${index + 1}.`);
    assert(
      JSON.stringify(entry.raw?.evolutionLine || []) === JSON.stringify(line),
      `${entry.name} must keep its explicit evolutionLine.`
    );
  });
}

function assertBranchLine(line) {
  line.map(monster).forEach((entry) => {
    const lines = Array.isArray(entry.raw?.evolutionLines) ? entry.raw.evolutionLines : [];
    assert(
      JSON.stringify(entry.raw?.evolutionLine || []) === JSON.stringify(line) ||
        lines.some((candidate) => JSON.stringify(candidate) === JSON.stringify(line)),
      `${entry.name} must keep branch evolutionLine ${line.join(" > ")}.`
    );
  });
}

[
  ["矮脚爬爬", "恶魔红钻"],
  ["白发懒人", "动力猿", "瞌睡王"],
  ["小独角兽", "白金独角兽", "彩虹独角兽"],
  ["奇丽草", "奇丽叶", "奇丽花", "奇丽果"],
  ["圣剑侍从", "圣剑-X", "圣剑骑士"]
].forEach(assertFormalLine);

[
  ["书魔虫", "书卷守护", "古卷匣魔像"],
  ["书魔虫", "书卷守护", "古卷执政官"],
  ["果冻", "抹茶布丁"],
  ["果冻", "椰浆布丁"],
  ["果冻", "熔岩布丁"],
  ["棋棋（白子）", "棋绮后（白子）", "棋契陛下"],
  ["棋棋（黑子）", "棋绮后（黑子）", "棋契陛下"],
  ["海盔虫（本来的样子）", "刺盔虫（本来的样子）", "千棘盔（本来的样子）", "千棘海针"],
  ["海盔虫（磨损的样子）", "刺盔虫（磨损的样子）", "千棘盔（磨损的样子）", "千棘海针"],
  ["毛毛", "爬爬", "化蝶（幽冥眼的样子）"],
  ["墨鱿士", "混乱鱿彩"],
  ["墨鱿士", "秩序鱿墨"]
].filter((line) => line.every((name) => bundle.monsters.some((entry) => entry.name === name))).forEach(assertBranchLine);

const distinctFormLines = [
  ["蹦蹦种子（彩玉球形态）", "蹦蹦草（彩玉球形态）", "蹦蹦花（彩玉球形态）", "蹦蹦果（彩玉球形态）"],
  ["蹦蹦种子（短毛球形态）", "蹦蹦草（短毛球形态）", "蹦蹦花（短毛球形态）", "蹦蹦果（短毛球形态）"],
  ["蹦蹦种子（海神球形态）", "蹦蹦草（海神球形态）", "蹦蹦花（海神球形态）", "蹦蹦果（海神球形态）"],
  ["蹦蹦种子（象牙球形态）", "蹦蹦草（象牙球形态）", "蹦蹦花（象牙球形态）", "蹦蹦果（象牙球形态）"],
  ["雪绒鸟（春天的样子）", "冬羽雀（春天的样子）", "岚鸟（春天的样子）", "霜翼领主（春天的样子）"],
  ["雪绒鸟（夏天的样子）", "冬羽雀（夏天的样子）", "岚鸟（夏天的样子）", "霜翼领主（夏天的样子）"],
  ["雪绒鸟（秋天的样子）", "冬羽雀（秋天的样子）", "岚鸟（秋天的样子）", "霜翼领主（秋天的样子）"],
  ["鸭吉吉（等一等鸭）", "鸭吉吉国王（等一等鸭）"],
  ["鸭吉吉（急急急鸭）", "鸭吉吉国王（急急急鸭）"],
  ["鸭吉吉（紧实的样子）", "鸭吉吉国王（紧实的样子）"],
  ["鸭吉吉（蓬松的样子）", "鸭吉吉国王（蓬松的样子）"],
  ["鸭吉吉（起来鸭）", "鸭吉吉国王（起来鸭）"],
  ["鸭吉吉（燃了鸭）", "鸭吉吉国王（燃了鸭）"]
];
distinctFormLines.forEach(assertFormalLine);
assert(!bundle.monsters.some((entry) => entry.name === "蹦蹦果"), "Generic 蹦蹦果 must be replaced by its four distinct forms.");

const deepLuoyin = monster("深渊罗隐");
assert(
  JSON.stringify(deepLuoyin.stats) === JSON.stringify({ hp: 107, atk: 159, defense: 167, spa: 78, spd: 32, spe: 75 }),
  "深渊罗隐 must use its rendered BWiki stats."
);
assert(deepLuoyin.passiveIds.includes("passive-盛宴"), "深渊罗隐 must use 盛宴.");
assert(deepLuoyin.skillIds.length === 47, "深渊罗隐 must carry its complete 47-skill pool.");
assertFormalLine(["阿米亚特", "阿米樱", "罗隐", "深渊罗隐"]);
assertFormalLine(["逗逗", "气球猫", "梦想三三", "奇梦咪"]);
assertBranchLine(["脆筒甜甜", "香草甜甜（杨桃饰品）", "圣代甜甜（杨桃抹茶口味）"]);
assert(!bundle.monsters.some((entry) => entry.name === "鸭吉吉国王"), "Generic 鸭吉吉国王 must not exist.");

const linkedMonsters = bundle.monsters.filter((entry) => entry.raw?.chainId || entry.raw?.evolutionStage);
assert(linkedMonsters.length >= 450, "Formal bundle should carry broad evolution metadata after the manual chain fill.");
assert(!html.includes("pvpLocalInferredEvolutionLine"), "PVP should use formal evolution metadata instead of runtime local inference.");
assert(!html.includes("pvpLocalEvolutionGroupKey"), "Runtime local evolution grouping fallback must stay out of index.html.");
assert(
  html.indexOf("const rawLine = pvpRawEvolutionLine(sourceMonster);") <
    html.indexOf("if (structuredLine.length > 1) return structuredLine;"),
  "PVP must prefer explicit raw evolutionLine before formal chain ids so branches work."
);

console.log("Local bundle evolution metadata checks passed.");
