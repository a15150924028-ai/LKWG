const TYPES = [
  ["grass", "草"], ["water", "水"], ["fire", "火"], ["electric", "电"],
  ["poison", "毒"], ["fantasy", "萌"], ["ice", "冰"], ["fighting", "武"],
  ["cute", "可爱"], ["light", "光"], ["dragon", "龙"], ["mechanical", "机械"],
  ["ghost", "幽灵"], ["demon", "恶魔"], ["bug", "虫"], ["normal", "普通"],
  ["wing", "翼"], ["ground", "土"]
].map(([id, name]) => ({
  id,
  name,
  icon: `/assets/type-icons/${id}.png`,
  iconClass: "type-icon-image"
}));

const STAT_META = {
  hp: { name: "生命", iconText: "生", icon: "/assets/stat-icons/hp.png", iconClass: "stat-icon-image" },
  atk: { name: "物攻", iconText: "物", icon: "/assets/stat-icons/atk.png", iconClass: "stat-icon-image stat-atk-icon" },
  defense: { name: "物防", iconText: "防", icon: "/assets/stat-icons/defense.png", iconClass: "stat-icon-image" },
  spa: { name: "魔攻", iconText: "魔", icon: "/assets/stat-icons/spa.png", iconClass: "stat-icon-image" },
  spd: { name: "魔防", iconText: "抗", icon: "/assets/stat-icons/spd.png", iconClass: "stat-icon-image" },
  spe: { name: "速度", iconText: "速", icon: "/assets/stat-icons/spe.png", iconClass: "stat-icon-image" }
};

const BLOODLINES = [
  {
    id: "bloodline-boss",
    name: "首领血脉",
    type: "boss",
    icon: "/assets/bloodline-icons/boss.png",
    iconClass: "bloodline-icon-image",
    aliases: ["首领", "首领血脉"]
  },
  ...TYPES.map((type) => ({
    id: `bloodline-${type.id}`,
    name: `${type.name}属性血脉`,
    type: type.id,
    icon: type.icon,
    iconClass: type.iconClass,
    aliases: [`${type.name}血脉`, type.name, `${type.name}属性血脉`]
  }))
];

const NATURE_DEFINITIONS = [
  ["nature-silent", "沉默", "hp", "atk"],
  ["nature-peaceful", "平和", "hp", "spa"],
  ["nature-gloomy", "忧郁", "hp", "defense"],
  ["nature-careless-hp", "粗心", "hp", "spd"],
  ["nature-practical", "踏实", "hp", "spe"],
  ["nature-bold-atk", "大胆", "atk", "defense"],
  ["nature-naughty", "调皮", "atk", "spd"],
  ["nature-brave", "勇敢", "atk", "spe"],
  ["nature-strong", "倔强", "atk", "hp"],
  ["nature-adamant", "固执", "atk", "spa"],
  ["nature-clever", "聪明", "spa", "atk"],
  ["nature-focused", "专注", "spa", "defense"],
  ["nature-paranoid", "偏执", "spa", "spd"],
  ["nature-quiet", "冷静", "spa", "spe"],
  ["nature-rational", "理性", "spa", "hp"],
  ["nature-timid", "胆小", "spe", "atk"],
  ["nature-jolly", "开朗", "spe", "spa"],
  ["nature-hasty", "急躁", "spe", "defense"],
  ["nature-reckless", "莽撞", "spe", "spd"],
  ["nature-passionate", "热情", "spe", "hp"],
  ["nature-steady", "稳重", "defense", "atk"],
  ["nature-naive-defense", "天真", "defense", "spa"],
  ["nature-relaxed", "悠闲", "defense", "spe"],
  ["nature-lazy", "懒散", "defense", "spd"],
  ["nature-frank", "坦率", "defense", "hp"],
  ["nature-alert", "警惕", "spd", "atk"],
  ["nature-shy", "害羞", "spd", "spa"],
  ["nature-gentle", "温顺", "spd", "defense"],
  ["nature-careful", "慎重", "spd", "spe"],
  ["nature-anxious", "焦虑", "spd", "hp"]
];

const NATURES = NATURE_DEFINITIONS.map(([id, baseName, upStat, downStat]) => {
  const up = STAT_META[upStat];
  const down = STAT_META[downStat];
  const detail = `${up.name}↑ / ${down.name}↓`;
  return {
    id,
    name: `${baseName}（${up.name}↑/${down.name}↓）`,
    baseName,
    upStat,
    downStat,
    detail,
    icon: up.icon,
    iconClass: up.iconClass,
    iconText: up.iconText,
    aliases: [baseName, up.name, down.name]
  };
});

const TALENT_DEFINITIONS = [
  ["talent-hp", "生命", "hp", ["血量", "生命值"]],
  ["talent-atk", "物攻", "atk", ["攻击", "物理攻击"]],
  ["talent-def", "物防", "defense", ["防御", "物理防御"]],
  ["talent-spa", "魔攻", "spa", ["特攻", "魔法攻击"]],
  ["talent-spd", "魔防", "spd", ["特防", "魔法防御"]],
  ["talent-spe", "速度", "spe", ["先手", "速度+60"]]
];

const TALENTS = TALENT_DEFINITIONS.map(([id, name, stat, aliases]) => ({
  id,
  name,
  stat,
  icon: STAT_META[stat].icon,
  iconClass: STAT_META[stat].iconClass,
  iconText: STAT_META[stat].iconText,
  aliases: [name, ...aliases]
}));

module.exports = {
  TYPES,
  BLOODLINES,
  NATURES,
  TALENTS,
  STAT_META
};
