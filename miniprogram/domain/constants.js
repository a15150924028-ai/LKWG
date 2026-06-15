const TYPES = [
  ["grass", "草"], ["water", "水"], ["fire", "火"], ["electric", "电"],
  ["poison", "毒"], ["fantasy", "萌"], ["ice", "冰"], ["fighting", "武"],
  ["cute", "可爱"], ["light", "光"], ["dragon", "龙"], ["mechanical", "机械"],
  ["ghost", "幽灵"], ["demon", "恶魔"], ["bug", "虫"], ["normal", "普通"],
  ["wing", "翼"], ["ground", "土"]
].map(([id, name]) => ({ id, name }));

const BLOODLINES = [
  { id: "bloodline-boss", name: "首领血脉", type: "boss" },
  ...TYPES.map((type) => ({
    id: `bloodline-${type.id}`,
    name: `${type.name}属性血脉`,
    type: type.id
  }))
];

const NATURES = [
  ["nature-silent", "沉默"], ["nature-peaceful", "平和"],
  ["nature-gloomy", "忧郁"], ["nature-careless-hp", "粗心"],
  ["nature-practical", "踏实"], ["nature-bold-atk", "大胆"],
  ["nature-naughty", "调皮"], ["nature-brave", "勇敢"],
  ["nature-strong", "倔强"], ["nature-adamant", "固执"],
  ["nature-clever", "聪明"], ["nature-focused", "专注"],
  ["nature-paranoid", "偏执"], ["nature-quiet", "冷静"],
  ["nature-rational", "理性"], ["nature-timid", "胆小"],
  ["nature-jolly", "开朗"], ["nature-hasty", "急躁"],
  ["nature-reckless", "莽撞"], ["nature-passionate", "热情"],
  ["nature-steady", "稳重"], ["nature-naive-defense", "天真"],
  ["nature-relaxed", "悠闲"], ["nature-lazy", "懒散"],
  ["nature-frank", "坦率"], ["nature-alert", "警惕"],
  ["nature-shy", "害羞"], ["nature-gentle", "温顺"],
  ["nature-careful", "慎重"], ["nature-anxious", "焦虑"]
].map(([id, name]) => ({ id, name }));

const TALENTS = [
  ["talent-hp", "生命", "hp"],
  ["talent-atk", "物攻", "atk"],
  ["talent-def", "物防", "defense"],
  ["talent-spa", "魔攻", "spa"],
  ["talent-spd", "魔防", "spd"],
  ["talent-spe", "速度", "spe"]
].map(([id, name, stat]) => ({ id, name, stat }));

module.exports = {
  TYPES,
  BLOODLINES,
  NATURES,
  TALENTS
};
