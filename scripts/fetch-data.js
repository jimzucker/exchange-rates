#!/usr/bin/env node
/**
 * Builds src/data.json — the snapshot the app ships with.
 *
 * Two live sources, both free and key-less:
 *   countries  github.com/mledoze/countries  (name, ISO code, currency, symbol, flag)
 *   FX rates   open.er-api.com               (166 currencies, USD base, daily)
 *
 * The app re-fetches rates in the browser on load; this snapshot is what it
 * falls back to when that fetch is blocked (Claude Artifact CSP) or offline.
 *
 *   node scripts/fetch-data.js
 */
const fs = require("fs");
const path = require("path");

const COUNTRIES_URL = "https://raw.githubusercontent.com/mledoze/countries/master/countries.json";
const RATES_URL = "https://open.er-api.com/v6/latest/USD";

// Daily ECB reference rates, free and keyless, covering the ~30 most-traded currencies.
// Used to measure volatility and correlation rather than guessing them.
const HISTORY_START = "1999-01-04";           // the ECB series begins here
const VOL_YEARS = 5;                           // trailing window for volatility
const HISTORY_URL = (from) => "https://api.frankfurter.dev/v1/" + from + "..?base=USD";
const TRADING_DAYS = 252;
const WEEK_MS = 7 * 86400000;
const SCALE = 10000;                           // log-levels stored to 4 decimal places

// Central bank policy rates, used as the starting guess for "what your cash earns".
// A benchmark, not a savings-account APY — the app says so and the field is editable.
//
// HAND-MAINTAINED. No free keyless feed exists for these, so the weekly rate-refresh
// workflow does not touch them. Re-verify against two independent sources and bump
// POLICY_AS_OF when you do.
//
// Verified 2026-08-15 against cbrates.com (updated 2026-08-11) and
// tradingeconomics.com/country-list/interest-rate, which agreed on every overlapping
// entry. Spot-checked: USD against the FOMC statement of 2026-07-29 (target range
// 3.50–3.75%, effective 3.63%); DKK against Danmarks Nationalbank's rate increase
// effective 2026-06-12. Where a bank publishes several rates, this is the one that
// governs what cash earns — the ECB's deposit facility, not its main refinancing rate.
const POLICY_RATES = {
  USD: 3.63, EUR: 2.25, GBP: 3.75, JPY: 1.00, CAD: 2.25, AUD: 4.35, CHF: 0.00,
  NZD: 2.50, SEK: 1.75, NOK: 4.25, DKK: 1.85, INR: 5.25, MXN: 6.50, BRL: 14.00,
  ZAR: 7.00, KRW: 2.75, CNY: 3.00, PLN: 3.75, TRY: 37.00
};
const POLICY_AS_OF = "2026-08-15";
const POLICY_FALLBACK = 3.0;

// Rough annualised volatility of the pair against a major home currency.
// Majors cluster near 9%; USD-pegged currencies barely move; everything else is
// noisier. Only feeds the "rough odds" figure, which the app labels as a model.
const VOL_MAJOR = 9;
const VOL_PEG = 2;
const VOL_DEFAULT = 13;
const MAJORS = ["USD", "EUR", "JPY", "GBP", "CHF", "CAD", "AUD", "NZD", "SEK", "NOK", "DKK"];
const PEGGED = ["HKD", "AED", "SAR", "QAR", "BHD", "OMR", "JOD", "PAB", "BSD", "BMD", "KYD", "AWG", "ANG", "XCD", "BZD", "CUC", "DJF", "ERN", "LBP"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// These feeds throw transient 5xx often enough that a single attempt would let the
// unattended weekly build quietly fall back to worse data.
async function get(url, attempts = 4) {
  let last;
  for (let i = 0; i < attempts; i++) {
    if (i) await sleep(1500 * i);
    try {
      const r = await fetch(url, { headers: { "user-agent": "prepay-or-wait build script" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) {
      last = e;
      console.error("  attempt " + (i + 1) + "/" + attempts + " failed for " + url + " — " + e.message);
    }
  }
  throw new Error(url + " -> " + last.message);
}

function volFor(code) {
  if (MAJORS.indexOf(code) !== -1) return VOL_MAJOR;
  if (PEGGED.indexOf(code) !== -1) return VOL_PEG;
  return VOL_DEFAULT;
}

/**
 * Annualised volatility of each currency against USD, plus the correlation matrix.
 * The app needs the volatility of a *pair* (say JPY per EUR); with both legs quoted
 * against USD that is sqrt(sL² + sH² − 2·rho·sL·sH), so correlations are required —
 * treating the legs as independent would materially overstate cross-rate risk.
 */
function measureVolatility(series) {
  const dates = Object.keys(series).sort();
  const codes = Object.keys(series[dates[dates.length - 1]] || {});

  // Daily log returns, only where consecutive observations both exist.
  const rets = {};
  codes.forEach((c) => (rets[c] = []));
  for (let i = 1; i < dates.length; i++) {
    const a = series[dates[i - 1]], b = series[dates[i]];
    codes.forEach((c) => {
      if (a && b && a[c] > 0 && b[c] > 0) rets[c].push(Math.log(b[c] / a[c]));
      else rets[c].push(null);
    });
  }

  const usable = codes.filter((c) => rets[c].filter((v) => v !== null).length > 250);
  const mean = {}, sd = {};
  usable.forEach((c) => {
    const v = rets[c].filter((x) => x !== null);
    const m = v.reduce((s, x) => s + x, 0) / v.length;
    mean[c] = m;
    sd[c] = Math.sqrt(v.reduce((s, x) => s + (x - m) * (x - m), 0) / (v.length - 1));
  });

  const vol = { USD: 0 };
  usable.forEach((c) => (vol[c] = +(sd[c] * Math.sqrt(TRADING_DAYS) * 100).toFixed(2)));

  const corr = { USD: { USD: 1 } };
  usable.forEach((a) => {
    corr[a] = { USD: 0 };
    corr.USD[a] = 0;
    usable.forEach((b) => {
      let n = 0, cov = 0;
      for (let i = 0; i < rets[a].length; i++) {
        const x = rets[a][i], y = rets[b][i];
        if (x === null || y === null) continue;
        cov += (x - mean[a]) * (y - mean[b]);
        n++;
      }
      corr[a][b] = n > 1 ? +(cov / (n - 1) / (sd[a] * sd[b])).toFixed(3) : 0;
    });
  });

  return { vol, corr, from: dates[0], to: dates[dates.length - 1], days: dates.length };
}

/**
 * Weekly log-level series per currency against USD, delta-encoded.
 *
 * This is what lets the app answer "how often has the rate actually moved this far?"
 * from overlapping historical windows, instead of assuming a lognormal. Weekly
 * resolution is ample for horizons measured in months, and keeps the payload small
 * enough to ship: daily would be roughly seven times the size for no added accuracy
 * at that horizon.
 */
function weeklySeries(series) {
  const dates = Object.keys(series).sort();
  const codes = Object.keys(series[dates[dates.length - 1]] || {});
  const t0 = Date.parse(dates[0]), tN = Date.parse(dates[dates.length - 1]);

  // Forward-fill onto a fixed weekly grid so every currency shares one time axis.
  const grid = [];
  for (let t = t0; t <= tN; t += WEEK_MS) grid.push(t);

  let cursor = 0;
  const latest = {};
  const cols = {};
  codes.forEach((c) => (cols[c] = []));
  for (const gt of grid) {
    while (cursor < dates.length && Date.parse(dates[cursor]) <= gt) {
      const row = series[dates[cursor]];
      codes.forEach((c) => { if (row[c] > 0) latest[c] = row[c]; });
      cursor++;
    }
    codes.forEach((c) => cols[c].push(latest[c] || null));
  }

  const out = {};
  codes.forEach((c) => {
    const col = cols[c];
    let s = col.findIndex((v) => v !== null);
    if (s < 0) return;
    const vals = col.slice(s);
    if (vals.some((v) => v === null) || vals.length < 260) return; // need a clean decade
    let prev = 0;
    const deltas = vals.map((v) => {
      const q = Math.round(Math.log(v) * SCALE);
      const d = q - prev;
      prev = q;
      return d;
    });
    out[c] = { s: s, d: deltas.join(",") };
  });

  return { start: dates[0], weeks: grid.length, scale: SCALE, series: out };
}

(async function main() {
  const history = await get(HISTORY_URL(HISTORY_START)).catch((e) => {
    console.error("history feed unavailable (" + e.message + ") — falling back to volatility bands");
    return null;
  });

  let measured = null, hist = null;
  if (history && history.rates) {
    const all = history.rates;
    const cut = new Date();
    cut.setFullYear(cut.getFullYear() - VOL_YEARS);
    const cutStr = cut.toISOString().slice(0, 10);
    const recent = {};
    Object.keys(all).forEach((d) => { if (d >= cutStr) recent[d] = all[d]; });
    measured = measureVolatility(recent);
    hist = weeklySeries(all);
  }

  const [countries, fx] = await Promise.all([get(COUNTRIES_URL), get(RATES_URL)]);
  if (fx.result !== "success") throw new Error("FX feed returned result=" + fx.result);
  const rates = fx.rates;

  const currencies = {}; // code -> {name, symbol, vol}
  const places = [];     // one entry per country we can actually price
  const skipped = [];

  countries.forEach(function (c) {
    const codes = Object.keys(c.currencies || {});
    const code = codes.find(function (k) { return rates[k] !== undefined; });
    if (!code) {
      if (codes.length) skipped.push(c.cca2 + ":" + codes.join("/"));
      return;
    }
    const cur = c.currencies[code];
    if (!currencies[code]) {
      currencies[code] = {
        name: cur.name || code,
        symbol: cur.symbol || "",
        vol: volFor(code)
      };
    }
    places.push({
      id: c.cca2,
      name: c.name.common,
      flag: c.flag || "",
      region: c.region || "Other",
      cur: code
    });
  });

  places.sort(function (a, b) { return a.name.localeCompare(b.name); });

  // Every currency with a rate should be selectable as a home currency, even if
  // no country in the list maps to it (unions, funds, metals are filtered out).
  Object.keys(rates).forEach(function (code) {
    if (!currencies[code] && /^[A-Z]{3}$/.test(code) && !/^X[A-Z]{2}$/.test(code)) {
      currencies[code] = { name: code, symbol: "", vol: volFor(code) };
    }
  });

  const policy = {};
  Object.keys(currencies).forEach(function (code) {
    policy[code] = POLICY_RATES[code] !== undefined ? POLICY_RATES[code] : POLICY_FALLBACK;
  });

  const out = {
    ratesAsOf: fx.time_last_update_utc,
    ratesSource: "open.er-api.com",
    ratesUrl: RATES_URL,
    base: fx.base_code,
    rates: rates,
    policyAsOf: POLICY_AS_OF,
    policy: policy,
    currencies: currencies,
    places: places,
    // Measured volatility beats the coarse bands wherever history exists.
    measured: measured ? {
      vol: measured.vol,
      corr: measured.corr,
      from: measured.from,
      to: measured.to,
      source: "frankfurter.dev (ECB reference rates)"
    } : null,
    // Weekly history, so the odds can be counted rather than modelled.
    hist: hist
  };

  const dest = path.join(__dirname, "..", "src", "data.json");
  fs.writeFileSync(dest, JSON.stringify(out));
  console.log(
    "wrote src/data.json — " + places.length + " destinations, " +
    Object.keys(currencies).length + " currencies, rates as of " + out.ratesAsOf
  );
  if (skipped.length) console.log("no FX rate for: " + skipped.join(", "));
})().catch(function (e) {
  console.error("failed:", e.message);
  process.exit(1);
});
