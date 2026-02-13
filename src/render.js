import { CONFIG } from "./config.js?v=20260213y";
import { t } from "./i18n.js?v=20260213p";

// 减半日期列表
const HALVING_DATES = [
  new Date(Date.UTC(2012, 10, 28)),  // 2012-11-28
  new Date(Date.UTC(2016, 6, 9)),    // 2016-07-09
  new Date(Date.UTC(2020, 4, 11)),  // 2020-05-11
  new Date(Date.UTC(2024, 3, 19)),  // 2024-04-19
  new Date(Date.UTC(2028, 3, 1)),   // 2028-04-01 (预计)
];

// 获取某年份之前最近的一次减半日期
function getPreviousHalvingDate(year) {
  for (let i = HALVING_DATES.length - 1; i >= 0; i--) {
    const halvingYear = HALVING_DATES[i].getUTCFullYear();
    if (halvingYear < year) {
      return HALVING_DATES[i];
    }
  }
  return HALVING_DATES[0];
}

// 获取某年份之后的下一次减半日期
function getNextHalvingDate(year) {
  for (const date of HALVING_DATES) {
    const halvingYear = date.getUTCFullYear();
    if (halvingYear > year) {
      return date;
    }
  }
  return HALVING_DATES[HALVING_DATES.length - 1];
}

// 计算两个日期之间的天数
function daysBetween(date1, date2) {
  if (!date1 || !date2) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = Math.abs(date2 - date1);
  return Math.floor(diffMs / msPerDay);
}

function formatPct(v) {
  if (!Number.isFinite(v)) return "";
  return `${Math.round(v)}%`;
}

function formatPrice(v) {
  if (!Number.isFinite(v)) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
}

function pctColorClass(pct) {
  if (!Number.isFinite(pct)) return "month-neutral";
  if (pct >= 40) return "pct-up-4";
  if (pct >= 30) return "pct-up-3";
  if (pct >= 20) return "pct-up-2";
  if (pct >= 10) return "pct-up-1";
  if (pct >= 0) return "pct-up-0";
  if (pct > -10) return "pct-down-0";
  if (pct > -20) return "pct-down-1";
  if (pct > -30) return "pct-down-2";
  return "pct-down-3";
}

function monthClass(cell, nowMonthKey, monthKey) {
  if (CONFIG.halvingMonths.has(monthKey || cell?.monthKey)) return "halving-month";
  if (!cell) return "future-cell";
  return pctColorClass(cell.pct);
}

function formatMonthKey(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${year}年${month}月`;
}

function formatDate(date) {
  if (!date) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 从字符串创建UTC日期
function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getExtremeMarker(yearData, monthIndex, nowMonthKey) {
  if (!yearData.extremes) return null;

  const { highest, lowest } = yearData.extremes;
  if (!highest || !lowest) return null;

  // 只标注已完整结束的年份（当前年份不标注，因为数据不完整）
  const [nowYear] = nowMonthKey.split("-").map(Number);
  if (yearData.year >= nowYear) return null;

  const cycleKey = yearData.cycle?.key;

  // 只在大牛年（bigBull）标注最高点
  if (cycleKey === "bigBull" && monthIndex === highest.monthIndex) {
    return {
      type: "highest",
      monthKey: highest.monthKey,
      price: highest.close,
      date: highest.date
    };
  }

  // 只在回调年（correction）标注最低点
  if (cycleKey === "correction" && monthIndex === lowest.monthIndex) {
    return {
      type: "lowest",
      monthKey: lowest.monthKey,
      price: lowest.close,
      date: lowest.date
    };
  }

  return null;
}

export function renderMainTable({ yearRows, bottomStats, nowMonthKey }) {
  const table = document.getElementById("cycle-table");
  if (!table) return;

  // 先收集所有年份的极值信息和周期类型，用于查找上一次极值点
  const allYearData = new Map();
  for (const y of yearRows) {
    allYearData.set(y.year, { cycle: y.cycle, extremes: y.extremes });
  }

  const colgroup = `
    <colgroup>
      <col class="col-year">
      ${CONFIG.monthLabels.map(() => `<col class="col-month">`).join("")}
      <col class="col-gap">
      <col class="col-total">
      <col class="col-cycle">
    </colgroup>
  `;

  const monthLabels = t("monthLabels");
  const head = `
    <thead>
      <tr>
        <th>${t("yearHeader")}</th>
        ${monthLabels.map((m) => `<th>${m}</th>`).join("")}
        <th class="gap-col"></th>
        <th>${t("total")}</th>
        <th>${t("cycle")}</th>
      </tr>
    </thead>
  `;

  const bodyRows = [];
  const totalYears = yearRows.length;
  for (let i = 0; i < totalYears; i++) {
    const row = yearRows[i];
    const totalClass = pctColorClass(row.totalPct);
    const ratio = totalYears > 1 ? 1 - i / (totalYears - 1) : 0;
    const r = Math.round(255 - 85 * ratio);
    const g = Math.round(255 - 48 * ratio);
    const yearBg = `rgb(${r},${g},255)`;
    bodyRows.push(`
      <tr>
        <td class="year-cell" style="background:${yearBg}">${row.year}</td>
        ${row.months
          .map((m, mi) => {
            const key = `${row.year}-${String(mi + 1).padStart(2, "0")}`;
            const cellClass = monthClass(m, nowMonthKey, key);
            const cellContent = m ? formatPct(m.pct) : "";

            const marker = getExtremeMarker(row, mi, nowMonthKey);
            let markerHtml = '';
            if (marker) {
              // 计算额外信息
              let extraInfo = '';

              if (marker.type === 'highest') {
                // 红色箭头：距上次减半日、距上次最低点
                const prevHalving = getPreviousHalvingDate(row.year);
                const daysSinceHalving = marker.date ? daysBetween(prevHalving, marker.date) : 0;

                // 找到上次最低点（在之前的回调年）
                let prevLowest = null;
                for (let y = row.year - 1; y >= CONFIG.startYear; y--) {
                  const yData = allYearData.get(y);
                  if (yData && yData.cycle && yData.cycle.key === 'correction' && yData.extremes && yData.extremes.lowest && yData.extremes.lowest.date) {
                    prevLowest = yData.extremes.lowest;
                    break;
                  }
                }
                const daysSincePrevLowest = prevLowest && prevLowest.date && marker.date ? daysBetween(prevLowest.date, marker.date) : 0;

                extraInfo = `距上次减半${daysSinceHalving}天|距上次最低点${daysSincePrevLowest}天`;
              } else {
                // 绿色箭头：距下次减半日、距上次最高点
                const nextHalving = getNextHalvingDate(row.year);
                const daysUntilNextHalving = marker.date ? daysBetween(marker.date, nextHalving) : 0;

                // 找到上次最高点（在之前的大牛年）
                let prevHighest = null;
                for (let y = row.year - 1; y >= CONFIG.startYear; y--) {
                  const yData = allYearData.get(y);
                  if (yData && yData.cycle && yData.cycle.key === 'bigBull' && yData.extremes && yData.extremes.highest && yData.extremes.highest.date) {
                    prevHighest = yData.extremes.highest;
                    break;
                  }
                }
                const daysSincePrevHighest = prevHighest && prevHighest.date && marker.date ? daysBetween(prevHighest.date, marker.date) : 0;

                extraInfo = `距下次减半${daysUntilNextHalving}天|距上次最高点${daysSincePrevHighest}天`;
              }

              const dateStr = marker.date ? formatDate(marker.date) : formatMonthKey(marker.monthKey);
              markerHtml = `<span class="extreme-marker ${marker.type}"
                   data-date="${dateStr}"
                   data-price="${formatPrice(marker.price)}"
                   data-type="${marker.type === 'highest' ? '最高' : '最低'}"
                   data-extra="${extraInfo}">
                  ${marker.type === 'highest' ? '▲' : '▼'}
                </span>`;
            }

            return `<td class="${cellClass}">${cellContent}${markerHtml}</td>`;
          })
          .join("")}
        <td class="gap-col"></td>
        <td class="total-cell ${totalClass}">${formatPct(row.totalPct)}</td>
        <td class="cycle-cell ${row.cycle.className}">${t(row.cycle.key)}</td>
      </tr>
    `);
    const phase = ((row.year - CONFIG.startYear) % 4 + 4) % 4;
    if (phase === 0 && i < yearRows.length - 1) {
      bodyRows.push(`<tr class="cycle-gap-row"><td colspan="16"></td></tr>`);
    }
  }

  const bottom = `
    <tr class="divider-row"><td colspan="16"></td></tr>
    <tr class="bottom-stat">
      <td>${t("median")}</td>
      ${bottomStats.median.map((m) => `<td class="${pctColorClass(m)}">${formatPct(m)}</td>`).join("")}
      <td class="lang-cell" rowspan="2" colspan="3"><div class="btn-group"><button id="lang-btn" class="lang-btn"><svg class="lang-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10z"/></svg><span class="lang-text">${t("langBtn")}</span></button><a id="x-btn" class="x-btn" href="https://x.com/intent/follow?screen_name=wolfyxbt" target="_blank" rel="noopener noreferrer"><svg class="x-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a><a id="gh-btn" class="gh-btn" href="https://github.com/wolfyxbt/bitcoin-four-year-cycle-map" target="_blank" rel="noopener noreferrer"><svg class="gh-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a></div></td>
    </tr>
    <tr class="bottom-stat">
      <td>${t("average")}</td>
      ${bottomStats.average.map((m) => `<td class="${pctColorClass(m)}">${formatPct(m)}</td>`).join("")}
    </tr>
  `;

  table.innerHTML = `${colgroup}${head}<tbody>${bodyRows.join("")}${bottom}</tbody>`;

  // 更新预测面板
  updatePredictionPanel(yearRows);
}

const DATA_CLASSES = [
  "halving-month", "future-cell", "month-neutral",
  "pct-up-0", "pct-up-1", "pct-up-2", "pct-up-3", "pct-up-4",
  "pct-down-0", "pct-down-1", "pct-down-2", "pct-down-3",
];

function replaceDataClass(td, newClass) {
  for (const cls of DATA_CLASSES) td.classList.remove(cls);
  if (newClass) td.classList.add(newClass);
}

export function updateTableCells({ yearRows, bottomStats, nowMonthKey }) {
  const table = document.getElementById("cycle-table");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const dataRows = tbody.querySelectorAll(
    "tr:not(.cycle-gap-row):not(.divider-row):not(.bottom-stat)"
  );

  for (let i = 0; i < yearRows.length && i < dataRows.length; i++) {
    const yr = yearRows[i];
    const tr = dataRows[i];
    const cells = tr.children;

    for (let mi = 0; mi < 12; mi++) {
      const td = cells[mi + 1];
      if (!td) continue;
      const cell = yr.months[mi];
      const key = `${yr.year}-${String(mi + 1).padStart(2, "0")}`;
      const newClass = monthClass(cell, nowMonthKey, key);
      const newText = cell ? formatPct(cell.pct) : "";

      // 保留标记元素，只更新文本节点
      let textNode = null;
      for (const child of td.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          textNode = child;
          break;
        }
      }
      if (textNode) {
        if (textNode.textContent !== newText) textNode.textContent = newText;
      } else {
        td.prepend(document.createTextNode(newText));
      }

      replaceDataClass(td, newClass);
    }

    const totalTd = cells[14];
    if (totalTd) {
      const newClass = pctColorClass(yr.totalPct);
      const newText = formatPct(yr.totalPct);
      if (totalTd.textContent !== newText) totalTd.textContent = newText;
      replaceDataClass(totalTd, newClass);
    }
  }

  const bottomStatRows = tbody.querySelectorAll(".bottom-stat");
  const statsData = [bottomStats.median, bottomStats.average];
  for (let si = 0; si < statsData.length && si < bottomStatRows.length; si++) {
    const tr = bottomStatRows[si];
    const values = statsData[si];
    const cells = tr.children;
    for (let mi = 0; mi < 12; mi++) {
      const td = cells[mi + 1];
      if (!td) continue;
      const newText = formatPct(values[mi]);
      const newClass = pctColorClass(values[mi]);
      if (td.textContent !== newText) td.textContent = newText;
      replaceDataClass(td, newClass);
    }
  }

  // 更新预测面板
  updatePredictionPanel(yearRows);
}

function applyRollingText(container, newText, startIndex = 0) {
  const oldText = container.dataset.currentText || "";
  if (newText === oldText) return;

  if (!container.dataset.currentText) {
    while (container.childNodes.length > startIndex) {
      container.removeChild(container.lastChild);
    }
  }
  container.dataset.currentText = newText;

  const chars = newText.split("");

  while (container.children.length - startIndex > chars.length) {
    container.removeChild(container.lastChild);
  }

  chars.forEach((char, i) => {
    const idx = startIndex + i;
    let col = container.children[idx];
    const isDigit = /\d/.test(char);

    if (!col) {
      col = document.createElement("span");
      col.className = isDigit ? "roll-col" : "roll-static";
      container.appendChild(col);
    }

    if (!isDigit) {
      if (col.className !== "roll-static" || col.textContent !== char) {
        col.className = "roll-static";
        col.innerHTML = "";
        col.textContent = char;
      }
      return;
    }

    if (col.className !== "roll-col") {
      col.className = "roll-col";
      col.innerHTML = "";
    }

    let strip = col.querySelector(".roll-strip");
    if (!strip) {
      strip = document.createElement("span");
      strip.className = "roll-strip";
      for (let d = 0; d <= 9; d++) {
        const digit = document.createElement("span");
        digit.className = "roll-digit";
        digit.textContent = d;
        strip.appendChild(digit);
      }
      col.appendChild(strip);
    }

    const digit = parseInt(char);
    strip.style.transform = `translateY(${-digit * 10}%)`;
  });
}

export function renderSpotPrice(price) {
  const el = document.getElementById("spot-price");
  if (!el) return;
  applyRollingText(el, formatPrice(price));
}

export function renderMonthChange(pct) {
  const el = document.getElementById("month-change");
  if (!el) return;
  if (!Number.isFinite(pct)) return;

  el.className = `month-change ${pct >= 0 ? "up" : "down"}`;

  const label = document.getElementById("month-label");
  if (label) label.textContent = t("monthChangeLabel");

  const sign = pct >= 0 ? "+" : "";
  const text = `${sign}${pct.toFixed(2)}%`;
  applyRollingText(el, text);
}

// 预测最低点时间范围
export function updatePredictionPanel(yearRows) {
  const panel = document.getElementById("prediction-panel");
  if (!panel) return;

  // 找到上次最高点（大牛年的最高点）和上次最低点（回调年的最低点）
  let lastHighestYear = null;
  let lastHighestDate = null;
  let lastHighestMonth = null;
  let lastHighestPrice = null;

  let lastLowestYear = null;
  let lastLowestDate = null;
  let lastLowestPrice = null;

  console.log('[PREDICTION] 所有年份数据:', yearRows.map(y => ({ year: y.year, cycle: y.cycle?.key, hasExtremes: !!y.extremes })));

  // 找上次最高点（大牛年）
  for (const y of yearRows) {
    if (y.cycle?.key === "bigBull" && y.extremes?.highest?.date) {
      lastHighestYear = y.year;
      lastHighestDate = y.extremes.highest.date;
      lastHighestMonth = y.extremes.highest.monthKey;
      lastHighestPrice = y.extremes.highest.close;
      console.log(`[PREDICTION] 找到最高点: year=${lastHighestYear}, month=${lastHighestMonth}, date=${lastHighestDate.toISOString()}, price=${lastHighestPrice}`);
      break;
    }
  }

  // 找上次最低点（回调年）
  for (const y of yearRows) {
    if (y.cycle?.key === "correction" && y.extremes?.lowest?.date) {
      lastLowestYear = y.year;
      lastLowestDate = y.extremes.lowest.date;
      lastLowestPrice = y.extremes.lowest.close;
      console.log(`[PREDICTION] 找到最低点: year=${lastLowestYear}, date=${lastLowestDate.toISOString()}, price=${lastLowestPrice}`);
      break;
    }
  }

  if (!lastHighestYear || !lastHighestDate || !lastLowestYear || !lastLowestDate) {
    panel.style.display = "none";
    return;
  }

  // 下次减半日期
  const nextHalvingDate = getNextHalvingDate(lastHighestYear);
  if (!nextHalvingDate) {
    panel.style.display = "none";
    return;
  }

  // 计算价格预测范围（基于斐波那契回调）
  const priceDiff = lastHighestPrice - lastLowestPrice;
  const pricePredMin = lastLowestPrice + priceDiff * 0.236;
  const pricePredMax = lastLowestPrice + priceDiff * 0.382;

  console.log(`[PREDICTION] 下次减半: ${nextHalvingDate.toISOString()}`);
  console.log(`[PREDICTION] 价格预测: 低点=${lastLowestPrice}, 高点=${lastHighestPrice}, 差价=${priceDiff}`);
  console.log(`[PREDICTION] 价格预测范围: ${pricePredMin.toFixed(2)} - ${pricePredMax.toFixed(2)}`);

  // 根据历史规律预测：
  // 规律1：距上次最高点 363-380 天后出现最低点
  const daysFromHighMin = 363;
  const daysFromHighMax = 380;
  const predFromDate = new Date(lastHighestDate.getTime() + daysFromHighMin * 24 * 60 * 60 * 1000);
  const predToDate = new Date(lastHighestDate.getTime() + daysFromHighMax * 24 * 60 * 60 * 1000);

  // 规律2：距下次减半 513-571 天前出现最低点
  const daysBeforeHalvingMin = 513;
  const daysBeforeHalvingMax = 571;
  const predBeforeDate = new Date(nextHalvingDate.getTime() - daysBeforeHalvingMax * 24 * 60 * 60 * 1000);
  const predAfterDate = new Date(nextHalvingDate.getTime() - daysBeforeHalvingMin * 24 * 60 * 60 * 1000);

  console.log(`[PREDICTION] 预测范围1(距最高): ${predFromDate.toISOString()} - ${predToDate.toISOString()}`);
  console.log(`[PREDICTION] 预测范围2(距减半): ${predBeforeDate.toISOString()} - ${predAfterDate.toISOString()}`);
  console.log(`[PREDICTION] 计算详情:`);
  console.log(`[PREDICTION]   - 上次最高点: ${lastHighestDate.toISOString()}`);
  console.log(`[PREDICTION]   - 下次减半: ${nextHalvingDate.toISOString()}`);
  console.log(`[PREDICTION]   - 距减半${daysBeforeHalvingMin}天前: ${predBeforeDate.toISOString()}`);
  console.log(`[PREDICTION]   - 距减半${daysBeforeHalvingMax}天前: ${predAfterDate.toISOString()}`);
  console.log(`[PREDICTION]   - 预测范围跨度: ${Math.round((predAfterDate - predBeforeDate) / (24 * 60 * 60 * 1000))}天`);

  // 计算今天距离预测范围的天数
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const rangeStartDate = new Date(Math.min(predFromDate.getTime(), predBeforeDate.getTime()));
  const rangeEndDate = new Date(Math.max(predToDate.getTime(), predAfterDate.getTime()));
  const rangeSpanDays = Math.round((rangeEndDate - rangeStartDate) / (24 * 60 * 60 * 1000));

  const daysUntilStart = Math.ceil((rangeStartDate - today) / (24 * 60 * 60 * 1000));
  const daysUntilEnd = Math.ceil((rangeEndDate - today) / (24 * 60 * 60 * 1000));
  const daysFromStart = Math.floor((today - rangeStartDate) / (24 * 60 * 60 * 1000));

  // 格式化日期范围
  const formatDateOnly = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 显示两个预测范围
  const range1Text = `${formatDateOnly(predFromDate)} - ${formatDateOnly(predToDate)} (距上次最高)`;
  const range2Text = `${formatDateOnly(predBeforeDate)} - ${formatDateOnly(predAfterDate)} (距下次减半)`;

  document.getElementById("pred-range-value").innerHTML = `
    <div style="font-size: 12px; margin-bottom: 4px;">${range1Text}</div>
    <div style="font-size: 12px;">${range2Text}</div>
  `;

  // 计算距离今天的信息
  let daysText = "";
  if (daysUntilStart > 0) {
    // 还没到预测范围
    daysText = `距开始还有 <span style="color: #4CAF50; font-weight: bold;">${daysUntilStart}</span> 天`;
    daysText += `<br><span style="font-size: 11px; color: #aaa;">(范围跨度 ${rangeSpanDays} 天: ${formatDateOnly(rangeStartDate)} - ${formatDateOnly(rangeEndDate)})</span>`;
  } else if (daysUntilEnd >= 0) {
    // 在预测范围内
    daysText = `在范围内第 <span style="color: #FFB74D; font-weight: bold;">${daysFromStart + 1}</span> 天`;
    daysText += `<br><span style="font-size: 11px; color: #aaa;">(距结束还有 ${daysUntilEnd} 天，总跨度 ${rangeSpanDays} 天)</span>`;
  } else {
    // 已超过预测范围
    daysText = `<span style="color: #f44336; font-weight: bold;">预测范围已过 ${Math.abs(daysUntilEnd)} 天</span>`;
    daysText += `<br><span style="font-size: 11px; color: #aaa;">(范围跨度 ${rangeSpanDays} 天: ${formatDateOnly(rangeStartDate)} - ${formatDateOnly(rangeEndDate)})</span>`;
  }

  document.getElementById("pred-days-value").innerHTML = daysText;
  panel.style.display = "block";

  // 显示价格预测
  const formatPrice = (price) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price);
  const priceText = `$${formatPrice(pricePredMin)} - $${formatPrice(pricePredMax)}`;
  document.getElementById("pred-price-value").innerHTML = priceText;

  // 设置复制按钮功能
  const copyBtn = document.getElementById("copy-btn");
  if (copyBtn) {
    copyBtn.onclick = () => {
      const rangeText = document.getElementById("pred-range-value").textContent;
      const daysText = document.getElementById("pred-days-value").textContent;
      const priceText = document.getElementById("pred-price-value").textContent;

      const copyText = `📈 比特币四年周期预测\n\n${rangeText}\n${daysText}\n${priceText}`;

      navigator.clipboard.writeText(copyText).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = "✅ 已复制";
        copyBtn.style.background = "rgba(76, 175, 80, 0.5)";
        copyBtn.style.color = "#4CAF50";

        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.style.background = "";
          copyBtn.style.color = "";
        }, 2000);
      }).catch(err => {
        console.error("复制失败:", err);
        copyBtn.innerHTML = "❌ 复制失败";
      });
    };
  }
}

export function setupExtremeTooltips() {
  let tooltip = null;

  function createTooltip() {
    if (tooltip) return;
    tooltip = document.createElement("div");
    tooltip.className = "extreme-tooltip";
    document.body.appendChild(tooltip);
  }

  function showTooltip(e, marker) {
    createTooltip();
    const type = marker.dataset.type;
    const date = marker.dataset.date;
    const price = marker.dataset.price;
    const extra = marker.dataset.extra || '';

    // 构建多行 tooltip 内容，给数字添加颜色
    let html = `<strong style="color: #fff;">${type}</strong><br>`;
    html += `<span style="color: #aaa;">${date} 价格</span> <span style="color: #4CAF50; font-weight: bold;">$${price}</span><br>`;
    if (extra) {
      const parts = extra.split('|');
      // 提取数字并添加颜色
      const coloredParts = parts.map(p => {
        const numMatch = p.match(/(\d+)天/);
        if (numMatch) {
          return p.replace(numMatch[0], `<span style="color: #FFB74D; font-weight: bold; font-size: 14px;">${numMatch[0]}</span>`);
        }
        return p;
      });
      html += coloredParts.join('<br>');
    }
    tooltip.innerHTML = html;

    // 先显示 tooltip 以获取尺寸
    tooltip.style.display = "block";
    tooltip.style.left = "-9999px";
    tooltip.style.top = "-9999px";

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const rect = marker.getBoundingClientRect();

    // 计算居中位置（tooltip中心对齐箭头中心）
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - 8;

    // 如果上方空间不够，显示在箭头下方
    if (top < 5) {
      top = rect.bottom + 8;
    }

    // 右边界检查
    const maxLeft = window.innerWidth - tooltipWidth - 10;
    if (left > maxLeft) {
      left = maxLeft;
    }

    // 左边界检查
    if (left < 10) {
      left = 10;
    }

    // 底部边界检查
    const maxTop = window.innerHeight - tooltipHeight - 10;
    if (top > maxTop) {
      top = maxTop;
    }

    // 顶部边界检查
    if (top < 5) {
      top = 5;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.style.display = "none";
    }
  }

  document.addEventListener("mouseover", (e) => {
    const marker = e.target.closest(".extreme-marker");
    if (marker) {
      showTooltip(e, marker);
    }
  }, true);

  document.addEventListener("mouseout", (e) => {
    const marker = e.target.closest(".extreme-marker");
    if (marker) {
      hideTooltip();
    }
  }, true);
}
