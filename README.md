[![make.fun · news-image-20261124](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/yorstann/news-image-24nov/rank.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/yorstann/news-image-24nov/reward.svg)](https://make.fun/bounty/news-image-20261124/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261124)

# The World Today — Tuesday 24 November 2026

An entry for the make.fun bounty **news-image-20261124** ("Sum up 24 November's
world news in one image"), by @yorstan.

A Node program (`main.ts`, standard library only) deterministically renders a
1024×1024 editorial magazine-cover poster and writes it to
`$MAKEFUN_OUTPUT_DIR/entry.png`:

- **Lead:** the COP31 climate talks in Antalya collapse after fifty hours of
  overtime — a low-poly iceberg split by a glowing crack under a low orange
  sun, with the day's hard numbers: 50H of overtime, 90+ nations rejecting the
  text, 0 mentions of fossil fuels.
- **Six more stories:** the Benghazi corvette sinking, Trump's warning to
  Tehran, the Houthi strike on Riyadh's tallest tower, Russia's warning to
  Estonia, Nvidia's chief reinstated, and the leaked estimate of 700,000
  Russian military deaths.
- **Ticker:** the Indonesia trade deal, the EU's $84B tariff threat, and
  Senegal restored as African champions.

Everything is drawn in code — a small software rasterizer, a geometric stroke
typeface designed for this poster, and a faceted-vector iceberg scene — at 2×
supersampling for crisp edges. No image assets, no network, byte-identical
output on every run.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png (1024×1024 PNG)
```

## License

MIT — see `LICENSE`.
