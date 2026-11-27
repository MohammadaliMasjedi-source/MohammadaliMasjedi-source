// MIT · Copyright (c) 2026 Mohammadali Masjedi
'use strict';

/** Number of days to wait after reaching each successive box. */
const DEFAULT_LADDER = Object.freeze([1, 2, 4, 9, 21]);

/** Grades that mean "I knew it, move on". */
const PASS_GRADES = new Set(['pass', 'good', 'easy', 'true']);
/** Grades that mean "I missed it, reset". */
const FAIL_GRADES = new Set(['fail', 'again', 'false']);

/* ---------------------------------------------------------------------
 * Date helpers — ISO "YYYY-MM-DD" in, ISO out. UTC-based so they never
 * drift with the local timezone (the web copies used local-date string
 * building; this is the same calendar result, computed safely in UTC).
 * ------------------------------------------------------------------- */

/** Today as an ISO date string. Pass a Date for testability; defaults to now. */
function todayISO(d) {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().slice(0, 10);
}

/** Add `days` to an ISO date (or to today if `fromISO` omitted). Returns ISO. */
function addDaysISO(days, fromISO) {
  // Anchor at UTC midnight so day arithmetic is exact and DST-proof.
  const base = fromISO ? new Date(fromISO + 'T00:00:00Z') : new Date();
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Normalize a ladder option into a valid non-empty array of positive days. */
function resolveLadder(opts) {
  const ladder = opts?.ladder ?? DEFAULT_LADDER;
  if (!Array.isArray(ladder) || ladder.length === 0) {
    throw new Error('srs: ladder must be a non-empty array of day counts');
  }
  if (!Array.from(ladder).every(x => Number.isSafeInteger(x) && x > 0)) {
    throw new RangeError('srs: ladder entries must be positive whole days');
  }
  return ladder;
}

/* ---------------------------------------------------------------------
 * The card model (plain object — no class, so it serializes cleanly):
 *   { id, deck, box, due, reps, lapses }
 *   box   : 1-based box number (1..ladder.length)
 *   due   : ISO date the card next becomes due (inclusive)
 *   reps  : count of successful reviews
 *   lapses: count of failed reviews
 * Any extra fields a consumer attaches (front/back/realm/...) are preserved.
 * ------------------------------------------------------------------- */

/** Create a fresh card: box 1, due today (so brand-new cards are due now). */
function createCard(id, deck, today) {
  return {
    id: id,
    deck: deck || '',
    box: 1,
    due: todayISO(today),
    reps: 0,
    lapses: 0,
  };
}

/** Map an incoming grade to a box delta. Returns either {reset:true} or {delta}. */
function gradeToMove(grade) {
  // Booleans: true = pass, false = fail (the Leitner pass/fail vocabulary).
  if (grade === true) return { delta: 1 };
  if (grade === false) return { reset: true };

  const g = String(grade).toLowerCase();
  if (FAIL_GRADES.has(g)) return { reset: true };
  if (g === 'hard') return { delta: 0 };   // stay in the same box
  if (g === 'easy') return { delta: 2 };   // jump two boxes
  if (PASS_GRADES.has(g)) return { delta: 1 };

  throw new Error('srs: unknown grade ' + JSON.stringify(grade));
}

/**
 * Apply a review answer to a card. PURE — returns a NEW card object and never
 * mutates the input.
 *
 * @param {object} card   the card to advance
 * @param {string|boolean} grade  'again'|'hard'|'good'|'easy' | 'pass'|'fail' | true|false
 * @param {string} [today]  ISO date the review happened on (defaults to now)
 * @param {object} [opts]   { ladder: number[] } — configurable interval ladder
 * @returns {object} the updated card (box clamped, new due date)
 */
function schedule(card, grade, today, opts) {
  const ladder = resolveLadder(opts);
  const max = ladder.length;
  const c = Object.assign({}, card);
  const move = gradeToMove(grade);

  if (move.reset) {
    c.box = 1;
    c.lapses = (c.lapses || 0) + 1;
  } else {
    c.box = Math.min(Math.max((c.box || 1) + move.delta, 1), max);
    c.reps = (c.reps || 0) + 1;
  }
  // Next due = today + the ladder interval for the new box.
  c.due = addDaysISO(ladder[c.box - 1], todayISO(today));
  return c;
}

/** True when the card is due on/before `today` (a card with no due date is due). */
function isDue(card, today) {
  if (!card || !card.due) return true;
  return card.due <= todayISO(today);
}

/** Filter a list of cards down to the ones due on/before `today`. */
function dueCards(cards, today) {
  const t = todayISO(today);
  return (cards || []).filter((c) => isDue(c, t));
}

/* ---- the public surface ----
 * Named exports for tree-shaken imports, plus a default object bundling the
 * same API for `import srs from './srs.js'` ergonomics. */
export {
  DEFAULT_LADDER,
  createCard,
  schedule,
  isDue,
  dueCards,
  todayISO,
  addDaysISO,
};

export default {
  DEFAULT_LADDER,
  createCard,
  schedule,
  isDue,
  dueCards,
  todayISO,
  addDaysISO,
};
