/* by Capitanul burcea,alex */
const fs = require('node:fs');
const path = require('node:path');

const candidateRoots = [
  path.resolve(__dirname, '..'),
  path.resolve(__dirname, '..', '..'),
  path.resolve(__dirname, '..', '..', '..'),
];

function findCatalogDir() {
  for (const rootDir of candidateRoots) {
    const catalogDir = path.join(rootDir, 'templates', 'game-plugins');
    const registryPath = path.join(catalogDir, 'registry.json');
    if (fs.existsSync(registryPath)) {
      return { catalogDir, registryPath };
    }
  }

  return {
    catalogDir: path.join(candidateRoots[0], 'templates', 'game-plugins'),
    registryPath: path.join(candidateRoots[0], 'templates', 'game-plugins', 'registry.json'),
  };
}

const { catalogDir: CATALOG_DIR, registryPath: REGISTRY_PATH } = findCatalogDir();

function loadCatalog() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    return Array.isArray(data.templates) ? data.templates : [];
  } catch (error) {
    return [];
  }
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function getTemplate(id) {
  const wanted = normalize(id);
  return loadCatalog().find((template) => {
    const aliases = [template.id, template.game, ...(template.aliases || [])].map(normalize);
    return aliases.includes(wanted);
  }) || null;
}

function templateChoices() {
  return loadCatalog().slice(0, 25).map((template) => ({
    name: `${template.game} - ${template.title}`.slice(0, 100),
    value: template.id,
  }));
}

function listText() {
  return loadCatalog()
    .map((template) => `/${template.id} - ${template.game}: ${template.title}`)
    .join('\n');
}

function templateSummary(template) {
  if (!template) return 'Template necunoscut.';

  const files = (template.files || [])
    .map((file) => `- ${file.id}: templates/game-plugins/${file.path}`)
    .join('\n');

  return [
    `${template.game}: ${template.title}`,
    template.description,
    '',
    `Install: ${template.install}`,
    '',
    'Files:',
    files,
  ].join('\n');
}

function readTemplateFile(template, fileId) {
  if (!template) return null;
  const wanted = normalize(fileId || template.primaryFile || 'plugin');
  const file = (template.files || []).find((item) => normalize(item.id) === wanted) || template.files?.[0];
  if (!file) return null;

  const fullPath = path.join(CATALOG_DIR, file.path);
  const content = fs.readFileSync(fullPath, 'utf8');
  return {
    id: file.id,
    path: `templates/game-plugins/${file.path}`,
    content,
  };
}

function codeBlockLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.lua') return 'lua';
  if (ext === '.pwn' || ext === '.sma' || ext === '.sp') return 'c';
  if (ext === '.cs') return 'csharp';
  if (ext === '.java') return 'java';
  if (ext === '.js') return 'js';
  if (ext === '.yml' || ext === '.yaml') return 'yaml';
  if (ext === '.md') return 'md';
  if (ext === '.env') return 'env';
  return '';
}

function trimForDiscord(text, max = 3300) {
  const value = String(text || '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function templateMessage(id, fileId) {
  const template = getTemplate(id);
  if (!template) {
    return {
      ok: false,
      title: 'Template negasit',
      description: `Template disponibil:\n${listText()}`,
    };
  }

  const file = readTemplateFile(template, fileId);
  const summary = templateSummary(template);
  const language = file ? codeBlockLanguage(file.path) : '';
  const code = file ? `\n\nFile: ${file.path}\n\n\`\`\`${language}\n${trimForDiscord(file.content, 2500)}\n\`\`\`` : '';

  return {
    ok: true,
    title: `${template.game} Template`,
    description: trimForDiscord(`${summary}${code}`, 3900),
  };
}

module.exports = {
  loadCatalog,
  getTemplate,
  templateChoices,
  listText,
  templateSummary,
  readTemplateFile,
  templateMessage,
};
