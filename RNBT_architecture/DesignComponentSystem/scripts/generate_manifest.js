#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPONENTS_ROOT = path.join(ROOT, 'Components');
const MIXINS_ROOT = path.join(ROOT, 'Mixins');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');

const IGNORED_DIRS = new Set([
  'assets',
  'docs',
  'models',
  'scripts',
  'styles',
  'views',
]);

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function isDirectory(targetPath) {
  return exists(targetPath) && fs.statSync(targetPath).isDirectory();
}

function readJson(targetPath) {
  return JSON.parse(fs.readFileSync(targetPath, 'utf8'));
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function relativeFromRoot(targetPath) {
  return toPosix(path.relative(ROOT, targetPath));
}

function labelFromFilename(filename) {
  return path.basename(filename, '.html').replace(/_/g, ' ');
}

function listHtmlPreviews(previewDir) {
  if (!isDirectory(previewDir)) return [];

  return fs
    .readdirSync(previewDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map((entry) => ({
      label: labelFromFilename(entry.name),
      path: relativeFromRoot(path.join(previewDir, entry.name)),
    }));
}

function hasComponentContent(componentDir) {
  return (
    exists(path.join(componentDir, 'CLAUDE.md')) ||
    isDirectory(path.join(componentDir, 'preview')) ||
    isDirectory(path.join(componentDir, 'Standard')) ||
    isDirectory(path.join(componentDir, 'Advanced'))
  );
}

function componentNameFromDir(componentDir) {
  return path.basename(componentDir);
}

function specPathFor(targetPath) {
  const specPath = path.join(targetPath, 'CLAUDE.md');
  return exists(specPath) ? relativeFromRoot(specPath) : null;
}

function buildAdvancedItems(advancedDir, seedSet) {
  const seedItems = new Map((seedSet?.items || []).map((item) => [item.name, item]));
  const itemNames = new Set();

  for (const entry of fs.readdirSync(advancedDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;

    const itemDir = path.join(advancedDir, entry.name);
    if (!hasComponentContent(itemDir)) continue;
    itemNames.add(entry.name);
  }

  for (const name of seedItems.keys()) itemNames.add(name);

  return [...itemNames]
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((name) => {
      const itemDir = path.join(advancedDir, name);
      const seedItem = seedItems.get(name);
      const item = {
        name,
        spec: specPathFor(itemDir) || seedItem?.spec || null,
        previews: listHtmlPreviews(path.join(itemDir, 'preview')),
      };
      return item;
    });
}

function buildSet(componentDir, setName, seedSet) {
  const setDir = path.join(componentDir, setName);
  if (!isDirectory(setDir)) {
    return seedSet ? { ...seedSet } : null;
  }

  const set = {
    name: setName,
    spec: specPathFor(setDir) || seedSet?.spec || null,
  };

  const previews = listHtmlPreviews(path.join(setDir, 'preview'));
  if (previews.length > 0) set.previews = previews;

  if (setName === 'Advanced') {
    const items = buildAdvancedItems(setDir, seedSet);
    if (items.length > 0) set.items = items;
  }

  return set;
}

function buildComponent(componentDir, seedComponent) {
  const component = {
    name: componentNameFromDir(componentDir),
    spec: specPathFor(componentDir) || seedComponent?.spec || null,
  };

  const directPreviews = listHtmlPreviews(path.join(componentDir, 'preview'));
  if (directPreviews.length > 0) component.previews = directPreviews;

  const seedSets = new Map((seedComponent?.sets || []).map((set) => [set.name, set]));
  const orderedSetNames = ['Standard', 'Advanced'];
  for (const name of seedSets.keys()) {
    if (!orderedSetNames.includes(name)) orderedSetNames.push(name);
  }

  const sets = orderedSetNames
    .map((setName) => buildSet(componentDir, setName, seedSets.get(setName)))
    .filter(Boolean);

  if (sets.length > 0 || seedComponent?.sets) component.sets = sets;

  return component;
}

function readMixinPurpose(mdPath, seedMixin) {
  if (exists(mdPath)) {
    const content = fs.readFileSync(mdPath, 'utf8');
    const match = content.match(/^## 설계 의도\s+([\s\S]*?)(?:\n## |\n---|\n### |\n$)/m);
    if (match) {
      const lines = match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('>'));
      if (lines.length > 0) return lines[0];
    }
  }

  return seedMixin?.purpose || null;
}

function generateMixins(seedManifest) {
  if (!isDirectory(MIXINS_ROOT)) return seedManifest?.mixins || [];

  const seedMixins = new Map((seedManifest?.mixins || []).map((mixin) => [mixin.name, mixin]));
  const jsNames = fs
    .readdirSync(MIXINS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => path.basename(entry.name, '.js'));

  const orderedNames = [];
  for (const mixin of seedManifest?.mixins || []) orderedNames.push(mixin.name);
  for (const name of jsNames.sort((a, b) => a.localeCompare(b, 'en'))) {
    if (!orderedNames.includes(name)) orderedNames.push(name);
  }

  return orderedNames
    .filter((name) => exists(path.join(MIXINS_ROOT, `${name}.js`)))
    .map((name) => {
      const seedMixin = seedMixins.get(name);
      const jsPath = path.join(MIXINS_ROOT, `${name}.js`);
      const mdPath = path.join(MIXINS_ROOT, `${name}.md`);

      return {
        name,
        purpose: readMixinPurpose(mdPath, seedMixin),
        js: relativeFromRoot(jsPath),
        md: exists(mdPath) ? relativeFromRoot(mdPath) : seedMixin?.md || null,
      };
    });
}

function discoverCategoryComponents(categoryDir, seedCategory) {
  const discovered = new Map();
  const categoryName = path.basename(categoryDir);

  if (
    isDirectory(path.join(categoryDir, 'preview')) ||
    isDirectory(path.join(categoryDir, 'Standard')) ||
    isDirectory(path.join(categoryDir, 'Advanced'))
  ) {
    discovered.set(categoryName, categoryDir);
  }

  for (const entry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (IGNORED_DIRS.has(entry.name)) continue;
    if (entry.name === 'Standard' || entry.name === 'Advanced' || entry.name === 'preview') continue;

    const componentDir = path.join(categoryDir, entry.name);
    if (!hasComponentContent(componentDir)) continue;
    discovered.set(entry.name, componentDir);
  }

  const seedComponents = new Map((seedCategory?.components || []).map((comp) => [comp.name, comp]));
  const orderedNames = [];

  for (const comp of seedCategory?.components || []) orderedNames.push(comp.name);
  for (const name of [...discovered.keys()].sort((a, b) => a.localeCompare(b, 'en'))) {
    if (!orderedNames.includes(name)) orderedNames.push(name);
  }

  return orderedNames.map((name) => {
    const componentDir = discovered.get(name);
    if (!componentDir) return null;
    return buildComponent(componentDir, seedComponents.get(name));
  }).filter(Boolean);
}

function generateManifest(seedManifest) {
  const seedCategories = new Map((seedManifest?.categories || []).map((cat) => [cat.name, cat]));
  const discoveredCategories = fs
    .readdirSync(COMPONENTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const orderedCategoryNames = [];
  for (const category of seedManifest?.categories || []) orderedCategoryNames.push(category.name);
  for (const name of discoveredCategories.sort((a, b) => a.localeCompare(b, 'en'))) {
    if (!orderedCategoryNames.includes(name)) orderedCategoryNames.push(name);
  }

  const categories = orderedCategoryNames.map((name) => {
    const categoryDir = path.join(COMPONENTS_ROOT, name);
    const seedCategory = seedCategories.get(name);

    return {
      name,
      spec: specPathFor(categoryDir) || seedCategory?.spec || null,
      components: discoverCategoryComponents(categoryDir, seedCategory),
    };
  });

  return {
    categories,
    mixins: generateMixins(seedManifest),
  };
}

function main() {
  const seedManifest = exists(MANIFEST_PATH) ? readJson(MANIFEST_PATH) : { categories: [] };
  const nextManifest = generateManifest(seedManifest);

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(nextManifest, null, 2)}\n`);
  console.log(`Updated ${relativeFromRoot(MANIFEST_PATH)}`);
  console.log(`Categories: ${nextManifest.categories.length}`);
}

main();
