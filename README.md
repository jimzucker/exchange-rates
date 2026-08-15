# Prepay or Wait

A single-page calculator for one question: **should I prepay a trip now at today's
exchange rate, or keep my money and pay when I get there?**

Prepaying locks the rate and earns card points immediately. Waiting keeps the cash
earning interest but leaves you exposed to the currency. The two only become
comparable once you put them on the same date — so everything here is expressed in
*future money*, as of the day you'd otherwise pay.

It asks three questions — where you're going, how much they want, and when you'd
otherwise pay — and works out the rest. 245 destinations, 164 currencies.

## The model

Let `R` be **units of local currency per unit of your home currency** (so a *lower*
`R` means a *stronger* local currency and a more expensive trip), `t` the years until
the payment date, and `r` your after-tax yield.

```
cost_prepay = (LOCAL / R₀) × (1 + fee_pre)  × (1 − rew_pre)  × (1 + r)^t
cost_wait   = (LOCAL / R₁) × (1 + fee_late) × (1 − rew_late)
```

`cost_prepay` carries the `(1 + r)^t` factor because prepaying means giving up that
growth — it is the opportunity cost, not a charge.

Setting the two equal gives the **break-even rate**:

```
R* = R₀ × (1 + fee_late)(1 − rew_late) ÷ [ (1 + fee_pre)(1 − rew_pre) × (1 + r)^t ]
```

Prepaying wins when `R₁ < R*`. The **cushion** — the headline number — is
`(R₀ − R*) / R₀`: how far the local currency has to strengthen before prepaying pays
off.

With rewards equal on both sides and no FX fees, the whole thing collapses to the
interest term: the cushion is just `1 − 1/(1 + r)^t`. At 4.5% over seven months that's
about 2.5%, which is why the answer to "how far does the rate have to move?" is
usually a small single-digit percentage.

The **rough odds** treat `ln R₁` as a driftless random walk from `ln R₀` with the
annualized volatility shown, so `P(prepay wins) = Φ( ln(R*/R₀) / (σ√t) )`. It is a
sanity check on magnitude, not a forecast.

## Where the numbers come from

| Number | Source | Live? |
|---|---|---|
| Exchange rates | [open.er-api.com](https://open.er-api.com) — 164 currencies, no key | **Yes**, re-fetched in the browser on load; falls back to the build-time snapshot |
| Countries, currencies, symbols | [mledoze/countries](https://github.com/mledoze/countries) | Baked in at build time |
| Default APY | Central bank policy rate for your home currency | **No** — a static table, dated in the footer |
| Default volatility | Coarse band per currency (majors ≈ 9%, pegs ≈ 2%, rest ≈ 13%) | **No** — only feeds the odds figure |

The APY default is deliberately *not* presented as a lookup. Policy rates aren't what
your savings account pays, and the honest answer to "what does your money earn?" is
one only you know — so it is a labelled starting point with an editable field. If your
cash sits in a checking account earning nothing, enter 0 and watch the answer swing
hard toward prepaying.

**Rates are live on GitHub Pages only.** Published as a Claude Artifact, the page's
content-security policy blocks the outbound fetch, so it runs on the snapshot and
says so in the status line.

## What it deliberately doesn't model

Refundability, chargeback timing, prepay discounts, outsized point redemptions, and
sign-up bonuses. These are listed in the app because they routinely matter more than
the arithmetic does — a 10% prepaid-rate discount swamps a 2% interest cushion.

## Build

`src/app.html` is the source: a self-contained fragment (styles, markup, script, no
external assets) with a `__PW_DATA__` placeholder where the data snapshot is injected.

```sh
node scripts/fetch-data.js   # refresh src/data.json from the live feeds
node build.js                # -> index.html and dist/artifact.html
```

- `index.html` — standalone page for GitHub Pages. Generated; don't edit.
- `dist/artifact.html` — body fragment for publishing as a Claude Artifact. Generated.

The detail panel is open by default; collapsing it is remembered per browser. Append
`#simple` to the URL to force it closed on load, or `#details` to force it open.

Re-run `fetch-data.js` whenever you want a fresher offline snapshot; the live fetch
means day-to-day staleness only affects the artifact build and offline use.
