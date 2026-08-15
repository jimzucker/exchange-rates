# Prompt 1

_2026-08-15_

## Prompt

Received from a friend over chat and passed through as the first prompt. Typos
corrected; wording and substance otherwise unchanged.

> Since you're Mr. App Development, I have a good one for you to consider. We're going
> to Japan in March and currently the exchange rates are very favorable to the yen. So
> I have an option of prepaying now on my credit card which will give me credit card
> points but I will lose the interest that I would get on my money until March. Then
> there is the factor that exchange rates can change between now and March when I would
> pay.
>
> So there needs to be an app that can do all the math for people
>
> I determined that the exchange rate would have to move more than 2 and 1/2% for me to
> be damaged by it as opposed to prepay
>
> It would be better if I could just go on an app, put in a couple things and it would
> determine everything for me

Follow-up, sent mid-turn:

> record this as prompt1 in a file and your response

## Response

Built **Prepay or Wait**, a single-page calculator.

**Artifact:** https://claude.ai/code/artifact/a420b5c9-35f5-4332-a8ae-c65753300362

**Files added**

| Path | What it is |
|---|---|
| `src/app.html` | The source — a self-contained fragment (styles, markup, script, zero external requests) that doubles as the Artifact body |
| `build.js` | Wraps `src/app.html` into a standalone `index.html` |
| `index.html` | Generated; open directly or serve via GitHub Pages |
| `README.md` | The model, the derivation, and what it deliberately doesn't price |
| `prompts/prompt1.md` | This file |

**The four inputs it asks for:** the amount (¥ or $), today's ¥/$ rate, the date you'd
otherwise pay, and what your cash earns. Points, FX fees, tax on interest, and
volatility sit behind a "fine print" disclosure with sane defaults.

**The core result.** Everything is compared in March dollars, so the interest you'd
forgo shows up as a cost on the prepay side:

```
cost_prepay = (JPY / R₀) × (1 + fee_pre)  × (1 − rew_pre)  × (1 + r)^t
cost_wait   = (JPY / R₁) × (1 + fee_late) × (1 − rew_late)

R* = R₀ × (1 + fee_late)(1 − rew_late) ÷ [ (1 + fee_pre)(1 − rew_pre) × (1 + r)^t ]
```

**Confirming the 2.5%.** With rewards equal on both sides and no FX fees, the formula
collapses to `1 − 1/(1+r)^t` — purely the interest term. At 4% APY over the 212 days to
15 Mar 2027 that's **2.25%**, which is where the ~2.5% came from. The number moves the
moment the two reward rates differ: pay cash in Japan instead of charging it, and the
cushion drops to 0.26% — prepaying becomes nearly a coin flip rather than a clear loss.
That asymmetry is the thing the app makes visible and mental arithmetic doesn't.

**Design notes.** The page is deliberately colorless — cool graphite neutrals, a
system grotesque for prose, monospace for every rate and figure — until it produces an
answer, at which point one hue appears: blue for prepay, red for wait. Those two are
the validated diverging poles and clear every CVD and contrast gate in both light and
dark themes. The signature element is a rate ruler showing today's rate against the
break-even rate, with the cushion as the gap between them.

**Flagged, not modeled:** refundability, chargeback timing, prepaid-rate discounts,
outsized point redemptions, and sign-up bonuses. A 10% prepaid discount swamps a 2%
interest cushion, so these are listed in the app rather than buried.

The odds figure is a driftless random-walk model, labeled as such — a magnitude check,
not a forecast.
