// The spoiler shield: story trophies, and any trophy PlayStation lists as hidden, keep their name,
// description and guide covered until earned (or until the reader reveals that one trophy).
export function isSpoilerTrophy(trophy) {
  return Boolean(trophy.hidden) || (trophy.kinds ?? []).includes('story');
}

export function isConcealed(trophy, store) {
  return (
    store.state.settings.spoilerShield &&
    isSpoilerTrophy(trophy) &&
    trophy.grade !== 'platinum' &&
    !store.isEarned(trophy.id) &&
    !store.isRevealed(trophy.id)
  );
}

export function concealedTitle(trophy) {
  return trophy.hidden ? 'Hidden trophy' : 'Story trophy';
}

export function concealedHint(trophy) {
  const where = trophy.chapter ? ` · ${trophy.chapter}` : '';
  return `Covered by the spoiler shield${where}`;
}
