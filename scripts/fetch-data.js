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

// Central bank policy rates, used as the starting guess for "what your cash earns".
// A benchmark, not a savings-account APY — the app says so and the field is editable.
// Source: unirateapi.com/central-bank-rates, table dated 2026-04-20.
const POLICY_RATES = {
  USD: 4.50, EUR: 2.50, GBP: 4.50, JPY: 0.50, CAD: 2.75, AUD: 4.10, CHF: 0.25,
  NZD: 3.50, SEK: 2.25, NOK: 4.25, DKK: 2.10, INR: 6.00, MXN: 9.00, BRL: 14.25,
  ZAR: 7.25, KRW: 2.75, CNY: 3.10, PLN: 5.75, TRY: 42.50
};
const POLICY_AS_OF = "2026-04-20";
const POLICY_FALLBACK = 3.0;

// Rough annualised volatility of the pair against a major home currency.
// Majors cluster near 9%; USD-pegged currencies barely move; everything else is
// noisier. Only feeds the "rough odds" figure, which the app labels as a model.
const VOL_MAJOR = 9;
const VOL_PEG = 2;
const VOL_DEFAULT = 13;
const MAJORS = ["USD", "EUR", "JPY", "GBP", "CHF", "CAD", "AUD", "NZD", "SEK", "NOK", "DKK"];
const PEGGED = ["HKD", "AED", "SAR", "QAR", "BHD", "OMR", "JOD", "PAB", "BSD", "BMD", "KYD", "AWG", "ANG", "XCD", "BZD", "CUC", "DJF", "ERN", "LBP"];

function get(url) {
  return fetch(url, { headers: { "user-agent": "prepay-or-wait build script" } }).then(function (r) {
    if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
    return r.json();
  });
}

function volFor(code) {
  if (MAJORS.indexOf(code) !== -1) return VOL_MAJOR;
  if (PEGGED.indexOf(code) !== -1) return VOL_PEG;
  return VOL_DEFAULT;
}

(async function main() {
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
    places: places
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
