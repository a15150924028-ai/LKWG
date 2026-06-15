function normalizeQuery(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function searchOptions(options, query, limit = 20) {
  const keyword = normalizeQuery(query);
  return (Array.isArray(options) ? options : [])
    .map((option, index) => ({
      id: option.id,
      label: option.label,
      index
    }))
    .filter((option) => (
      option.id
      && (!keyword || normalizeQuery(option.label).includes(keyword))
    ))
    .slice(0, Math.max(0, Number(limit) || 0));
}

module.exports = {
  normalizeQuery,
  searchOptions
};
