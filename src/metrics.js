import { CONFIG, CYCLE_INFO } from "./config.js?v=20260213n";

// 从字符串创建UTC日期
function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getCycleInfo(year) {
  const normalized = ((year - CONFIG.cycleAnchorYear) % 4 + 4) % 4;
  return CYCLE_INFO[normalized];
}

export function getYearMonthFromKey(monthKey) {
  const [y, m] = monthKey.split("-");
  return { year: Number(y), monthIndex: Number(m) - 1 };
}

export function findYearlyExtremesFromMonthly(yearData) {
  if (!yearData || !yearData.months) return null;

  let highest = null;
  let lowest = null;

  for (let i = 0; i < 12; i++) {
    const month = yearData.months[i];
    if (!month) continue;

    // 获取月份的最高价：优先 high，其次 max(open, close)
    let monthHigh;
    if (month.high !== null && Number.isFinite(month.high)) {
      monthHigh = month.high;
    } else {
      // 如果没有 high，取 open 和 close 中的最大值
      monthHigh = Math.max(
        month.open !== null && Number.isFinite(month.open) ? month.open : -Infinity,
        month.close !== null && Number.isFinite(month.close) ? month.close : -Infinity
      );
    }

    // 获取月份的最低价：优先 low，其次 min(open, close)
    let monthLow;
    if (month.low !== null && Number.isFinite(month.low)) {
      monthLow = month.low;
    } else {
      // 如果没有 low，取 open 和 close 中的最小值
      monthLow = Math.min(
        month.open !== null && Number.isFinite(month.open) ? month.open : Infinity,
        month.close !== null && Number.isFinite(month.close) ? month.close : Infinity
      );
    }

    // 只有当有有效值时才比较
    if (Number.isFinite(monthHigh)) {
      if (!highest || monthHigh > highest.close) {
        const dateStr = month.high_date || null;
        const parsedDate = dateStr ? parseUTCDate(dateStr) : null;
        highest = {
          monthIndex: i,
          close: monthHigh,
          monthKey: month.monthKey,
          date: parsedDate
        };
      }
    }
    if (Number.isFinite(monthLow)) {
      if (!lowest || monthLow < lowest.close) {
        const dateStr = month.low_date || null;
        const parsedDate = dateStr ? parseUTCDate(dateStr) : null;
        lowest = {
          monthIndex: i,
          close: monthLow,
          monthKey: month.monthKey,
          date: parsedDate
        };
      }
    }
  }

  if (!highest || !lowest) return null;
  return { highest, lowest };
}

// 从日级别数据计算每月的最高价，然后找出年内最高/最低月份
export function findYearlyExtremesFromDaily(dailyData) {
  if (!dailyData || dailyData.length === 0) return null;

  // 按月分组，找出每月的最高价
  const monthlyHighs = new Map(); // monthKey -> { high, date }
  const monthlyLows = new Map();  // monthKey -> { low, date }

  for (const day of dailyData) {
    const date = day.date;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;

    // 月度最高价
    if (!monthlyHighs.has(monthKey) || day.high > monthlyHighs.get(monthKey).high) {
      monthlyHighs.set(monthKey, { high: day.high, date: day.date, monthKey });
    }

    // 月度最低价
    if (!monthlyLows.has(monthKey) || day.low < monthlyLows.get(monthKey).low) {
      monthlyLows.set(monthKey, { low: day.low, date: day.date, monthKey });
    }
  }

  // 找出年内最高/最低的月份
  const highs = [...monthlyHighs.values()];
  const lows = [...monthlyLows.values()];

  if (highs.length === 0 || lows.length === 0) return null;

  // 按最高价排序，找出最高的月份
  const highestMonth = highs.reduce((max, curr) => curr.high > max.high ? curr : max);
  // 按最低价排序，找出最低的月份
  const lowestMonth = lows.reduce((min, curr) => curr.low < min.low ? curr : min);

  // 转换为月份索引
  const getMonthIndex = (monthKey) => {
    const [year, month] = monthKey.split("-");
    return { monthIndex: Number(month) - 1, monthKey };
  };

  return {
    highest: {
      monthIndex: getMonthIndex(highestMonth.monthKey).monthIndex,
      monthKey: highestMonth.monthKey,
      close: highestMonth.high,
      date: highestMonth.date
    },
    lowest: {
      monthIndex: getMonthIndex(lowestMonth.monthKey).monthIndex,
      monthKey: lowestMonth.monthKey,
      close: lowestMonth.low,
      date: lowestMonth.date
    }
  };
}

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toMonthChangePercent(open, close) {
  const o = toNumberOrNull(open);
  const c = toNumberOrNull(close);
  if (o === null || c === null || o === 0) return null;
  return ((c - o) / o) * 100;
}

export function buildYearMatrix(rows, extremesData = null) {
  const byYear = new Map();
  for (const row of rows) {
    const { year, monthIndex } = getYearMonthFromKey(row.monthKey);
    if (year < CONFIG.startYear || year > CONFIG.endYear) continue;

    if (!byYear.has(year)) {
      byYear.set(year, {
        year,
        months: new Array(12).fill(null),
      });
    }

    const item = byYear.get(year);
    const pct = toMonthChangePercent(row.open, row.close);
    item.months[monthIndex] = {
      monthKey: row.monthKey,
      open: row.open,
      close: row.close,
      high: row.high,
      low: row.low,
      high_date: row.high_date,
      low_date: row.low_date,
      pct,
      source: row.source,
      isClosed: row.isClosed,
    };
  }

  for (let year = CONFIG.startYear; year <= CONFIG.endYear; year += 1) {
    if (!byYear.has(year)) {
      byYear.set(year, {
        year,
        months: new Array(12).fill(null),
      });
    }
  }

  const years = [...byYear.values()].sort((a, b) => b.year - a.year);
  for (const y of years) {
    const first = y.months.find((m) => m && Number.isFinite(m.open));
    const last = [...y.months].reverse().find((m) => m && Number.isFinite(m.close));
    y.totalPct = first && last && first.open !== 0 ? ((last.close - first.open) / first.open) * 100 : null;
    y.cycle = getCycleInfo(y.year);

    // 使用日级别数据计算极值（如果有）
    if (extremesData && extremesData.has(y.year)) {
      const dailyData = extremesData.get(y.year);
      const dailyExtremes = findYearlyExtremesFromDaily(dailyData);
      if (dailyExtremes) {
        y.extremes = dailyExtremes;
      }
    } else {
      // 回退：使用月度数据计算极值
      const monthlyExtremes = findYearlyExtremesFromMonthly(y);
      if (monthlyExtremes) {
        y.extremes = monthlyExtremes;
      }
    }
  }

  return years;
}

export function findYearExtremes(dailyData) {
  if (!dailyData || dailyData.length === 0) return null;

  let highest = dailyData[0];
  let lowest = dailyData[0];

  for (const day of dailyData) {
    if (day.high > highest.high) highest = day;
    if (day.low < lowest.low) lowest = day;
  }

  return {
    highest: { date: highest.date, price: highest.high },
    lowest: { date: lowest.date, price: lowest.low },
  };
}

export function computeBottomStats(yearRows) {
  const monthly = Array.from({ length: 12 }, () => []);
  for (const row of yearRows) {
    for (let i = 0; i < 12; i += 1) {
      const pct = row.months[i]?.pct;
      if (Number.isFinite(pct)) monthly[i].push(pct);
    }
  }

  const average = monthly.map((values) => {
    if (values.length === 0) return null;
    return values.reduce((acc, n) => acc + n, 0) / values.length;
  });

  const median = monthly.map((values) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  });

  return { average, median };
}

