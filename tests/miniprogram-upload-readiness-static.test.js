const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const miniRoot = path.join(packageRoot, "miniprogram");
const maxMainPackageBytes = 2 * 1024 * 1024;

function walk(dir, filter = () => true) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(file, filter));
    } else if (filter(file)) {
      files.push(file);
    }
  }
  return files;
}

const projectConfig = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "project.config.json"), "utf8")
);

assert.strictEqual(projectConfig.compileType, "miniprogram");
assert.strictEqual(projectConfig.miniprogramRoot, "miniprogram/");
assert(projectConfig.appid && projectConfig.appid.startsWith("wx"));

const appJson = JSON.parse(fs.readFileSync(path.join(miniRoot, "app.json"), "utf8"));
assert.strictEqual(appJson.sitemapLocation, "sitemap.json");
assert(fs.existsSync(path.join(miniRoot, appJson.sitemapLocation)));

for (const page of appJson.pages) {
  for (const extension of ["js", "json", "wxml", "wxss"]) {
    assert(
      fs.existsSync(path.join(miniRoot, `${page}.${extension}`)),
      `missing page file: ${page}.${extension}`
    );
  }
}

for (const page of appJson.pages) {
  const pageConfigPath = path.join(miniRoot, `${page}.json`);
  const pageConfig = JSON.parse(fs.readFileSync(pageConfigPath, "utf8"));
  for (const [name, componentPath] of Object.entries(pageConfig.usingComponents || {})) {
    const componentBase = componentPath.startsWith("/")
      ? path.join(miniRoot, componentPath.slice(1))
      : path.join(path.dirname(pageConfigPath), componentPath);
    for (const extension of ["js", "json", "wxml", "wxss"]) {
      assert(
        fs.existsSync(`${componentBase}.${extension}`),
        `missing component ${name}: ${componentPath}.${extension}`
      );
    }
  }
}

const sourceFiles = walk(miniRoot, (file) => /\.(js|json|wxml|wxss)$/.test(file));
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  assert(!source.includes("\uFFFD"), `replacement character found in ${file}`);

  if (file.endsWith(".json")) {
    JSON.parse(source);
  } else if (file.endsWith(".js")) {
    new Function(source);
  }

  const localReferences = source.matchAll(
    /['"]((?:\.\.\/|\.\/|\/)?(?:assets|components|data|domain|pages|utils)\/[^'"\s)]+)['"]/g
  );
  for (const match of localReferences) {
    const reference = match[1];
    const target = reference.startsWith("/")
      ? path.join(miniRoot, reference.slice(1))
      : path.join(path.dirname(file), reference);
    const candidates = [
      target,
      `${target}.js`,
      `${target}.json`,
      `${target}.wxml`,
      `${target}.wxss`
    ];
    assert(
      candidates.some((candidate) => fs.existsSync(candidate)),
      `missing local reference ${reference} in ${file}`
    );
  }
}

const wxmlFiles = sourceFiles.filter((file) => file.endsWith(".wxml"));
for (const file of wxmlFiles) {
  const source = fs.readFileSync(file, "utf8");
  assert(!/<\/?(?:div|span)\b/.test(source), `HTML tag found in WXML: ${file}`);
  assert(!/{{[^}]*\w+\([^}]*}}/.test(source), `method call in WXML binding: ${file}`);

  const stack = [];
  for (const match of source.matchAll(/<\/?([a-zA-Z0-9_-]+)(?:\s[^<>]*)?>/g)) {
    const fullTag = match[0];
    const tagName = match[1];
    if (fullTag.startsWith("</")) {
      assert.strictEqual(
        stack.pop(),
        tagName,
        `mismatched closing tag ${fullTag} in ${file}`
      );
    } else if (!fullTag.endsWith("/>") && !["image", "input"].includes(tagName)) {
      stack.push(tagName);
    }
  }
  assert.deepStrictEqual(stack, [], `unclosed WXML tags in ${file}`);
}

let packageBytes = 0;
for (const file of walk(miniRoot)) {
  packageBytes += fs.statSync(file).size;
}
assert(
  packageBytes < maxMainPackageBytes,
  `Mini Program package ${packageBytes} bytes exceeds 2 MiB main-package limit`
);

console.log(
  `miniprogram upload readiness checks passed (${packageBytes} bytes, ${wxmlFiles.length} WXML files)`
);
