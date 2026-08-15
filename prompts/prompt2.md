# Prompt 2

_2026-08-15_

## Prompt

> Yes but I would like the app to go and and pull the current exchange rate so people
> don't have to do too much work
>
> Very cool. I think people would find this app useful because they're not knowledgeable
> enough to know what variables to think about when prepaying versus not in a country
> like Japan.
>
> If the app could do all countries and look up the exchange rates itself and interest
> rates itself then it would make it easier for people to use it
>
> Very cool analysis. A little complicated for most people.
>
> But I think a lot of people don't even think about these types of things

## Response

Four changes: live rates, every country, fewer questions, and an explanation up front.

**Files added**

| Path | What it is |
|---|---|
| `scripts/fetch-data.js` | Pulls countries + FX rates from the live feeds into `src/data.json` |
| `src/data.json` | Generated snapshot — 245 destinations, 164 currencies |
| `dist/artifact.html` | Generated body fragment for the Claude Artifact build |

**Live exchange rates.** [open.er-api.com](https://open.er-api.com) — free, no API key,
CORS-enabled, 164 currencies. The page re-fetches on load and shows a green dot with
the feed date; if the fetch is blocked it falls back to the build-time snapshot and
says "Offline — rate from <date>". Verified working in a headless render.

Caveat: this only works on GitHub Pages. Published as a Claude Artifact the CSP blocks
the outbound request, and the only runtime capabilities available (`downloads`, `mcp`)
don't cover generic fetch. The artifact runs on the snapshot.

**Every country.** A destination picker built from the
[mledoze/countries](https://github.com/mledoze/countries) dataset, grouped by region
with flags. Picking a country sets the currency, the rate, the volatility band, and
the money formatting. Home currency is auto-detected from the browser locale and
overridable. `restcountries.com` was the obvious source but it has been deprecated —
using its upstream dataset directly instead.

**Interest rates: deliberately not a live lookup.** There is no free keyless feed for
this, and more importantly a policy rate isn't what anyone's savings account pays. So:
a static table of central bank policy rates keyed on home currency, dated in the
footer, presented as a labelled starting point in an editable field. Claiming a lookup
here would have been worse than not doing one.

**Simpler.** Three questions on the surface — where, how much, when. Everything else
moved behind "Show the details": the tiles, ruler, chart, table, and every assumption.
Above the questions, three cards name the trade-off in plain language, since the point
you made is that most people never think to weigh these against each other at all.

**Verification.** Rendered headlessly in Chrome across widths and both themes, which
caught four real bugs: the volatility default treated USD as exotic (13% instead of
9%), the table printed a near-duplicate row beside break-even, sub-unit amounts lost a
decimal (`$0.7`), and the chart's zero tick read `+$0`. A fifth: rates below 1.0 —
yen-as-home-currency — collapsed to `0.0063` for both the current and break-even rate,
so rate formatting now holds five significant figures. An element-level overflow probe
at 320/360/390px came back clean.

One earlier claim corrected: the apparent clipping in a phone-width screenshot was a
crop artifact, not a layout bug — headless Chrome clamps its window to 500px and the
screenshot was cropped to 430. The responsive fixes made along the way (grid columns
that collapse below their track size, a wrappable formula) are kept regardless.
