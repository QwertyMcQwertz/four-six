// 4:6 method schedule. Pure functions, shared by the page and test.js.
(function (root) {
  // Ratio is grams of water per gram of coffee, kept in whole tenths (150 = 1:15.0) so it never drifts.
  const RATIO_DEFAULT = 150;
  const RATIO_MIN = 100;
  const RATIO_MAX = 220;
  const END = 210; // dripper off at 3:30, always

  // First pour's share of the first 40%, in 30ths of total water.
  // 4/30 = 1/3 of 40% (sweet) ... 8/30 = 2/3 of 40% (acidic).
  const TASTES = [
    { key: 'sweet', label: 'Sweet', k: 4 },
    { key: 'sweet-normal', label: 'Sweet / Normal', k: 5 },
    { key: 'normal', label: 'Normal', k: 6 },
    { key: 'normal-acidic', label: 'Normal / Acidic', k: 7 },
    { key: 'acidic', label: 'Acidic', k: 8 },
  ];

  const MIN_POURS = 3;
  const MAX_POURS = 7;

  // Coffee is read in tenths of a gram, so the product is exact integer math.
  function waterFor(coffee, ratio = RATIO_DEFAULT) {
    return Math.round((Math.round(coffee * 10) * ratio) / 100);
  }

  function coffeeFor(water, ratio = RATIO_DEFAULT) {
    return Math.round((water * 100) / ratio) / 10;
  }

  // 150 -> "15", 167 -> "16.7"
  function fmtRatio(ratio) {
    return ratio % 10 ? (ratio / 10).toFixed(1) : String(ratio / 10);
  }

  // `total` is whole grams of water. Returns { total, end, steps: [{ n, at, add, target }] }.
  // Targets are rounded on the running total, so the last one is always `total`.
  function buildSchedule(total, tasteIdx, pours) {
    const n = pours - 2; // pours in the 60% phase
    const targets = [
      Math.round((total * TASTES[tasteIdx].k) / 30),
      Math.round((total * 2) / 5),
    ];
    const times = [0, 45];
    for (let j = 1; j <= n; j++) {
      targets.push(Math.round((total * (2 * n + 3 * j)) / (5 * n)));
      times.push(90 + (120 * (j - 1)) / n);
    }
    const steps = targets.map((target, i) => ({
      n: i + 1,
      at: times[i],
      add: target - (i ? targets[i - 1] : 0),
      target,
    }));
    return { total, end: END, steps };
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  const api = { RATIO_DEFAULT, RATIO_MIN, RATIO_MAX, END, TASTES, MIN_POURS, MAX_POURS, waterFor, coffeeFor, fmtRatio, buildSchedule, fmtTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Schedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
