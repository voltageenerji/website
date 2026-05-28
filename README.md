# Voltage Energy — voltage.com.tr

A cinematic, real-time **energy-intelligence platform** for Voltan Elektrik
Toptan Satış A.Ş. — "Electricity Markets, Reengineered."

> Türkçe özet: Statik tek-dosya siteden, canlı EPİAŞ verisini koruyan
> sinematik bir Next.js uygulamasına geçildi. Cloudflare Pages **build**
> ayarları değişti — aşağıya bakın.

## Stack

- **Next.js 16** (App Router, **static export** → `out/`)
- **Tailwind CSS v4**
- **Three.js** via React Three Fiber + drei — living energy-topology background
- **GSAP ScrollTrigger** — pinned, scroll-scrubbed cinematic scenes
- **Lenis** — buttery smooth scrolling
- **Framer Motion** — UI reveals & data motion

## Live data (preserved)

Real **EPİAŞ Şeffaflık** day-ahead clearing price (PTF) is fetched from the
existing Cloudflare Worker proxy:

```
https://epias-proxy.emirhantan-ku.workers.dev/ptf/today
```

It drives the live nav chip, the 24h price chart, hourly energy bars, the
volatility curve, the spread heatmap, balancing/portfolio panels **and** the
Three.js atmosphere (volatility → motion, API syncs → light pulses). A bundled
fallback curve keeps the visuals intact if the feed is briefly unavailable.

## Structure

```
src/
  app/            layout (fonts, metadata, providers) + page (6 chapters)
  components/
    background/   Three.js energy field (R3F shader)
    sections/     Hero · LiveMarket · VoltageModel · NationalNetwork
                  · InvestmentScale · Future
    viz/          PtfChart · EnergyBars · VolatilityCurve · SpreadHeatmap
    ui/           Nav · Footer · Reveal · ChapterHeading · CountUp
    MarketFeed    headless EPİAŞ poller
    SmoothScroll  Lenis + GSAP integration
  hooks/          useMarket · useNowHour
  lib/            constants · types · store · format
public/           _headers · _redirects · robots.txt · sitemap.xml
legacy/           previous single-file static site (reference)
```

## Local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → out/
```

## Deploy (Cloudflare Pages)

The repo is no longer a static-root site — it now needs a build step.
Update the Pages project settings:

| Setting                | Value           |
| ---------------------- | --------------- |
| Build command          | `npm run build` |
| Build output directory | `out`           |
| Node version           | `20` or newer   |

`_headers`, `_redirects`, `robots.txt` and `sitemap.xml` live in `public/`
and are emitted into `out/` automatically. The Worker CORS allowlist already
covers `voltage.com.tr`, so live PTF works as soon as the domain is live.

See `DEPLOY.md` for the full walkthrough.
