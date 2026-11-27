// MIT · Copyright (c) 2026 Mohammadali Masjedi
import { createCard, schedule, DEFAULT_LADDER } from './srs.js';
export { DEFAULT_LADDER };
export const GRADES = Object.freeze(['again','hard','good','easy']);

/** Simulate one card: review #1 occurs at start; later reviews occur when due.
 *  Always use UTC calendar dates; no elapsed-time clock, prior knowledge estimate, or RNG. */
export function trace({start, grades, ladder = DEFAULT_LADDER}) {
  if (typeof start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(start))
    throw new RangeError('start must be a date in YYYY-MM-DD format');
  const date = new Date(start+'T00:00:00Z');
  if (!Number.isFinite(+date) || date.toISOString().slice(0,10) !== start)
    throw new RangeError('start must be a valid calendar date');
  if (!Array.isArray(grades) || !grades.length || grades.length > 200 ||
      !Array.from(grades).every(g => GRADES.includes(g)))
    throw new RangeError('use 1–200 grades: again, hard, good, easy');
  if (!Array.isArray(ladder) || !ladder.length || ladder.length > 32 ||
      !Array.from(ladder).every((d,i) => Number.isInteger(d) && d >= 1 && d <= 3650 && (i === 0 || d >= ladder[i-1])))
    throw new RangeError('use 1–32 nondecreasing intervals of 1–3650 whole days');
  let card = createCard('example', 'example', start);
  const rows = grades.map((grade,i) => {
    const {box:from, due:reviewed} = card;
    card = schedule(card,grade,reviewed,{ladder});
    if (!/^\d{4}-\d{2}-\d{2}$/.test(card.due))
      throw new RangeError('schedule exceeds supported four-digit years');
    return {review:i+1, reviewed, grade, from, to:card.box, days:ladder[card.box-1], due:card.due};
  });
  return {start,ladder:[...ladder],rows,nextDue:card.due};
}
