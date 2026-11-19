// Filtering and search over the trophy list. Search never matches text the spoiler shield is hiding.
import { isConcealed } from './spoilers.js';

export const KIND_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectible', label: 'Collectibles' },
  { id: 'activity', label: 'Activities' },
  { id: 'crime', label: 'Crime & heists' },
  { id: 'world', label: 'World & misc' },
  { id: 'online', label: 'Online' },
];

export function hasKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return Boolean(trophy.missable);
  return (trophy.kinds ?? []).includes(kind);
}

function fold(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[^\p{L}\p{N}'*.&$]+/gu, ' ');
}

function searchableText(trophy, store) {
  if (isConcealed(trophy, store)) return fold(`${trophy.grade} hidden story trophy ${trophy.chapter ?? ''}`);
  return fold(
    [trophy.name, trophy.description, trophy.grade, trophy.chapter, trophy.mission, trophy.guide, (trophy.steps ?? []).join(' '), (trophy.kinds ?? []).join(' ')].join(' '),
  );
}

export function filterTrophies(trophies, { kind, grade, status, query }, store) {
  const words = fold(query).split(' ').filter(Boolean);
  return trophies.filter((t) => {
    if (!hasKind(t, kind)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    const earned = store.isEarned(t.id);
    if (status === 'earned' && !earned) return false;
    if (status === 'todo' && earned) return false;
    if (!words.length) return true;
    const text = searchableText(t, store);
    return words.every((w) => text.includes(w));
  });
}

export function countByKind(trophies) {
  const counts = {};
  for (const f of KIND_FILTERS) counts[f.id] = trophies.filter((t) => hasKind(t, f.id)).length;
  return counts;
}
