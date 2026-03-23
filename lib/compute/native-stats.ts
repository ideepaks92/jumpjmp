export interface DescriptiveResult {
  count: number;
  missing: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  skewness: number;
  kurtosis: number;
}

function sorted(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

function quantile(sortedArr: number[], q: number): number {
  if (sortedArr.length === 0) return NaN;
  const pos = (sortedArr.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] + (pos - lo) * (sortedArr[hi] - sortedArr[lo]);
}

export function descriptiveStats(values: unknown[]): DescriptiveResult {
  const total = values.length;
  const nums = values
    .map((v) => Number(v))
    .filter((n) => !isNaN(n) && isFinite(n));
  const missing = total - nums.length;
  const count = nums.length;

  if (count === 0) {
    return {
      count: 0,
      missing: total,
      mean: NaN,
      std: NaN,
      min: NaN,
      max: NaN,
      median: NaN,
      q1: NaN,
      q3: NaN,
      skewness: NaN,
      kurtosis: NaN,
    };
  }

  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / count;
  const std = Math.sqrt(variance);

  const s = sorted(nums);
  const min = s[0];
  const max = s[s.length - 1];
  const median = quantile(s, 0.5);
  const q1 = quantile(s, 0.25);
  const q3 = quantile(s, 0.75);

  let skewness = 0;
  let kurtosis = 0;
  if (std > 0) {
    skewness =
      nums.reduce((a, b) => a + ((b - mean) / std) ** 3, 0) / count;
    kurtosis =
      nums.reduce((a, b) => a + ((b - mean) / std) ** 4, 0) / count - 3;
  }

  return { count, missing, mean, std, min, max, median, q1, q3, skewness, kurtosis };
}

export interface ControlChartResult {
  values: number[];
  center: number;
  ucl: number;
  lcl: number;
  outOfControl: number[];
  mr?: number[];
  mrCenter?: number;
  mrUcl?: number;
}

export function individualsChart(values: unknown[]): ControlChartResult {
  const nums = values.map((v) => Number(v)).filter((n) => !isNaN(n) && isFinite(n));
  if (nums.length < 2) {
    return { values: nums, center: NaN, ucl: NaN, lcl: NaN, outOfControl: [] };
  }

  const mr: number[] = [];
  for (let i = 1; i < nums.length; i++) {
    mr.push(Math.abs(nums[i] - nums[i - 1]));
  }

  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const mrMean = mr.reduce((a, b) => a + b, 0) / mr.length;
  const d2 = 1.128; // for n=2
  const sigma = mrMean / d2;

  const ucl = mean + 3 * sigma;
  const lcl = mean - 3 * sigma;
  const mrUcl = 3.267 * mrMean;

  const outOfControl: number[] = [];
  nums.forEach((v, i) => {
    if (v > ucl || v < lcl) outOfControl.push(i);
  });

  return { values: nums, center: mean, ucl, lcl, outOfControl, mr, mrCenter: mrMean, mrUcl };
}

export function xbarRChart(
  values: unknown[],
  subgroupSize: number
): { xbar: ControlChartResult; r: ControlChartResult } {
  const nums = values.map((v) => Number(v)).filter((n) => !isNaN(n) && isFinite(n));
  const subgroups: number[][] = [];
  for (let i = 0; i < nums.length; i += subgroupSize) {
    const sg = nums.slice(i, i + subgroupSize);
    if (sg.length === subgroupSize) subgroups.push(sg);
  }

  const xbars = subgroups.map((sg) => sg.reduce((a, b) => a + b, 0) / sg.length);
  const ranges = subgroups.map((sg) => Math.max(...sg) - Math.min(...sg));

  const xbarMean = xbars.reduce((a, b) => a + b, 0) / xbars.length;
  const rMean = ranges.reduce((a, b) => a + b, 0) / ranges.length;

  // Constants for subgroup sizes 2-10
  const A2: Record<number, number> = { 2: 1.88, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308 };
  const D3: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223 };
  const D4: Record<number, number> = { 2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777 };

  const a2 = A2[subgroupSize] ?? 0.577;
  const d3 = D3[subgroupSize] ?? 0;
  const d4 = D4[subgroupSize] ?? 2.114;

  const xbarUcl = xbarMean + a2 * rMean;
  const xbarLcl = xbarMean - a2 * rMean;
  const rUcl = d4 * rMean;
  const rLcl = d3 * rMean;

  const xbarOOC: number[] = [];
  xbars.forEach((v, i) => { if (v > xbarUcl || v < xbarLcl) xbarOOC.push(i); });
  const rOOC: number[] = [];
  ranges.forEach((v, i) => { if (v > rUcl || v < rLcl) rOOC.push(i); });

  return {
    xbar: { values: xbars, center: xbarMean, ucl: xbarUcl, lcl: xbarLcl, outOfControl: xbarOOC },
    r: { values: ranges, center: rMean, ucl: rUcl, lcl: rLcl, outOfControl: rOOC },
  };
}

export interface ProcessCapabilityResult {
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  mean: number;
  std: number;
  lsl: number;
  usl: number;
  withinStd: number;
}

export function processCapability(
  values: unknown[],
  lsl: number,
  usl: number
): ProcessCapabilityResult {
  const nums = values.map((v) => Number(v)).filter((n) => !isNaN(n) && isFinite(n));
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const overallStd = Math.sqrt(
    nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (nums.length - 1)
  );

  // Within-subgroup std estimated from moving range
  const mr: number[] = [];
  for (let i = 1; i < nums.length; i++) {
    mr.push(Math.abs(nums[i] - nums[i - 1]));
  }
  const mrMean = mr.reduce((a, b) => a + b, 0) / mr.length;
  const withinStd = mrMean / 1.128;

  const cp = (usl - lsl) / (6 * withinStd);
  const cpk = Math.min((usl - mean) / (3 * withinStd), (mean - lsl) / (3 * withinStd));
  const pp = (usl - lsl) / (6 * overallStd);
  const ppk = Math.min((usl - mean) / (3 * overallStd), (mean - lsl) / (3 * overallStd));

  return { cp, cpk, pp, ppk, mean, std: overallStd, lsl, usl, withinStd };
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  residuals: number[];
  predicted: number[];
  pValue: number;
  standardError: number;
}

export function linearRegression(
  xValues: unknown[],
  yValues: unknown[]
): RegressionResult {
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(xValues.length, yValues.length); i++) {
    const x = Number(xValues[i]);
    const y = Number(yValues[i]);
    if (!isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
      pairs.push([x, y]);
    }
  }

  const n = pairs.length;
  if (n < 3) {
    return { slope: NaN, intercept: NaN, rSquared: NaN, residuals: [], predicted: [], pValue: NaN, standardError: NaN };
  }

  const sumX = pairs.reduce((a, [x]) => a + x, 0);
  const sumY = pairs.reduce((a, [, y]) => a + y, 0);
  const sumXY = pairs.reduce((a, [x, y]) => a + x * y, 0);
  const sumX2 = pairs.reduce((a, [x]) => a + x * x, 0);
  const sumY2 = pairs.reduce((a, [, y]) => a + y * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predicted = pairs.map(([x]) => slope * x + intercept);
  const residuals = pairs.map(([, y], i) => y - predicted[i]);
  const yMean = sumY / n;

  const ssReg = predicted.reduce((a, p) => a + (p - yMean) ** 2, 0);
  const ssTot = pairs.reduce((a, [, y]) => a + (y - yMean) ** 2, 0);
  const rSquared = ssTot > 0 ? ssReg / ssTot : 0;

  const sse = residuals.reduce((a, r) => a + r * r, 0);
  const standardError = Math.sqrt(sse / (n - 2));

  // Approximate p-value using t-distribution approximation
  const seSlope = standardError / Math.sqrt(sumX2 - (sumX * sumX) / n);
  const tStat = Math.abs(slope / seSlope);
  const df = n - 2;
  const pValue = Math.exp(-0.717 * tStat - 0.416 * tStat * tStat / df);

  return { slope, intercept, rSquared, residuals, predicted, pValue, standardError };
}

export interface HypothesisTestResult {
  testType: string;
  statistic: number;
  pValue: number;
  conclusion: string;
  groups?: { name: string; mean: number; std: number; n: number }[];
}

export function tTest(
  group1: unknown[],
  group2: unknown[]
): HypothesisTestResult {
  const g1 = group1.map(Number).filter((n) => !isNaN(n) && isFinite(n));
  const g2 = group2.map(Number).filter((n) => !isNaN(n) && isFinite(n));

  const n1 = g1.length;
  const n2 = g2.length;
  const mean1 = g1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = g2.reduce((a, b) => a + b, 0) / n2;
  const var1 = g1.reduce((a, b) => a + (b - mean1) ** 2, 0) / (n1 - 1);
  const var2 = g2.reduce((a, b) => a + (b - mean2) ** 2, 0) / (n2 - 1);

  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const t = (mean1 - mean2) / se;
  const df =
    (var1 / n1 + var2 / n2) ** 2 /
    ((var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1));

  const pValue = Math.exp(-0.717 * Math.abs(t) - 0.416 * t * t / df) * 2;

  return {
    testType: "Two-Sample t-Test (Welch's)",
    statistic: t,
    pValue: Math.min(pValue, 1),
    conclusion:
      pValue < 0.05
        ? "Reject H0: Means are significantly different (p < 0.05)"
        : "Fail to reject H0: No significant difference detected",
    groups: [
      { name: "Group 1", mean: mean1, std: Math.sqrt(var1), n: n1 },
      { name: "Group 2", mean: mean2, std: Math.sqrt(var2), n: n2 },
    ],
  };
}

export function oneWayAnova(
  groups: { name: string; values: number[] }[]
): HypothesisTestResult {
  const allValues = groups.flatMap((g) => g.values);
  const grandMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const k = groups.length;
  const N = allValues.length;

  const ssBetween = groups.reduce(
    (a, g) => a + g.values.length * (g.values.reduce((s, v) => s + v, 0) / g.values.length - grandMean) ** 2,
    0
  );
  const ssWithin = groups.reduce(
    (a, g) => {
      const gMean = g.values.reduce((s, v) => s + v, 0) / g.values.length;
      return a + g.values.reduce((s, v) => s + (v - gMean) ** 2, 0);
    },
    0
  );

  const dfBetween = k - 1;
  const dfWithin = N - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const f = msBetween / msWithin;

  const pValue = Math.exp(-0.4 * f * dfBetween / dfWithin);

  const groupStats = groups.map((g) => {
    const mean = g.values.reduce((a, b) => a + b, 0) / g.values.length;
    const std = Math.sqrt(g.values.reduce((a, b) => a + (b - mean) ** 2, 0) / (g.values.length - 1));
    return { name: g.name, mean, std, n: g.values.length };
  });

  return {
    testType: "One-Way ANOVA",
    statistic: f,
    pValue: Math.min(pValue, 1),
    conclusion:
      pValue < 0.05
        ? "Reject H0: At least one group mean is significantly different"
        : "Fail to reject H0: No significant difference detected between groups",
    groups: groupStats,
  };
}
