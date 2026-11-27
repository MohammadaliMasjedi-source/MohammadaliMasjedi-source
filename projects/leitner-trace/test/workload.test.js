// MIT; see ../LICENSE. Integer event calendar independent of the project scheduler.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeRows, summarize, csv, observe, scripts } from '../study/workload.js';

const ladders = { default5: [1, 2, 4, 9, 21], doubling5: [1, 2, 4, 8, 16], fixed4: [4] };

// Count consecutive Gs since the last A, not transitions from a previous box.
// Review k is the cumulative sum of the previous k-1 inter-review intervals.
// Runs until *both* the 60-day window and the fixed 12 reviews are covered.
function oracle(script, waits) {
  let when = 0, reviews = 0, review12, dueAfter12;
  for (let i = 0; when < 60 || i < 12; ++i) {
    if (when < 60) reviews++;
    if (i === 11) review12 = when;
    let run = 0;
    while (run <= i && run < waits.length - 1 && script[(i-run) % 6] === 'G') run++;
    when += waits[run];
    if (i === 11) dueAfter12 = when;
  }
  return [reviews, review12, dueAfter12];
}

test('enumerates all ordered six-answer scripts exactly once and pairs policies', () => {
  const alphabet = new Set(scripts());
  assert.equal(alphabet.size, 64);
  assert.ok([...alphabet].every(s => /^[GA]{6}$/.test(s)));
  const rows = makeRows(); assert.equal(rows.length, 192);
  for (const script of alphabet) {
    const r = rows.filter(r => r.script === script);
    assert.deepEqual(r.map(x => x.policy), Object.keys(ladders));
    for (const x of r) {
      assert.equal(x.again_per_6, Array.from(script).filter(y => y === 'A').length);
      assert.equal(x.reviews_minus_default, x.reviews_d0_d59 - r[0].reviews_d0_d59);
      assert.equal(x.next_after12_minus_default, x.next_after12_day - r[0].next_after12_day);
    }
  }
});

test('every calendar observation agrees with independent integer/run-length oracle', () => {
  for (const r of makeRows()) {
    assert.deepEqual([r.reviews_d0_d59, r.review12_day, r.next_after12_day],
      oracle(r.script, ladders[r.policy]), r.policy + ':' + r.script);
  }
});

test('day 0 counts and day 60 does not; review 12 differs from its next due', () => {
  assert.deepEqual(observe('AAAAAA', [4]), {reviews_d0_d59:15, review12_day:44, next_after12_day:48});
  assert.deepEqual(observe('AAAAAA', [1]), {reviews_d0_d59:60, review12_day:11, next_after12_day:12});
  assert.deepEqual(observe('GGGGGG', ladders.default5), {reviews_d0_d59:6, review12_day:183, next_after12_day:204});
  assert.throws(() => observe('GGGGGX', [1]), RangeError);
});

test('three again answers can produce different counts solely through their order', () => {
  assert.equal(observe('GAGAGA', ladders.default5).reviews_d0_d59, 40);
  assert.equal(observe('GGGAAA', ladders.default5).reviews_d0_d59, 20);
});

test('committed full results and paired summaries exactly match fresh output', () => {
  const rows = makeRows();
  for (const [path, actual] of [['workload.csv',rows],['summary.csv',summarize(rows)]]) {
    assert.equal(csv(actual), readFileSync(new URL('../study/'+path,import.meta.url),'utf8'));
  }
});
