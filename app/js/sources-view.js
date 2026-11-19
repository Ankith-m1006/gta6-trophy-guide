// The sources page: every page the guides cite, how many trophies cite it, and how the guide was written.
import { el } from './dom.js';

export function collectSources(trophies) {
  const byUrl = new Map();
  for (const t of trophies) {
    for (const s of t.sources ?? []) {
      const entry = byUrl.get(s.url) ?? { ...s, trophies: [] };
      entry.trophies.push(t.id);
      byUrl.set(s.url, entry);
    }
  }
  return [...byUrl.values()].sort((a, b) => b.trophies.length - a.trophies.length);
}

export function renderSources(root, roadmap, trophies) {
  const sources = collectSources(trophies);
  root.replaceChildren(
    el('div.prose',
      el('h2', 'Sources & method'),
      roadmap.method.map((p) => el('p', p)),
      el('h3', `Pages cited (${sources.length})`),
      el('table.source-table',
        el('thead', el('tr', el('th', 'Source'), el('th', 'Cited by'))),
        el('tbody', sources.map((s) =>
          el('tr',
            el('td', el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name), el('div.muted.url', s.url)),
            el('td', `${s.trophies.length} trophies`))))),
      el('p.muted', 'Links open only when you click them. The app itself loads nothing from the internet and works offline.')),
  );
}
