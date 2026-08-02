/* by Capitanul burcea,alex */
/**
 * Database simplu bazat pe JSON (fara dependinte externe)
 * Persista datele intre restarturi in folderul /data
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const cache = new Map();
const dirtyFiles = new Set();
const timers = new Map();
const WRITE_DELAY_MS = Number(process.env.DB_WRITE_DELAY_MS) || 750;

const stats = {
  reads: 0,
  writes: 0,
  diskReads: 0,
  diskWrites: 0,
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(file) {
  return path.join(DATA_DIR, `${file}.json`);
}

function load(file) {
  stats.reads++;
  if (cache.has(file)) return cache.get(file);

  ensureDataDir();
  const fp = filePath(file);
  if (!fs.existsSync(fp)) return {};

  try {
    stats.diskReads++;
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    cache.set(file, data);
    return data;
  } catch {
    cache.set(file, {});
    return {};
  }
}

function writeFile(file, data) {
  ensureDataDir();
  const fp = filePath(file);
  const tmp = `${fp}.${process.pid}.${Date.now()}.tmp`;

  try {
    fs.writeFileSync(tmp, JSON.stringify(data ?? {}, null, 2));
    fs.renameSync(tmp, fp);
    stats.diskWrites++;
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {}
    throw err;
  }
}

function flush(file) {
  if (!dirtyFiles.has(file)) return;
  clearTimeout(timers.get(file));
  timers.delete(file);
  try {
    writeFile(file, cache.get(file) ?? {});
    dirtyFiles.delete(file);
  } catch (err) {
    console.error(`[DB] Nu pot salva data/${file}.json:`, err);
    scheduleSave(file);
  }
}

function flushAll() {
  for (const file of [...dirtyFiles]) flush(file);
}

function scheduleSave(file) {
  dirtyFiles.add(file);
  clearTimeout(timers.get(file));
  timers.set(file, setTimeout(() => flush(file), WRITE_DELAY_MS));
}

function save(file, data, options = {}) {
  stats.writes++;
  cache.set(file, data ?? {});
  dirtyFiles.add(file);
  if (options.immediate) flush(file);
  else scheduleSave(file);
}

function get(file, key) {
  return load(file)[key];
}

function set(file, key, value) {
  const data = load(file);
  data[key] = value;
  save(file, data);
}

function del(file, key) {
  const data = load(file);
  delete data[key];
  save(file, data);
}

function getAll(file) {
  return load(file);
}

function getStats() {
  return {
    ...stats,
    cachedFiles: cache.size,
    pendingWrites: dirtyFiles.size,
    writeDelayMs: WRITE_DELAY_MS,
  };
}

process.once('beforeExit', flushAll);
process.once('SIGINT', () => {
  flushAll();
  process.exit(0);
});
process.once('SIGTERM', () => {
  flushAll();
  process.exit(0);
});

module.exports = { get, set, del, getAll, load, save, flush, flushAll, getStats };
