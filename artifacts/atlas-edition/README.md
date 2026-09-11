# Atlas Edition visual QA

Captured against a local production build at `http://localhost:3100` with Chrome 152.0.7977.83 on 12 September 2026. The captures use Chrome DevTools device emulation so the layout viewport exactly matches each filename. Re-run them against the development server with:

```powershell
$env:ATLAS_QA_URL = "http://localhost:3000"
node artifacts\atlas-edition\capture-qa.mjs
```

## Screenshots

- [Homepage — 1440 × 900](./home-1440x900.png)
- [Homepage — 1024 × 900](./home-1024x900.png)
- [Homepage — 768 × 1024](./home-768x1024.png)
- [Homepage — 390 × 844](./home-390x844.png)
- [Homepage — 360 × 800](./home-360x800.png)
- [World category — 1440 × 900](./category-world-1440x900.png)
- [Article — 1440 × 900](./article-1440x900.png)
- [Article — 390 × 844](./article-390x844.png)
- [Staff sign-in regression check](./staff-1440x900.png)
- [World globe at rest](./world-rest-1440x900.png)
- [World globe after pointer response](./world-pointer-1440x900.png)
- [World globe reduced-motion fallback](./world-reduced-motion-1440x900.png)

The rest and pointer frames are the interaction demonstration. The change is intentionally subtle: the champagne meridian and stippled land rotate within a six-degree pointer cap. Reduced motion uses the static CSS sphere and does not request the canvas module.

## Lab observations

The machine-readable results are in [qa-results.json](./qa-results.json). Every public viewport reported a document width equal to its viewport width, cumulative layout shift of `0`, and no long tasks after the first 360 px capture. Warm local LCP observations ranged from 92 ms to 332 ms; the 1440 px homepage observed 148 ms. These values come from an unthrottled local production server with a warm API and browser cache. They are useful for regression comparison only and are not production field data.

The production build, TypeScript check, and ESLint pass separately. Performance still needs deployment-level Lighthouse runs and real-user monitoring before the targets can be treated as proven.

## Content review items

The API currently publishes a vulgar test headline/summary as the newest Politics story, a one-word Sports test story, a missing byline on the lead, and a lead image that is visibly a desktop screenshot. The redesign renders the database in publication order, so these records remain visible and should be reviewed in the CMS rather than hidden in frontend code.
