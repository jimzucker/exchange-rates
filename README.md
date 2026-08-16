# Prepay or Wait

A single-page calculator for one question: **should I prepay a trip now at today's
exchange rate, or keep my money and pay when I get there?**

Prepaying locks the rate and earns card points immediately. Waiting keeps the cash
earning interest but leaves you exposed to the currency. The two only become
comparable once you put them on the same date — so everything here is expressed in
*future money*, as of the day you'd otherwise pay.

It asks where you're going, both prices, when you'd otherwise pay, what your cash earns,
and how likely your plans are to change — then works out the rest. 245 destinations,
164 currencies.

## The model

Let `R` be **units of local currency per unit of your home currency** (so a *lower*
`R` means a *stronger* local currency and a more expensive trip), `t` the years until
the payment date, and `r` your after-tax yield.

The two prices are entered separately — prepaid rates are usually discounted, and that
discount is normally the largest term in the whole comparison. With `p` the chance the
trip doesn't happen and `c` the share of a prepayment you'd forfeit:

```
cost_prepay = (PRE  / R₀) × (1 + fee_pre)  × (1 − rew_pre) × (1 + r)^t × [(1−p) + p·c]
cost_wait   = (LATE / R₁) × (1 + fee_late) × (1 − rew_late)            × (1−p)
```

The `p·c` term is what cancellation risk costs prepaying: if the trip falls through you
still eat the non-refundable share, while waiting costs nothing. With `p = 0` both
collapse to the simple case:

```
cost_prepay = (LOCAL / R₀) × (1 + fee_pre)  × (1 − rew_pre)  × (1 + r)^t
cost_wait   = (LOCAL / R₁) × (1 + fee_late) × (1 − rew_late)
```

`cost_prepay` carries the `(1 + r)^t` factor because prepaying means giving up that
growth — it is the opportunity cost, not a charge.

Setting the two equal gives the **break-even rate**:

```
R* = (LATE/PRE) × R₀ × (1 + fee_late)(1 − rew_late) × (1−p)
     ÷ [ (1 + fee_pre)(1 − rew_pre) × (1 + r)^t × ((1−p) + p·c) ]
```

Prepaying wins when `R₁ < R*`. The **cushion** — the headline number — is
`(R₀ − R*) / R₀`: how far the local currency has to strengthen before prepaying pays
off.

With rewards equal on both sides and no FX fees, the whole thing collapses to the
interest term: the cushion is just `1 − 1/(1 + r)^t`. At 4.5% over seven months that's
about 2.5%, which is why the answer to "how far does the rate have to move?" is
usually a small single-digit percentage.

## The odds are counted, not modelled

Where history covers both currencies, the app does not assume a distribution. It walks
every overlapping window of the right length since 1999 and counts how often the pair
actually moved far enough:

```
prepaying would have won when   ln(R_{t+w}/R_t) < ln(R*/R₀)
```

For Japan over 30-week windows that is 1,411 samples, and the answer is 37%. A lognormal
model puts the same number at 47% — the gap is the yen's real behaviour over 27 years,
which a bell curve centred on today does not capture.

The windows overlap, so successive samples are not independent, and the past is not the
future. It is a frequency, not a probability.

Where a currency has no ECB history the app falls back to the parametric model,
`P = Φ( ln(R*/F) / (σ√t) )` — **centred on the forward, not on spot**, since the forward
is the market's own expectation and risk-neutral pricing drifts to it rather than staying
put. Centring on spot understated prepaying's chances by about seven points.

## The forward rate, and why prepaying is a bet

An FX forward — or a currency future — is not a prediction. Its price is locked by
arbitrage to the two countries' interest rates:

```
F = R₀ × (1 + r_local)^t / (1 + r_home)^t
```

Divide that by the break-even and everything cancels but one term:

```
F / R* = (1 + r_local)^t
```

Since foreign rates are never negative in practice, **the forward always sits above
break-even**. At the price the market will actually guarantee you today, waiting wins —
by exactly the interest the foreign currency earns.

That reframes the whole question. Prepaying is not a hedge; it is a directional bet that
the local currency strengthens by *more* than the market has already priced in. The app
shows the forward alongside "if the rate doesn't move", because the second is a much
weaker benchmark: for the Japan case it overstates waiting's advantage roughly threefold.

Caveats it states in the UI: real forwards use money-market rates rather than the policy
rates here, some currencies carry a cross-currency basis this misses, and a price is
still not a prediction.

## Where the numbers come from

| Number | Source | Live? |
|---|---|---|
| Exchange rates | [open.er-api.com](https://open.er-api.com) — 164 currencies, no key | **Yes**, re-fetched in the browser on load; falls back to the build-time snapshot |
| Countries, currencies, symbols | [mledoze/countries](https://github.com/mledoze/countries) | Baked in at build time |
| Default APY | Central bank policy rate for your home currency | **No** — a static table, dated in the footer |
| Forward rate | Derived from the policy table by covered interest parity | Follows the live spot |
| Default volatility | Measured from 5 years of daily [ECB rates](https://frankfurter.dev) — stdev of log returns, annualised, with the full correlation matrix so cross-pairs are exact | Refreshed at build time |
| Odds | Counted from weekly ECB history back to 1999 (29 currencies); parametric fallback otherwise | Refreshed at build time |

The weekly history is delta-encoded log-levels at 4 decimal places — 151 kB of the
payload, and the reason the page is 256 kB raw but **90 kB gzipped**, which is what
GitHub Pages actually serves. Daily resolution would be seven times the size and add
nothing at a horizon measured in months.

The APY default is deliberately *not* presented as a lookup. Policy rates aren't what
your savings account pays, and the honest answer to "what does your money earn?" is
one only you know — so it is a labelled starting point, and the field sits with the
other three questions rather than buried in the assumptions.

If your cash sits in a checking account earning nothing, enter 0. That erases the
interest term entirely, and the decision comes down to points: identical rewards on
both sides make it a dead tie, and the app says so rather than inventing a winner.
Prepaying only pulls ahead if you'd have paid cash on arrival and earned nothing.

**Rates are live on GitHub Pages only.** Published as a Claude Artifact, the page's
content-security policy blocks the outbound fetch, so it runs on the snapshot and
says so in the status line.

## Why the headline is a range, not a winner

A single "waiting wins by $57" implies confidence the numbers don't support. $57 is
trivial beside what the currency can do in a month, beside cancellation flexibility, or
beside a small prepaid discount.

So the headline has three states rather than two. It always names whoever is ahead —
otherwise changing an input appears to do nothing, which is how the first attempt at this
failed — but how confident it sounds varies:

| State | When | Reads |
|---|---|---|
| Dead heat | gap under 0.5% of the bill, or odds within 45–55% | *Financially near break-even* |
| Lean | ahead, but under a quarter of the 10th–90th spread | *Waiting is slightly ahead* |
| Clear | ahead by more than that | *Waiting is the better bet* |

The lean state says so in as many words: "the currency routinely moves more than that, so
treat it as a lean rather than a verdict."

The answer always shows the spread alongside the point estimate: for the default Japan
case, waiting has historically landed anywhere between $2,489 and $3,001 against a fixed
$2,801 to prepay. Against a $512 range, a $57 edge is noise.

## What it deliberately doesn't model

Chargeback timing, outsized point redemptions, and sign-up bonuses. Also the value of
simply being able to change your mind, which is separate from the expected cost of
cancelling and for many trips is worth more than either. These are listed in the app.

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

`.github/workflows/refresh-rates.yml` does this automatically every Monday, committing
only when the numbers actually move. Run it on demand from the Actions tab, or with
`gh workflow run refresh-rates.yml`.

Note that the workflow refreshes **rates only**. The central bank policy table that
seeds the APY default lives in `scripts/fetch-data.js` as a hand-maintained constant
with an `as of` date — there is no free keyless feed for it, so it needs a human.
