# Prepay or Wait

A single-page calculator for one question: **should I prepay a trip now at today's
exchange rate, or keep my money and pay when I get there?**

Prepaying locks the rate and earns card points immediately. Waiting keeps the cash
earning interest but leaves you exposed to the currency. The two only become
comparable once you put them on the same date — so everything here is expressed in
*future dollars*, as of the day you'd otherwise pay.

## The model

Let `R` be **yen per dollar** (so a *lower* `R` means a *stronger* yen and a more
expensive trip), `t` the years until the payment date, and `r` your after-tax yield.

```
cost_prepay  = (JPY / R₀) × (1 + fee_pre)  × (1 − rew_pre)  × (1 + r)^t
cost_wait    = (JPY / R₁) × (1 + fee_late) × (1 − rew_late)
```

`cost_prepay` carries the `(1 + r)^t` factor because prepaying means giving up that
growth — it is the opportunity cost, not a charge.

Setting the two equal gives the **break-even rate**:

```
R* = R₀ × (1 + fee_late)(1 − rew_late) ÷ [ (1 + fee_pre)(1 − rew_pre) × (1 + r)^t ]
```

Prepaying wins when `R₁ < R*`. The **cushion** — the headline number — is
`(R₀ − R*) / R₀`: how far the yen has to strengthen before prepaying pays off.

With rewards equal on both sides and no FX fees, the whole thing collapses to the
interest term: the cushion is just `1 − 1/(1 + r)^t`. At 4% APY over seven months
that's about 2.3%, which is why the answer to "how far does the rate have to move?"
is usually a small single-digit percentage.

The **rough odds** treat `ln R₁` as a driftless random walk from `ln R₀` with the
annualized volatility you enter, so `P(prepay wins) = Φ( ln(R*/R₀) / (σ√t) )`.
It is a sanity check on magnitude, not a forecast.

## What it deliberately doesn't model

Refundability, chargeback timing, prepay discounts, outsized point redemptions,
and sign-up bonuses. These are listed in the app because they routinely matter more
than the arithmetic does — a 10% prepaid-rate discount swamps a 2% interest cushion.

## Build

`src/app.html` is the source: a self-contained fragment (styles, markup, script,
no external requests) that doubles as a Claude Artifact body.

```sh
node build.js   # wraps src/app.html into a standalone index.html
```

`index.html` is generated — edit `src/app.html`, not the output. Open `index.html`
directly in a browser, or serve the repo root with GitHub Pages.
