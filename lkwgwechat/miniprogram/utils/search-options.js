const PINYIN_MAP = require("./generated/pinyin-map");

function normalizeQuery(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .replace(/[\s'’·\-_/\\（）()，,。.：:+]/g, "");
}

function pinyinParts(value) {
  return [...String(value || "")]
    .map((char) => PINYIN_MAP[char] || normalizeQuery(char))
    .filter(Boolean);
}

function pinyinText(value) {
  return pinyinParts(value).join("");
}

function pinyinInitials(value) {
  return pinyinParts(value)
    .map((part) => part[0] || "")
    .join("");
}

function levenshteinDistance(left, right, limit = Infinity) {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    let rowMinimum = current[0];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      const value = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      current[j] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }
    if (rowMinimum > limit) return limit + 1;
    previous = current;
  }
  return previous[right.length];
}

function fuzzyScore(option, query) {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return 1;
  const queryPinyin = pinyinText(normalizedQuery);
  const queryInitials = pinyinInitials(normalizedQuery);
  const names = [option.label, ...(option.aliases || [])];
  let best = 0;

  for (const name of names) {
    const key = normalizeQuery(name);
    const keyPinyin = pinyinText(name);
    const keyInitials = pinyinInitials(name);
    if (key.includes(normalizedQuery)) {
      best = Math.max(best, 1000 - key.indexOf(normalizedQuery));
    }
    const pinyinIndexes = [
      keyPinyin.indexOf(normalizedQuery),
      keyPinyin.indexOf(queryPinyin)
    ].filter((index) => index >= 0);
    if (pinyinIndexes.length) {
      best = Math.max(best, 920 - Math.min(...pinyinIndexes));
    }
    if (
      keyInitials.includes(normalizedQuery)
      || keyInitials.includes(queryInitials)
    ) {
      best = Math.max(best, 820);
    }
    const target = queryPinyin || normalizedQuery;
    const distanceLimit = Math.max(1, Math.floor(target.length * 0.28));
    const distance = levenshteinDistance(target, keyPinyin, distanceLimit);
    if (distance <= distanceLimit) {
      best = Math.max(best, 760 - distance * 40);
    }
  }

  return best;
}

function validOptions(options) {
  return (Array.isArray(options) ? options : [])
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => option && option.id);
}

function resultItem(option, index) {
  const item = {
    id: option.id,
    label: option.label,
    index
  };
  if (option.icon) item.icon = option.icon;
  if (option.iconClass) item.iconClass = option.iconClass;
  if (option.iconText) item.iconText = option.iconText;
  if (option.detail) item.detail = option.detail;
  return item;
}

function searchOptions(options, query, limit = Infinity) {
  const cappedLimit = Math.max(0, Number(limit) || 0);
  const source = validOptions(options);
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return source
      .slice(0, cappedLimit)
      .map(({ option, index }) => resultItem(option, index));
  }

  const ranked = source
    .map(({ option, index }) => ({
      option,
      index,
      score: fuzzyScore(option, normalizedQuery)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const selected = ranked.length ? ranked : source;

  return selected
    .slice(0, cappedLimit)
    .map(({ option, index }) => resultItem(option, index));
}

module.exports = {
  normalizeQuery,
  pinyinText,
  pinyinInitials,
  levenshteinDistance,
  fuzzyScore,
  searchOptions
};
