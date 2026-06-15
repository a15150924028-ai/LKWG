const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const monsterByName = new Map(bundle.monsters.map((monster) => [monster.name, monster]));
const skillByName = new Map(bundle.skills.map((skill) => [skill.name, skill]));
const passiveByName = new Map(bundle.passives.map((passive) => [passive.name, passive]));

const expectedMonsterStats = {
  "皇家狮鹫（崖间地的样子）": { hp: 107, atk: 127, defense: 116, spa: 69, spd: 65 },
  "皇家狮鹫（高山地的样子）": { atk: 123, defense: 110 },
  "高脚鹬": { hp: 96, atk: 98, spa: 98 },
  "遁地鼠（储水期的样子）": { hp: 112, defense: 85, spa: 23, spd: 131 },
  "绅士鸡": { hp: 107 },
  "九幽菇": { atk: 110, defense: 125, spa: 103, spd: 103 },
  "仪式巨像": { atk: 84, spa: 89 },
  "彩蝶鲨": { atk: 98, spa: 98 },
  "古啦多": { hp: 85, defense: 134, spd: 74 },
  "寒音蛇（本来的样子）": { atk: 87, spa: 87 },
  "黑猫巫师": { hp: 149, atk: 53, defense: 90, spa: 124, spd: 129 },
  "爵士鹿": { atk: 77, spa: 20 },
  "圆号鱼": { hp: 113, atk: 31 }
};

for (const [name, expected] of Object.entries(expectedMonsterStats)) {
  const monster = monsterByName.get(name);
  assert(monster, `Missing screenshot monster: ${name}`);
  for (const [field, value] of Object.entries(expected)) {
    assert(
      monster.stats?.[field] === value,
      `${name}.${field} should be ${value}, got ${monster.stats?.[field]}`
    );
  }
}

const expectedMonsterTotals = {
  "皇家狮鹫（崖间地的样子）": 604,
  "皇家狮鹫（高山地的样子）": 596,
  "高脚鹬": 606,
  "遁地鼠（储水期的样子）": 569,
  "绅士鸡": 646,
  "九幽菇": 660,
  "仪式巨像": 598,
  "彩蝶鲨": 621,
  "古啦多": 559,
  "寒音蛇（本来的样子）": 574,
  "黑猫巫师": 615,
  "爵士鹿": 496,
  "圆号鱼": 549
};

for (const [name, expectedTotal] of Object.entries(expectedMonsterTotals)) {
  const stats = monsterByName.get(name)?.stats;
  const total = Object.values(stats || {}).reduce((sum, value) => sum + value, 0);
  assert(total === expectedTotal, `${name} total should be ${expectedTotal}, got ${total}`);
}

const expectedPassives = {
  "观星": "敌方每有1层星陨印记，自己的地系技能威力+20%。",
  "毒牙": "使敌方获得中毒时，也会使其获得物攻-40%、速度-40。",
  "洄游": "每次进入蓄力状态，获得全技能能耗永久-2。",
  "蓄电池": "每入场1次，永久获得双攻+30%。",
  "陨落": "在场时，双方回合结束时的效果不会触发。"
};

for (const [name, description] of Object.entries(expectedPassives)) {
  const passive = passiveByName.get(name);
  assert(passive, `Missing screenshot passive: ${name}`);
  assert(
    passive.description === description,
    `${name} description does not match the screenshot.`
  );
}

const expectedSkills = {
  "折射": {
    description: "造成魔伤，携带其他系别技能会给本技能带来不同效果：携带电系技能时获得速度+20；携带机械系技能时获得物防+30%；携带光系技能时获得魔攻+30%；携带水系技能时获得物攻+30%；携带普系技能时获得技能威力+10。"
  },
  "闪击": {
    description: "造成物伤，威力随自身与敌方速度差提升：速度差<0时威力60；0-14为100；15-29为130；30-44为140；45-59为150；60-74为160；75-89为170；90-104为180；105-119为190；120-134为195；≥135为200。"
  },
  "鸣沙陷阱": {
    description: "造成物伤，物防≤敌方时威力60；物防差1-29时威力100；物防差30-270时威力130；物防差≥271时威力200。"
  },
  "聚盐": {
    description: "2连击，每次连击自己回复8%生命，使用后本技能连击数永久+1（不再恢复能量）。"
  },
  "聒噪": {
    description: "敌方所有攻击技能能耗+2，持续3回合。"
  },
  "落雷": {
    power: 35,
    pp: 3,
    description: "造成魔伤，每次入场，本技能威力永久+40。"
  },
  "截拳": {
    power: 85,
    description: "造成物伤，应对状态：额外造成打断，回复该技能能耗的能量。"
  },
  "阻断": {
    type: "normal",
    category: "special",
    power: 75,
    pp: 2,
    description: "造成魔伤，应对状态：额外打断被应对技能。"
  },
  "斩断": {
    category: "physical",
    power: 70,
    description: "造成物伤，应对状态：额外打断被应对技能。"
  },
  "破防": {
    pp: 2,
    description: "敌方获得双防-70%，应对防御：额外使被应对技能冷却2回合。"
  },
  "触底强击": {
    power: 95,
    pp: 4,
    description: "造成魔伤，使用后若能量耗尽，本次技能威力+120。"
  },
  "灾厄": {
    power: 60,
    description: "对自己造成60威力物伤，应对状态：改为对敌方造成180威力物伤。"
  },
  "感染病": {
    power: 110,
    description: "造成魔伤，若击败敌方则将中毒转化为中毒印记。"
  },
  "咆哮": {
    description: "敌方获得物攻-60%、速度-60。"
  },
  "羽翼庇护": {
    pp: 2,
    description: "减伤70%，应对攻击：自己获得连击数+2。"
  },
  "虫群过境": {
    power: 30,
    pp: 3,
    description: "造成物伤，2连击。己方队伍获得1次奉献：获得连击数+1。"
  },
  "龙吟": {
    description: "蓄力，自身获得双攻+150%和速度+80。"
  },
  "防反": {
    type: "normal",
    category: "defense",
    power: 0,
    pp: 2,
    description: "减伤70%，应对攻击：自己获得物攻和魔攻+70%。"
  },
  "甜心续航": {
    pp: 3,
    description: "自己和敌方获得萌化：回复40%生命和0能量。"
  },
  "绵里藏针": {
    power: 60,
    pp: 2,
    description: "若自己上回合未攻击敌方并造成伤害，本技能每回合永久+20威力。"
  },
  "落雨": {
    description: "将天气改为雨天，持续8回合。天气「雨天」：双方水系技能威力+75%。"
  }
};

for (const [name, expected] of Object.entries(expectedSkills)) {
  const skill = skillByName.get(name);
  assert(skill, `Missing screenshot skill: ${name}`);
  for (const [field, value] of Object.entries(expected)) {
    assert(skill[field] === value, `${name}.${field} does not match the screenshot.`);
  }
}

const expectedLearners = {
  "速冻": ["海枝枝（碧蓝珊瑚）"],
  "水环": ["卷毛鸭"],
  "加大功率": ["流浪鼠"],
  "冰墙": ["獠牙猪"],
  "血气": ["彩蝶鲨"],
  "恶意逃离": ["爵士鹿"],
  "防反": ["风滚暮虫（金黄的样子）", "风滚暮虫（枯叶的样子）"]
};

for (const [skillName, monsterNames] of Object.entries(expectedLearners)) {
  const skill = skillByName.get(skillName);
  assert(skill, `Missing learner skill: ${skillName}`);
  for (const monsterName of monsterNames) {
    const monster = monsterByName.get(monsterName);
    assert(monster, `Missing screenshot learner: ${monsterName}`);
    assert(
      monster.skillIds.includes(skill.id),
      `${monsterName} should learn ${skillName}.`
    );
  }
}

console.log("S2 screenshot data checks passed.");
