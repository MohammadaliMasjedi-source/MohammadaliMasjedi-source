// MIT; see ../LICENSE. All inputs are enumerated synthetic answer scripts.
import { pathToFileURL } from 'node:url';
import { trace, DEFAULT_LADDER } from '../trace.js';

const START = '2028-02-28';
const DAY = 86_400_000;
export const DESIGN = Object.freeze({ motifLength: 6, horizonDays: 60, fixedReviews: 12, start: START });
export const POLICIES = Object.freeze([
  Object.freeze({ id: 'default5', ladder: DEFAULT_LADDER }),
  Object.freeze({ id: 'doubling5', ladder: Object.freeze([1, 2, 4, 8, 16]) }),
  Object.freeze({ id: 'fixed4', ladder: Object.freeze([4]) }),
]);

function offset(iso) { return (Date.parse(iso + 'T00:00:00Z') - Date.parse(START + 'T00:00:00Z')) / DAY; }

// Left-to-right order is the order of reviews. All 2^6 strings (including rotations)
// have a separate row because the new-card start is fixed, not a stationary phase.
export function scripts() {
  return Array.from({ length: 2 ** DESIGN.motifLength }, (_, i) =>
    i.toString(2).padStart(DESIGN.motifLength, '0').replaceAll('0','A').replaceAll('1','G'));
}

export function observe(script, ladder) {
  if (!/^[AG]{6}$/.test(script)) throw new RangeError('script must have exactly six A/G answers');
  // Waits are positive integers: at most 60 reviews can occur before day 60.
  const count = Math.max(DESIGN.horizonDays, DESIGN.fixedReviews);
  const grades = Array.from({ length: count }, (_, i) => script[i % script.length] === 'G' ? 'good' : 'again');
  const { rows } = trace({ start: START, grades, ladder });
  return {
    reviews_d0_d59: rows.filter(r => offset(r.reviewed) < DESIGN.horizonDays).length,
    review12_day: offset(rows[DESIGN.fixedReviews - 1].reviewed),
    next_after12_day: offset(rows[DESIGN.fixedReviews - 1].due),
  };
}

export function makeRows() {
  return scripts().flatMap(script => {
    const results = POLICIES.map(p => observe(script, p.ladder));
    const baseline = results[0];
    return results.map((r,i) => ({
      script, again_per_6: script.split('A').length - 1, policy: POLICIES[i].id, ...r,
      reviews_minus_default: r.reviews_d0_d59 - baseline.reviews_d0_d59,
      next_after12_minus_default: r.next_after12_day - baseline.next_after12_day,
    }));
  });
}

export function summarize(rows) {
  return POLICIES.map(({id}) => {
    const selected = rows.filter(r => r.policy === id);
    const values = selected.map(r => r.reviews_d0_d59);
    const next = selected.map(r => r.next_after12_day);
    return {
      policy: id, scripts: selected.length,
      min_reviews: Math.min(...values), max_reviews: Math.max(...values),
      total_reviews: values.reduce((a,b) => a+b,0),
      min_next_after12_day: Math.min(...next), max_next_after12_day: Math.max(...next),
      fewer_reviews_vs_default: selected.filter(r => r.reviews_minus_default < 0).length,
      equal_reviews_vs_default: selected.filter(r => r.reviews_minus_default === 0).length,
      more_reviews_vs_default: selected.filter(r => r.reviews_minus_default > 0).length,
    };
  });
}

// Columns and field values are controlled by the experiment; no free text cells.
export function csv(rows) {
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map(r => cols.map(c => r[c]).join(','))].join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [arg, ...extra] = process.argv.slice(2);
  if (extra.length || (arg !== undefined && arg !== '--summary')) {
    process.stderr.write('Usage: node study/workload.js [--summary]\n');
    process.exitCode = 2;
  } else {
    const rows = makeRows();
    process.stdout.write(csv(arg === '--summary' ? summarize(rows) : rows));
  }
}
