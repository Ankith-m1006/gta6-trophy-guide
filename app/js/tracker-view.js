// The tracker board: progress summary, kind filter chips and the trophy checklist.
import { el, gradeIcon } from './dom.js';
import { KIND_FILTERS, countByKind } from './filters.js';
import { isConcealed, concealedTitle, concealedHint } from './spoilers.js';

const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

export function renderSummary(root, trophies, store) {
  const earned = trophies.filter((t) => store.isEarned(t.id));
  const pct = Math.round((earned.length / trophies.length) * 100);
  const ring = el('div.ring', { style: `--pct:${pct}`, title: `${earned.length} of ${trophies.length} trophies` },
    el('span.ring-value', `${pct}%`));
  const grades = GRADES.map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => store.isEarned(t.id)).length;
    return el(`span.grade-count.g-${g}`, { title: `${g}: ${got} of ${all.length}` }, gradeIcon(g), `${got}/${all.length}`);
  });
  const missLeft = trophies.filter((t) => t.missable && !store.isEarned(t.id)).length;
  root.replaceChildren(
    ring,
    el('div.summary-text',
      el('strong', `${earned.length} / ${trophies.length} earned`),
      el('div.grade-counts', grades),
      el('span.miss-left', { title: 'Missable trophies not yet earned' }, `⚠ ${missLeft} missable left`)),
  );
}

export function renderKindFilters(root, trophies, active, onPick) {
  const counts = countByKind(trophies);
  root.replaceChildren(
    ...KIND_FILTERS.map((f) =>
      el(`button.chip${f.id === active ? '.on' : ''}${f.id === 'missable' ? '.chip-miss' : ''}`,
        {
          type: 'button',
          disabled: counts[f.id] === 0,
          'aria-pressed': String(f.id === active),
          title: counts[f.id] === 0 ? 'The official list has no online trophies' : `Show ${f.label.toLowerCase()} trophies`,
          onclick: () => onPick(f.id),
        },
        f.label,
        el('span.chip-count', String(counts[f.id])))),
  );
}

function tagsFor(trophy, store) {
  const tags = [];
  if (trophy.missable) tags.push(el('span.tag.tag-miss', { title: trophy.missable }, 'Missable'));
  if (trophy.hidden) tags.push(el('span.tag.tag-hidden', 'Hidden'));
  if ((trophy.kinds ?? []).includes('story') && !trophy.hidden) tags.push(el('span.tag.tag-story', 'Story'));
  if (trophy.count) tags.push(el('span.tag.tag-count', `${store.count(trophy.id, trophy.count)}/${trophy.count}`));
  if (trophy.stage) tags.push(el('span.tag.tag-stage', { title: `Platinum roadmap stage ${trophy.stage}` }, `S${trophy.stage}`));
  return tags;
}

export function renderTrophyList(root, list, store, selectedId, handlers) {
  if (!list.length) {
    root.replaceChildren(el('li.empty', 'No trophy matches these filters. Clear the search or pick “All”.'));
    return;
  }
  root.replaceChildren(
    ...list.map((t) => {
      const concealed = isConcealed(t, store);
      const earned = store.isEarned(t.id);
      const check = el('input.check', {
        type: 'checkbox',
        checked: earned,
        'aria-label': `Mark ${concealed ? 'this trophy' : t.name} earned`,
        onclick: (e) => e.stopPropagation(),
        onchange: () => handlers.onToggle(t.id),
      });
      return el(`li.trophy${earned ? '.earned' : ''}${t.id === selectedId ? '.selected' : ''}${concealed ? '.concealed' : ''}`,
        { dataset: { id: t.id }, tabIndex: 0, onclick: () => handlers.onSelect(t.id), onkeydown: (e) => e.key === 'Enter' && handlers.onSelect(t.id) },
        check,
        gradeIcon(t.grade),
        el('div.trophy-text',
          el('div.trophy-name', concealed ? concealedTitle(t) : t.name),
          el('div.trophy-desc', concealed ? concealedHint(t) : t.description)),
        el('div.tags', tagsFor(t, store)));
    }),
  );
}
