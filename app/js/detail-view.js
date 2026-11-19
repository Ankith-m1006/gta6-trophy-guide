// The guide pane for one trophy: official text, our guide, steps, missable warning and cited sources.
import { el, gradeIcon } from './dom.js';
import { isConcealed, concealedTitle } from './spoilers.js';

function sourceList(trophy) {
  const sources = trophy.sources ?? [];
  return el('section.sources-box',
    el('h3', `Sources (${sources.length})`),
    sources.length
      ? el('ul.source-list', sources.map((s) =>
          el('li', el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.name), s.note ? el('span.source-note', ` · ${s.note}`) : null)))
      : el('p.muted', 'No source yet.'));
}

function countControl(trophy, store, onCount) {
  const value = store.count(trophy.id, trophy.count);
  const set = (n) => onCount(trophy.id, n, trophy.count);
  return el('div.counter',
    el('span.counter-label', 'Your count'),
    el('button.btn.small', { type: 'button', onclick: () => set(value - 1), 'aria-label': 'Minus one' }, '−'),
    el('input.counter-input', { type: 'number', min: 0, max: trophy.count, value, 'aria-label': 'Count', onchange: (e) => set(Number(e.target.value)) }),
    el('span.counter-max', `/ ${trophy.count}`),
    el('button.btn.small', { type: 'button', onclick: () => set(value + 1), 'aria-label': 'Plus one' }, '+'),
    el('div.bar', el('span', { style: `width:${Math.min(100, (value / trophy.count) * 100)}%` })));
}

export function renderDetail(root, trophy, store, handlers) {
  if (!trophy) {
    root.replaceChildren(el('div.detail-empty', el('p', 'Pick a trophy to read its guide.'), el('p.muted', 'Keys: / search · j/k move · x mark earned')));
    return;
  }
  const earned = store.isEarned(trophy.id);
  if (isConcealed(trophy, store)) {
    root.replaceChildren(
      el('div.detail-head', gradeIcon(trophy.grade), el('div', el('h2', concealedTitle(trophy)), el('p.official', 'Name, description and guide are covered by the spoiler shield.'))),
      el('div.concealed-box',
        el('p', trophy.chapter ? `Story progress · ${trophy.chapter} · roadmap stage ${trophy.stage}` : `Roadmap stage ${trophy.stage}`),
        trophy.missable ? el('p.miss-note', '⚠ This one can be missed. Reveal it before you go further in the story.') : null,
        el('button.btn.gold', { type: 'button', onclick: () => handlers.onReveal(trophy.id) }, 'Reveal this trophy')),
    );
    return;
  }
  root.replaceChildren(...[
    el('div.detail-head',
      gradeIcon(trophy.grade),
      el('div',
        el('h2', trophy.name),
        el('p.official', { title: 'Official PlayStation description' }, `“${trophy.description}”`),
        el('p.meta',
          el(`span.grade-word.g-${trophy.grade}`, trophy.grade),
          trophy.hidden ? ' · hidden on PSN' : '',
          trophy.chapter ? ` · ${trophy.chapter}` : '',
          trophy.stage ? ` · roadmap stage ${trophy.stage}` : '',
          trophy.rarity ? ` · ${trophy.rarity.replace(' on PSNProfiles (launch week)', ' PSNP')}` : '')),
      el(`button.btn.earn${earned ? '.on' : ''}`, { type: 'button', onclick: () => handlers.onToggle(trophy.id) }, earned ? '✓ Earned' : 'Mark earned')),
    trophy.missable
      ? el('div.callout.miss', el('strong', 'Missable · '), trophy.missable)
      : el('div.callout.safe', el('strong', 'Not missable · '), trophy.when ?? 'Can be finished after the story.'),
    trophy.count ? countControl(trophy, store, handlers.onCount) : null,
    el('section.guide',
      el('h3', 'Guide'),
      el('p.guide-text', trophy.guide)),
    sourceList(trophy),
    trophy.steps?.length ? el('section.guide', el('h3', 'Steps'), el('ol.steps', trophy.steps.map((s) => el('li', s)))) : null,
    trophy.missable && trophy.when ? el('p.when', el('strong', 'When: '), trophy.when) : null,
  ].filter(Boolean));
}
