// Progress and settings, kept in localStorage under one key, with export to a file and import back.
const STORAGE_KEY = 'leonida-ledger:v1';
const FILE_FORMAT = 'leonida-ledger-progress';

const listeners = new Set();

function emptyState() {
  return { earned: {}, counts: {}, revealed: {}, settings: { spoilerShield: true } };
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
}

// Accepts this app's own state or an exported file and returns a clean state object.
export function normalizeState(input) {
  const state = emptyState();
  if (!input || typeof input !== 'object') return state;
  const source = input.progress && typeof input.progress === 'object' ? input.progress : input;
  for (const [id, when] of Object.entries(source.earned ?? {})) {
    if (/^\d+$/.test(id) && when) state.earned[id] = typeof when === 'string' ? when : new Date().toISOString();
  }
  for (const [id, n] of Object.entries(source.counts ?? {})) {
    const value = Math.floor(Number(n));
    if (/^\d+$/.test(id) && value > 0) state.counts[id] = value;
  }
  for (const [id, on] of Object.entries(source.revealed ?? {})) if (on) state.revealed[id] = true;
  if (source.settings && typeof source.settings.spoilerShield === 'boolean') {
    state.settings.spoilerShield = source.settings.spoilerShield;
  }
  return state;
}

let state = readStorage();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the session still works, it just won't persist */
  }
  for (const fn of listeners) fn(state);
}

export const store = {
  get state() {
    return state;
  },
  onChange(fn) {
    listeners.add(fn);
  },
  isEarned(id) {
    return Boolean(state.earned[id]);
  },
  setEarned(id, on) {
    if (on) state.earned[id] = new Date().toISOString();
    else delete state.earned[id];
    persist();
  },
  toggleEarned(id) {
    this.setEarned(id, !this.isEarned(id));
  },
  count(id, max) {
    if (max && state.earned[id]) return Math.max(max, state.counts[id] ?? 0);
    return state.counts[id] ?? 0;
  },
  setCount(id, value, max) {
    const n = Math.max(0, Math.min(max ?? Infinity, Math.floor(value)));
    if (n) state.counts[id] = n;
    else delete state.counts[id];
    if (max && n >= max) state.earned[id] ??= new Date().toISOString();
    persist();
  },
  isRevealed(id) {
    return Boolean(state.revealed[id]);
  },
  reveal(id) {
    state.revealed[id] = true;
    persist();
  },
  setSpoilerShield(on) {
    state.settings.spoilerShield = on;
    if (on) state.revealed = {};
    persist();
  },
  replace(next) {
    state = normalizeState(next);
    persist();
  },
};

export function exportProgressFile(trophies) {
  const payload = {
    format: FILE_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    earnedCount: Object.keys(state.earned).length,
    total: trophies.length,
    earnedNames: trophies.filter((t) => state.earned[t.id]).map((t) => t.name),
    progress: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `gta6-trophies-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Reads an exported file; also accepts the starter checklist's plain array of trophy names.
export async function importProgressFile(file, trophies) {
  const parsed = JSON.parse(await file.text());
  if (Array.isArray(parsed)) {
    const byName = new Map(trophies.map((t) => [t.name.toLowerCase(), t.id]));
    const earned = {};
    for (const name of parsed) {
      const id = byName.get(String(name).toLowerCase());
      if (id) earned[id] = new Date().toISOString();
    }
    store.replace({ ...state, earned });
  } else if (parsed && (parsed.format === FILE_FORMAT || parsed.earned || parsed.progress)) {
    store.replace(parsed);
  } else {
    throw new Error('This file is not a Leonida Ledger progress file.');
  }
  return Object.keys(state.earned).length;
}
