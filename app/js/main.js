// Boots the guide: loads the trophy and roadmap data from app/data, wires the views and the hash router.
import { $, showToast } from './dom.js';
import { store, exportProgressFile, importProgressFile } from './store.js';
import { filterTrophies } from './filters.js';
import { renderSummary, renderKindFilters, renderTrophyList } from './tracker-view.js';
import { renderDetail } from './detail-view.js';
import { renderRoadmap } from './roadmap-view.js';
import { renderSources } from './sources-view.js';

const ui = { view: 'tracker', kind: 'all', grade: 'all', status: 'all', query: '', selected: null };
let trophies = [];
let roadmap = null;

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

const handlers = {
  onToggle(id) {
    store.toggleEarned(id);
  },
  onSelect(id) {
    location.hash = `#/trophy/${id}`;
  },
  onReveal(id) {
    store.reveal(id);
  },
  onCount(id, value, max) {
    store.setCount(id, value, max);
  },
};

function visibleTrophies() {
  return filterTrophies(trophies, ui, store);
}

function renderTracker() {
  const list = visibleTrophies();
  if (ui.selected == null || !trophies.some((t) => t.id === ui.selected)) ui.selected = list[0]?.id ?? null;
  renderKindFilters($('#kind-filters'), trophies, ui.kind, (kind) => {
    ui.kind = kind;
    render();
  });
  renderTrophyList($('#trophy-list'), list, store, ui.selected, handlers);
  renderDetail($('#detail'), trophies.find((t) => t.id === ui.selected), store, handlers);
}

function render() {
  renderSummary($('#summary'), trophies, store);
  $('#spoiler-toggle').checked = store.state.settings.spoilerShield;
  for (const tab of document.querySelectorAll('.tab')) tab.classList.toggle('on', tab.dataset.view === ui.view);
  for (const view of document.querySelectorAll('.view')) view.hidden = view.dataset.view !== ui.view;
  if (ui.view === 'tracker') renderTracker();
  if (ui.view === 'roadmap') renderRoadmap($('#view-roadmap'), roadmap, trophies, store, handlers);
  if (ui.view === 'sources') renderSources($('#view-sources'), roadmap, trophies);
}

// #/tracker, #/roadmap, #/sources or #/trophy/<id> (opens that trophy's guide in the tracker).
function route() {
  const [, view = 'tracker', id] = location.hash.split('/');
  if (view === 'trophy' && id) {
    ui.view = 'tracker';
    ui.selected = Number(id);
    if (!visibleTrophies().some((t) => t.id === ui.selected)) Object.assign(ui, { kind: 'all', grade: 'all', status: 'all', query: '' });
    $('#search').value = ui.query;
  } else {
    ui.view = ['tracker', 'roadmap', 'sources'].includes(view) ? view : 'tracker';
  }
  render();
  if (view === 'trophy') document.querySelector('.trophy.selected')?.scrollIntoView({ block: 'center' });
}

function moveSelection(step) {
  const list = visibleTrophies();
  const index = list.findIndex((t) => t.id === ui.selected);
  const next = list[Math.max(0, Math.min(list.length - 1, index + step))];
  if (next) handlers.onSelect(next.id);
}

function bindControls() {
  $('#search').addEventListener('input', (e) => {
    ui.query = e.target.value;
    ui.selected = null;
    render();
  });
  $('#grade-filter').addEventListener('change', (e) => {
    ui.grade = e.target.value;
    render();
  });
  $('#status-filter').addEventListener('change', (e) => {
    ui.status = e.target.value;
    render();
  });
  $('#spoiler-toggle').addEventListener('change', (e) => {
    store.setSpoilerShield(e.target.checked);
    showToast(e.target.checked ? 'Spoiler shield on: story trophies stay covered until earned.' : 'Spoiler shield off: every name and guide is shown.');
  });
  $('#export-btn').addEventListener('click', () => {
    exportProgressFile(trophies);
    showToast('Progress exported to a .json file.');
  });
  $('#import-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = await importProgressFile(file, trophies);
      showToast(`Imported: ${n} of ${trophies.length} trophies earned.`);
    } catch (err) {
      showToast(`Import failed: ${err.message}`);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === '/') {
      e.preventDefault();
      location.hash = '#/tracker';
      $('#search').focus();
    } else if (ui.view === 'tracker' && (e.key === 'j' || e.key === 'ArrowDown')) {
      e.preventDefault();
      moveSelection(1);
    } else if (ui.view === 'tracker' && (e.key === 'k' || e.key === 'ArrowUp')) {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === 'x' && ui.selected) {
      handlers.onToggle(ui.selected);
    }
  });
  window.addEventListener('hashchange', route);
  store.onChange(render);
}

async function boot() {
  try {
    const [trophyDoc, roadmapDoc] = await Promise.all([loadJson('data/trophies.json'), loadJson('data/roadmap.json')]);
    trophies = trophyDoc.trophies;
    roadmap = roadmapDoc;
  } catch (err) {
    $('#trophy-list').textContent = `Could not load the trophy data (${err.message}). Serve the app/ folder with a static server.`;
    return;
  }
  bindControls();
  route();
}

boot();
