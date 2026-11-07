# CareerJump: International Executive Education

A single-page React site for CareerJump's international executive education
founding waitlist.

**Stack:** React 19, TypeScript, Vite 7, and plain CSS with design tokens. It has
no UI or animation libraries; motion uses CSS plus one shared
`IntersectionObserver`. Fonts (Newsreader, Hanken Grotesk) are self-hosted in
`public/fonts`, so pages make no third-party requests.

## Getting started

```bash
npm install
cp .env.example .env   # .env is already filled in for the current endpoint
npm run dev            # http://localhost:5173
npm run build          # type-check, then build to dist/
npm run preview        # serve the production build
```

## Configuration

| Variable                 | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `VITE_WAITLIST_ENDPOINT` | Where registrations are sent. See [docs/waitlist-backend.md](docs/waitlist-backend.md). |
| `VITE_SITE_URL`          | Optional production origin. Adds `<link rel="canonical">`, `og:url` and absolute social-image URLs at build time. Leave it empty until the domain is confirmed. |

## Structure

```
index.html                 SEO, Open Graph and Twitter tags, favicons, hero poster preload
public/
  brand/                   CareerJump logo (navy for light backgrounds, white for dark)
  media/hero/              hero video (desktop 1280w + mobile portrait crop) and posters
  media/destinations/      7 destination clips (540×900, H.264) and posters
  images/{benefits,programmes,cta}/   AVIF / WebP / JPEG at responsive widths
  og-image.jpg, favicon.ico, apple-touch-icon.png, site.webmanifest, robots.txt
src/
  components/              Navbar, Hero, Destinations, Benefits, Programmes, FinalCta, Footer
  components/waitlist/     context (open + prefill), inline form section, fields, schema and validation
  data/                    programmes, destinations, benefits, form options, dial codes
  services/waitlist.ts     submission client (timeout, response checks, error mapping)
  hooks/                   media-query / reduced-motion, scroll reveal
  lib/loader.ts            lifts the boot loading screen once the page has loaded
  styles/                  tokens.css (colour, type scale, radius, shadows, spacing, motion), base.css,
                           loader.css (self-contained loading screen styles)
```

## Loading screen

- The animated CareerJump intro lives in `index.html` (`#loader`) with styles in
  `src/styles/loader.css`, so it paints before the app bundle runs.
- It plays for at least 2.1s and lifts once the page has loaded, never later than 4s
  (`MIN_MS` / `MAX_MS` in `src/lib/loader.ts`). A CSS fallback hides it after 6s if
  the app fails to start.
- It is skipped for visitors who prefer reduced motion and is never shown without JavaScript.
- To remove it, delete the `#loader` block and the loader stylesheet link from `index.html`,
  and the `dismissLoader()` call in `src/main.tsx`.

## Waitlist form

- The form is an inline section (`#waitlist`) between Destinations and Benefits.
  Every "Join the Waitlist" CTA (navbar, hero, final CTA) smoothly scrolls to it.
- Selecting a programme in the catalogue preselects *Preferred Programme*;
  selecting a destination preselects *Preferred Country or Region*.
- It has 16 fields across 3 steps. Required fields follow the brief: name, email,
  phone, location, designation and consent. To make another field mandatory, set
  `required: true` on it in `src/components/waitlist/schema.ts`.
- Success is shown only after the backend confirms the save. See
  [docs/waitlist-backend.md](docs/waitlist-backend.md).

## Security

- Production builds include a strict Content-Security-Policy (no
  `'unsafe-inline'`); see [docs/deployment-security.md](docs/deployment-security.md)
  for the headers your host must add and the pre-launch owner checklist.
- Every `VITE_*` variable is public (compiled into the bundle). Never put a
  secret in one. `.env` files are git-ignored; copy `.env.example`.
- The form sends anti-abuse signals (`hp`, `elapsed_ms`) and blocks answers
  that start like spreadsheet formulas; the Apps Script must enforce both too.

## Content guardrails

Do not add university names, logos, fees, durations, start dates, accreditation
or guaranteed outcomes until they are confirmed. The footer's partnership
disclosure must stay.

## Media credits

- Destination videos and photography come from Pexels and Unsplash under their
  free licences, which don't require attribution. Sources and authors are listed
  in `video-credits.json` and `image-credits.json`.
- The hero video, logo and favicon are existing CareerJump assets.
