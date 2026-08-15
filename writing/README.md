# Writing

Publication material about the project, kept with the code so the numbers in the prose
can be checked against the thing they describe.

| File | What it is |
|---|---|
| `linkedin-article.md` | The LinkedIn article — paste-ready |
| `linkedin-hero.png` | Cover image, 3840×2160 (16:9 at 2×) |
| `linkedin-product.png` | Screenshot of the live site, same dimensions |
| `hero.html` | Source of the cover image |

## Regenerating the cover

`hero.html` is self-contained and computes its own chart from the same model as the app,
so the break-even it draws stays honest. Render it at 16:9:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1920,1080 --force-device-scale-factor=2 \
  --virtual-time-budget=6000 \
  --screenshot=writing/linkedin-hero.png "file://$PWD/writing/hero.html"
```

The product shot is the live site at the same size:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1920,1080 --force-device-scale-factor=2 \
  --virtual-time-budget=12000 \
  --screenshot=writing/linkedin-product.png \
  "https://jimzucker.github.io/exchange-rates/#simple"
```

The figures baked into `hero.html` — ¥445,900, ¥159.237, 212 days, 3.63% APY — are a
snapshot. If the rate or the policy table moves far enough that the cover disagrees with
the live app, re-render it.

## Before publishing

`prompts/prompt1.md` and `prompt2.md` quote a third party verbatim in a public repo, and
the article links here. Worth their sign-off, or anonymise those files first.
