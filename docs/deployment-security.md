# Deployment security checklist

The site is a static single-page app. Most hardening is already in the code;
a few protections can only be set by the hosting platform.

## Already in the build

| Control | Where |
| --- | --- |
| Content-Security-Policy (`<meta>`, production build only) | `vite.config.ts` → `contentSecurityPolicy()` |
| Inline script allowed only by SHA-256 hash, no `'unsafe-inline'` | same |
| `connect-src` limited to the site and the configured waitlist endpoint | derived from `VITE_WAITLIST_ENDPOINT` |
| Fonts self-hosted (no third-party requests on page load) | `public/fonts`, `src/styles/fonts.css` |
| `Referrer-Policy: strict-origin-when-cross-origin` (`<meta>`) | `index.html` |
| No source maps in production | Vite default |
| `.env*` files git-ignored (template `.env.example` is committed) | `.gitignore` |

The meta CSP is:

```
default-src 'self'; script-src 'self' 'sha256-…'; style-src 'self'; font-src 'self';
img-src 'self' data:; media-src 'self'; connect-src 'self' <endpoint origin>;
object-src 'none'; base-uri 'self'; form-action 'self'
```

If you change the inline `<script>` in `index.html`, rebuild: the hash updates
automatically. If you change the waitlist endpoint to another host, rebuild so
`connect-src` follows it.

## Set on the host (cannot be done from HTML)

Add these response headers in your platform's config (for example
`vercel.json` → `headers`, Netlify or Cloudflare Pages `_headers`, or nginx):

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `frame-ancestors 'none'` (add to, or replace, the meta policy above) |
| `X-Frame-Options` | `DENY` (older browsers) |
| `X-Content-Type-Options` | `nosniff` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (add `preload` only once every subdomain is HTTPS) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Cache-Control` for `/assets/*`, `/fonts/*`, `/images/*`, `/media/*` | `public, max-age=31536000, immutable` |

Roll out a header-based CSP as `Content-Security-Policy-Report-Only` first if
you extend it, check the browser console for violations, then enforce.

## Owner actions before launch

- Update the Apps Script `doPost` (see `docs/waitlist-backend.md`): neutralise
  formulas, validate fields, drop bot submissions, and consider Turnstile or
  reCAPTCHA.
- Restrict who can view and edit the waitlist Google Sheet, and keep 2-step
  verification on the owning Google account.
- Publish a privacy notice covering what the form collects, why, who processes
  it (Google), how long it is kept and how to request deletion (India's DPDP
  Act; GDPR for EU visitors). Link it next to the consent checkbox and in the
  footer. This needs review by someone qualified; it is not drafted here.
