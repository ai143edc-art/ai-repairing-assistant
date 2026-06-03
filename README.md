# AI Repairing Assistant — Website

The official landing page + download site for **AI Repairing Assistant**, an AI-powered
Windows desktop app for mobile-phone motherboard / micro-soldering repair.

Static site — **no build step, no backend, no trackers**. Just HTML, CSS and vanilla JS.
The visual theme (dark “Jarvis” palette, cyan `#22D3EE` accent, animated arc-reactor HUD)
is matched 1:1 to the app itself.

## Structure

```
index.html                     # the landing page
404.html                       # branded not-found page
robots.txt
_headers                       # security + cache headers (Netlify / Cloudflare Pages)
assets/
  css/styles.css               # all styling (app palette)
  js/reactor.js                # arc-reactor HUD, ported from the app's SkiaSharp JarvisHud
  js/main.js                   # nav, reveal, FAQ, copy-hash, count-up
  img/                         # logo + favicons (from the app icon)
downloads/
  AI-Repairing-Assistant-Setup-10.1.7.exe   # the installer the Download button serves
```

## Run locally

```bash
# any static server works, e.g.:
npx serve .
# or
python -m http.server 8080
```

Then open <http://localhost:8080>.

## Security

- Strict **Content-Security-Policy** (no inline scripts, no `eval`, no third-party JS).
- Security headers shipped in `_headers`: HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`.
- No analytics, cookies, or external scripts. The only third-party requests are Google Fonts
  (stylesheet + font files), which are whitelisted in the CSP.
- The download has a published **SHA-256** so users can verify integrity.

## Deploy

Drop the folder on any static host (GitHub Pages, Netlify, Cloudflare Pages, Vercel).
The `_headers` file is applied automatically by Netlify and Cloudflare Pages.

> The 71 MB installer in `downloads/` makes the site self-contained. For Git-based hosts you
> can instead attach the installer to a **GitHub Release** and point the Download button at it
> (keeps the repo light).

---

© AI Repairing Assistant · Built with C# / WPF / .NET 9 & Google Gemini.
