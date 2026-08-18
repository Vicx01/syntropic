# Miyagami — static site (cleaned HTTrack mirror)

Static mirror of `www.miyagami.com`, restructured from the raw HTTrack output
into a flat, self-contained site. All CSS/JS/images are local under `assets/`.

## Structure

```
├── index.html            home page
├── about.html            about / contact / work / insights (+ insightsXXXX.html = listing pagination)
├── contact.html
├── work.html
├── insights.html
├── insights/…            blog articles
├── industries/…          finance, real-estate, saas, sustainability
├── services/…            framed, shipped, embedded
├── work/…                case studies
├── support-pages/…       privacy policy, terms, MSA
└── assets/
    ├── css/              Webflow page CSS + shared CSS + swiper-bundle.min.css
    ├── js/               Webflow bundle, jQuery, GSAP (3.12.5 & 3.15.0), Swiper,
    │                     Finsweet attributes, gtag loader, email-decode
    └── images/           all images/fonts-adjacent assets (avif/png/svg/jpg)
```

## Notes

- **Serving**: it's plain static HTML — serve the repo root with any web server,
  e.g. `python3 -m http.server 8000`. Opening files via `file://` also works,
  but a server is recommended (srcset/fonts behave better).
- **Webflow runtime (animations/interactions)**: the Webflow JS bundle is
  code-split — it lazily loads 17 `…achunk.<hash>.js` files at runtime, which
  mirror tools cannot capture. The three runtime `<script>` tags therefore
  point at the absolute CDN URLs, so webpack resolves its chunks from the CDN
  too. Pages render fully styled offline; animations/interactions need
  internet (same as the fonts below). CSS/jQuery/GSAP/Swiper/Finsweet are
  served locally.
- **Fonts**: the Webflow CSS loads brand fonts (SpaceMono, Fracktif,
  HelveticaNeue) from `https://cdn.prod.website-files.com/…` absolute URLs.
  They load when online and fall back to system fonts when offline.
- **SRI note**: the published pages pinned `integrity="sha…"` hashes on their
  CSS/JS tags. Those hashes went stale the moment the mirrored files were
  localized (path rewrites), which made browsers block the stylesheets and
  render pages unstyled — the attributes were removed site-wide so the
  original, complete stylesheets and scripts apply again.
- **Cloudflare email protection**: `assets/js/email-decode.min.js` is a local
  re-implementation of Cloudflare's decoder — it converts the protected
  `#<hex>` links back into `mailto:` links.
- **Recreated assets** (originals were blocked/404 on the CDN):
  `assets/images/placeholder.60f9b1840c.svg` (blank placeholder) and
  `assets/images/69a0195640dc0ca324615b8b_gree-check.svg` (filter-checkbox
  checkmark).
- Removed: HTTrack splash/cache (`hts-cache/`, `hts-log.txt`, `cookies.txt`,
  `backblue.gif`, `fade.gif`), saved Cloudflare error pages, and the saved
  404 page `insights/overview-software-development-life-cycle-sdlc-models.html`
  (its one inbound link now points at `insights.html`).
