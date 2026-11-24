import type { StarHistory } from "./stars.js";

export type StarChartMode = "date" | "timeline";

export interface StarChartColors {
  text: string;
  muted: string;
  grid: string;
  axis: string;
  surface: string;
}

export interface StarChartOptions {
  mode?: StarChartMode;
  log?: boolean;
  theme?: "light" | "dark";
  colors?: StarChartColors;
  palette?: readonly string[];
  width?: number;
  plotHeight?: number;
  legend?: boolean;
}

export interface StarChartSeries {
  repo: string;
  color: string;
  stars: number;
  xs: number[];
  ys: number[];
}

export interface StarChart {
  svg: string;
  width: number;
  height: number;
  plot: { left: number; top: number; right: number; bottom: number };
  mode: StarChartMode;
  series: StarChartSeries[];
  x: (value: number) => number;
  y: (stars: number) => number;
  invertX: (px: number) => number;
}

export const STAR_CHART_PALETTES = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c", "#9085e9", "#e66767"],
} as const;

export const MAX_STAR_CHART_SERIES = STAR_CHART_PALETTES.light.length;

const THEMES: Record<"light" | "dark", StarChartColors> = {
  light: { text: "#0a0a0a", muted: "#737373", grid: "#ececee", axis: "#d4d4d8", surface: "#ffffff" },
  dark: { text: "#fafafa", muted: "#8a8a8a", grid: "#222226", axis: "#3a3a40", surface: "#0d1117" },
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";

const LEFT = 52;
const RIGHT = 26;
const TOP = 14;
const LEGEND_ROW = 24;
const LEGEND_GAP = 14;
const AXIS_HEIGHT = 34;
const X_TICK_SPACING = 64;
const MAX_PATH_POINTS = 600;
const DAY = 86_400_000;
const YEAR_DAYS = 365.25;
const MONTH_DAYS = YEAR_DAYS / 12;

interface Tick {
  value: number;
  label: string;
}

function escapeXml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}

function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}

function compact(n: number): string {
  if (n >= 1_000_000) {
    return `${Math.round(n / 100_000) / 10}M`;
  }
  if (n >= 1000) {
    return `${Math.round(n / 100) / 10}k`;
  }
  return String(n);
}

function axisLabel(value: number, max: number): string {
  return max < 10_000 ? value.toLocaleString("en-US") : compact(value);
}

function stepWithin(span: number, steps: number[], maxTicks: number): number {
  return steps.find(step => span / step <= maxTicks) ?? steps.at(-1)!;
}

function linearTicks(max: number): Tick[] {
  const rough = Math.max(max, 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].find(m => m * magnitude >= rough)! * magnitude);
  const top = Math.ceil(Math.max(max, 1) / step) * step;
  const ticks: Tick[] = [];
  for (let value = 0; value <= top; value += step) {
    ticks.push({ value, label: axisLabel(value, top) });
  }
  return ticks;
}

function logTicks(max: number): Tick[] {
  const top = Math.max(1, Math.ceil(Math.log10(Math.max(max, 1))));
  return Array.from({ length: top + 1 }, (_, power) => ({ value: 10 ** power, label: axisLabel(10 ** power, 10 ** top) }));
}

function dateTicks(min: number, max: number, maxTicks: number): Tick[] {
  const spanDays = (max - min) / DAY;
  const ticks: Tick[] = [];

  if (spanDays > 2 * YEAR_DAYS) {
    const step = Math.ceil(spanDays / YEAR_DAYS / maxTicks);
    for (let year = new Date(min).getUTCFullYear(); ; year++) {
      const value = Date.UTC(year, 0, 1);
      if (value > max) {
        break;
      }
      if (value >= min && year % step === 0) {
        ticks.push({ value, label: String(year) });
      }
    }
    return ticks;
  }

  if (spanDays > 60) {
    const step = stepWithin(spanDays / MONTH_DAYS, [1, 2, 3, 6, 12], maxTicks);
    const start = new Date(min);
    for (let month = start.getUTCFullYear() * 12 + start.getUTCMonth(); ; month++) {
      const value = Date.UTC(Math.floor(month / 12), month % 12, 1);
      if (value > max) {
        break;
      }
      if (value >= min && month % step === 0) {
        ticks.push({ value, label: new Date(value).toISOString().slice(0, 7) });
      }
    }
    return ticks;
  }

  const step = stepWithin(spanDays, [1, 2, 7, 14, 28], maxTicks);
  for (let value = max; value >= min; value -= step * DAY) {
    ticks.unshift({ value, label: new Date(value).toISOString().slice(5, 10) });
  }
  return ticks;
}

function timelineTicks(maxDays: number, maxTicks: number): Tick[] {
  const [unit, suffix, steps] = maxDays > 2 * YEAR_DAYS
    ? [YEAR_DAYS, "y", [Math.ceil(maxDays / YEAR_DAYS / maxTicks)]] as const
    : maxDays > 60
      ? [MONTH_DAYS, "mo", [1, 2, 3, 6, 12]] as const
      : [1, "d", [1, 2, 7, 14, 28]] as const;

  const step = stepWithin(maxDays / unit, [...steps], maxTicks);
  const ticks: Tick[] = [{ value: 0, label: "0" }];
  for (let n = step; n * unit <= maxDays; n += step) {
    ticks.push({ value: n * unit, label: `${n}${suffix}` });
  }
  return ticks;
}

function linePath(series: StarChartSeries, x: (value: number) => number, y: (stars: number) => number): string {
  const { xs, ys } = series;
  const last = xs.length - 1;
  const stride = Math.ceil(xs.length / MAX_PATH_POINTS);
  const parts: string[] = [];
  for (let i = 0; i <= last; i++) {
    if (i % stride === 0 || i === last) {
      parts.push(`${parts.length ? "L" : "M"}${round(x(xs[i]!))} ${round(y(ys[i]!))}`);
    }
  }
  return parts.join("");
}

export function renderStarChart(histories: StarHistory[], options: StarChartOptions = {}): StarChart {
  const mode = options.mode ?? "date";
  const log = options.log ?? false;
  const theme = options.theme ?? "light";
  const colors = options.colors ?? THEMES[theme];
  const palette = options.palette ?? STAR_CHART_PALETTES[theme];
  const width = options.width ?? 800;
  const plotHeight = options.plotHeight ?? 300;
  const legend = options.legend ?? true;

  if (histories.length > palette.length) {
    throw new RangeError(`A star chart holds at most ${palette.length} repositories, got ${histories.length}`);
  }

  const series: StarChartSeries[] = histories.map((history, i) => {
    const times = history.points.map(p => Date.parse(p.date));
    return {
      repo: history.repo,
      color: palette[i]!,
      stars: history.stars,
      xs: mode === "date" ? times : times.map(t => (t - times[0]!) / DAY),
      ys: history.points.map(p => p.stars),
    };
  });

  const starts = series.flatMap(s => s.xs.slice(0, 1));
  const ends = series.flatMap(s => s.xs.slice(-1));
  const today = Math.floor(Date.now() / DAY) * DAY;
  let xMin = mode === "date" ? Math.min(...starts, today) : 0;
  let xMax = mode === "date" ? Math.max(...ends, today) : Math.max(...ends, 0);
  if (xMin === xMax) {
    xMin -= mode === "date" ? DAY : 0;
    xMax += mode === "date" ? 0 : 1;
  }

  const top = TOP + (legend ? Math.max(series.length, 1) * LEGEND_ROW + LEGEND_GAP : 0);
  const plot = { left: LEFT, top, right: width - RIGHT, bottom: top + plotHeight };
  const height = plot.bottom + AXIS_HEIGHT;
  const plotWidth = plot.right - plot.left;

  const maxStars = Math.max(...series.map(s => s.stars), 1);
  const yTicks = log ? logTicks(maxStars) : linearTicks(maxStars);
  const yMax = yTicks.at(-1)!.value;
  const maxXTicks = Math.max(2, Math.floor(plotWidth / X_TICK_SPACING));
  const xTicks = mode === "date" ? dateTicks(xMin, xMax, maxXTicks) : timelineTicks(xMax, maxXTicks);

  const x = (value: number): number => plot.left + (value - xMin) / (xMax - xMin) * plotWidth;
  const invertX = (px: number): number => xMin + (px - plot.left) / plotWidth * (xMax - xMin);
  const y = (stars: number): number => {
    const ratio = log ? Math.log10(Math.max(stars, 1)) / Math.log10(yMax) : stars / yMax;
    return plot.bottom - ratio * plotHeight;
  };

  const out: string[] = [];
  const label = `Star history of ${histories.map(h => h.repo).join(", ")}`;
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}" font-size="12" role="img" aria-label="${escapeXml(label)}">`,
    `<title>${escapeXml(label)}</title>`,
  );

  for (const [i, tick] of yTicks.entries()) {
    const py = round(y(tick.value));
    out.push(
      `<line x1="${plot.left}" x2="${plot.right}" y1="${py}" y2="${py}" stroke="${i === 0 ? colors.axis : colors.grid}" stroke-width="1"/>`,
      `<text x="${plot.left - 12}" y="${py}" dy="0.32em" text-anchor="end" fill="${colors.muted}">${tick.label}</text>`,
    );
  }

  for (const tick of xTicks) {
    out.push(`<text x="${round(x(tick.value))}" y="${plot.bottom + 22}" text-anchor="middle" fill="${colors.muted}">${tick.label}</text>`);
  }

  if (series.length === 1 && series[0]!.xs.length > 1) {
    const s = series[0]!;
    const area = `${linePath(s, x, y)}L${round(x(s.xs.at(-1)!))} ${plot.bottom}L${round(x(s.xs[0]!))} ${plot.bottom}Z`;
    out.push(`<path d="${area}" fill="${s.color}" fill-opacity="0.1"/>`);
  }

  for (const s of series) {
    if (s.xs.length > 1) {
      out.push(`<path d="${linePath(s, x, y)}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
  }

  for (const s of series) {
    if (s.xs.length) {
      out.push(`<circle cx="${round(x(s.xs.at(-1)!))}" cy="${round(y(s.ys.at(-1)!))}" r="4" fill="${s.color}" stroke="${colors.surface}" stroke-width="2"/>`);
    }
  }

  if (legend) {
    const ranked = [...series].sort((a, b) => b.stars - a.stars);
    for (const [i, s] of ranked.entries()) {
      const cy = TOP + 8 + i * LEGEND_ROW;
      out.push(
        `<line x1="2" x2="16" y1="${cy}" y2="${cy}" stroke="${s.color}" stroke-width="3" stroke-linecap="round"/>`,
        `<text x="26" y="${cy}" dy="0.34em" font-size="14" fill="${colors.text}"><tspan font-weight="600">${escapeXml(s.repo)}</tspan><tspan dx="10" fill="${colors.muted}">${s.stars.toLocaleString("en-US")}</tspan></text>`,
      );
    }
    out.push(`<text x="${plot.right}" y="${TOP + 8}" dy="0.34em" text-anchor="end" font-size="11.5" fill="${colors.muted}">ghrank.com</text>`);
  }

  out.push("</svg>");

  return { svg: out.join(""), width, height, plot, mode, series, x, y, invertX };
}
