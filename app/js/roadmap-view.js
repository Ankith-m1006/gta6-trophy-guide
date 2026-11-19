// The platinum roadmap: stages in the order to play them, each with its trophies, plus a missable watchlist.
import { el, gradeIcon } from './dom.js';
import { isConcealed, concealedTitle } from './spoilers.js';

function trophyLine(t, store, handlers) {
  const concealed = isConcealed(t, store);
  const earned = store.isEarned(t.id);
  return el(`li.rm-trophy${earned ? '.earned' : ''}${t.missable ? '.is-miss' : ''}`,
    el('input.check', { type: 'checkbox', checked: earned, 'aria-label': 'Mark earned', onchange: () => handlers.onToggle(t.id) }),
    gradeIcon(t.grade),
    el('a.rm-name', { href: `#/trophy/${t.id}` }, concealed ? `${concealedTitle(t)}${t.chapter ? ` · ${t.chapter}` : ''}` : t.name),
    !concealed && (t.mission || t.chapter) ? el('span.rm-mission', t.mission ?? t.chapter) : null,
    t.missable ? el('span.tag.tag-miss', { title: t.missable }, 'Missable') : null,
    t.count ? el('span.tag.tag-count', `${store.count(t.id, t.count)}/${t.count}`) : null);
}

function stageCard(stage, trophies, store, handlers) {
  const got = trophies.filter((t) => store.isEarned(t.id)).length;
  const pct = trophies.length ? Math.round((got / trophies.length) * 100) : 0;
  return el('article.stage',
    el('header.stage-head',
      el('span.stage-num', String(stage.stage)),
      el('div', el('h3', stage.title), el('p.stage-sub', stage.summary)),
      el('span.stage-pct', `${got}/${trophies.length}`)),
    el('div.bar', el('span', { style: `width:${pct}%` })),
    stage.tips?.length ? el('ul.stage-tips', stage.tips.map((tip) => el('li', tip))) : null,
    el('ol.rm-list', trophies.map((t) => trophyLine(t, store, handlers))));
}

function missableWatchlist(trophies, store) {
  const missables = trophies.filter((t) => t.missable).sort((a, b) => (a.missOrder ?? 99) - (b.missOrder ?? 99));
  const left = missables.filter((t) => !store.isEarned(t.id)).length;
  return el('aside.watchlist',
    el('h3', '⚠ Missable watchlist'),
    el('p.muted', `${left} of ${missables.length} still at risk. Ordered by when the window closes.`),
    el('ol.watch', missables.map((t) => {
      const concealed = isConcealed(t, store);
      return el(`li${store.isEarned(t.id) ? '.earned' : ''}`,
        el('a', { href: `#/trophy/${t.id}` }, concealed ? `${concealedTitle(t)}${t.chapter ? ` · ${t.chapter}` : ''}` : t.name),
        el('span.watch-why', t.missDeadline ?? (concealed ? 'Reveal it in the tracker to read the warning.' : t.missable)));
    })));
}

export function renderRoadmap(root, roadmap, trophies, store, handlers) {
  const byStage = new Map(roadmap.stages.map((s) => [s.stage, []]));
  for (const t of trophies) byStage.get(t.stage)?.push(t);
  for (const list of byStage.values()) list.sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  root.replaceChildren(
    el('div.rm-intro',
      el('div', el('h2', 'Road to “Vice Got a Price!”'), el('p', roadmap.intro),
        el('p.rm-cite', 'Facts from ', (roadmap.factSources ?? []).map((s, i) => [i ? ', ' : '', el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name)]))),
      el('dl.rm-facts', roadmap.facts.map((f) => el('div', el('dt', f.label), el('dd', f.value))))),
    el('div.rm-grid',
      el('div.stages', roadmap.stages.map((s) => stageCard(s, byStage.get(s.stage), store, handlers))),
      missableWatchlist(trophies, store)),
  );
}
