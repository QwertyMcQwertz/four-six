// node test.js
const assert = require('assert');
const S = require('./app/schedule.js');

const adds = (c, t, p) => S.buildSchedule(S.waterFor(c), t, p).steps.map((s) => s.add);
const times = (p) => S.buildSchedule(750, 2, p).steps.map((s) => S.fmtTime(s.at));

// Worked examples at 50 g coffee: taste moves the 40% split, pours split the 60%.
assert.deepStrictEqual(adds(50, 0, 5).slice(0, 2), [100, 200]);
assert.deepStrictEqual(adds(50, 1, 5).slice(0, 2), [125, 175]);
assert.deepStrictEqual(adds(50, 2, 5).slice(0, 2), [150, 150]);
assert.deepStrictEqual(adds(50, 3, 5).slice(0, 2), [175, 125]);
assert.deepStrictEqual(adds(50, 4, 5).slice(0, 2), [200, 100]);
assert.deepStrictEqual(adds(50, 2, 3), [150, 150, 450]);
assert.deepStrictEqual(adds(50, 2, 5), [150, 150, 150, 150, 150]);
assert.deepStrictEqual(adds(50, 2, 7), [150, 150, 90, 90, 90, 90, 90]);

// Pour times for each pour count.
assert.deepStrictEqual(times(3), ['0:00', '0:45', '1:30']);
assert.deepStrictEqual(times(4), ['0:00', '0:45', '1:30', '2:30']);
assert.deepStrictEqual(times(5), ['0:00', '0:45', '1:30', '2:10', '2:50']);
assert.deepStrictEqual(times(6), ['0:00', '0:45', '1:30', '2:00', '2:30', '3:00']);
assert.deepStrictEqual(times(7), ['0:00', '0:45', '1:30', '1:54', '2:18', '2:42', '3:06']);

// Invariants over a sweep of doses.
let combos = 0;
for (let c10 = 50; c10 <= 1200; c10 += 1) {
  const coffee = c10 / 10;
  for (let t = 0; t < S.TASTES.length; t++) {
    for (let p = S.MIN_POURS; p <= S.MAX_POURS; p++) {
      const { total, steps, end } = S.buildSchedule(S.waterFor(coffee), t, p);
      assert.strictEqual(total, Math.round((c10 * 15) / 10));
      assert.strictEqual(steps.length, p);
      assert.strictEqual(steps[p - 1].target, total, 'last target is total');
      assert.strictEqual(steps[1].target, Math.round(total * 0.4), 'first two pours are 40%');
      assert.strictEqual(steps.reduce((a, s) => a + s.add, 0), total);
      const late = steps.slice(2).map((s) => s.add);
      assert.ok(Math.max(...late) - Math.min(...late) <= 1, '60% phase is even within 1 g');
      for (let i = 0; i < p; i++) {
        assert.ok(steps[i].add > 0);
        assert.ok(Number.isInteger(steps[i].at), 'whole-second pour times');
        if (i) assert.ok(steps[i].at > steps[i - 1].at);
      }
      assert.ok(steps[p - 1].at < end);
      combos++;
    }
  }
}

assert.strictEqual(S.coffeeFor(750), 50);
assert.strictEqual(S.coffeeFor(1000), 66.7);
assert.strictEqual(S.buildSchedule(1000, 2, 5).steps[4].target, 1000); // typed water is kept as the total

// Ratios: every tenth from 1:10 to 1:22.
assert.strictEqual(S.waterFor(20), 300);
assert.strictEqual(S.waterFor(20, 167), 334);
assert.strictEqual(S.waterFor(18.5, 160), 296);
assert.strictEqual(S.coffeeFor(300, 167), 18);
assert.strictEqual(S.fmtRatio(150), '15');
assert.strictEqual(S.fmtRatio(167), '16.7');
let ratios = 0;
for (let r = S.RATIO_MIN; r <= S.RATIO_MAX; r++) {
  for (let c10 = 50; c10 <= 1200; c10 += 7) {
    const coffee = c10 / 10;
    const water = S.waterFor(coffee, r);
    assert.ok(Number.isInteger(water));
    assert.ok(Math.abs(water - (c10 * r) / 100) <= 0.5, `water for ${coffee} g at ${r}`);
    const back = S.coffeeFor(water, r);
    assert.ok(Math.abs(back - coffee) <= 0.05 + 0.5 / (r / 10) + 1e-9, `coffee back for ${water} g at ${r}`);
    for (let p = S.MIN_POURS; p <= S.MAX_POURS; p++) {
      const { steps } = S.buildSchedule(water, 2, p);
      assert.strictEqual(steps[p - 1].target, water);
      assert.ok(steps.every((s) => s.add > 0));
    }
    ratios++;
  }
}
assert.strictEqual(S.fmtRatio(S.RATIO_MIN), '10');
assert.strictEqual(S.fmtRatio(S.RATIO_MAX), '22');

console.log('ok,', combos, 'combinations,', ratios, 'ratio checks');
