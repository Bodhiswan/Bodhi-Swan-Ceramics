# Bodhi Swan Ceramics

An artist portfolio and shop for one-of-a-kind wheel-thrown vases.
Static site — no build step, no frameworks. Open `index.html` or deploy the
repo root to Netlify as-is.

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Home — artist statement, featured work, current exhibition, shop teaser |
| `gallery.html` | Full body of work, filterable by series |
| `exhibitions.html` | Current and past exhibitions |
| `shop.html` | Available pieces with cart + email ordering |
| `piece.html?id=…` | Detail page for any single work |
| `about.html` | Artist statement, practice, contact |

## Managing content

All vases and exhibitions live in **`assets/js/works.js`** — one file, plain
JavaScript objects. The gallery, shop, exhibitions, home page, and piece pages
all render from it.

To add or edit a piece:

1. Duplicate an entry in `WORKS`, give it a unique `id`.
2. Point `image` at a photo (drop real photos in `images/`).
3. Set `status`:
   - `available` — appears in the shop with Add to Cart
   - `sold` — shown with a Sold badge
   - `exhibition` — gallery only, linked to its exhibition via `exhibitionId`
   - `collection` — gallery only, not for sale
4. Optionally set `checkoutUrl` to a Stripe Payment Link — the piece's Buy
   button will then go straight to secure card checkout instead of the
   email-order flow.

Exhibitions are edited in the `EXHIBITIONS` array in the same file, and the
home-page picks featured pieces from `FEATURED_IDS`.

## Placeholder images

Current images in `images/placeholders/` are generated SVG stand-ins. Replace
them with real photographs (ideally 4:5 portrait crops, ~1600px wide) by
updating each work's `image` path in `works.js`. The generator lives in
`tools/generate-placeholders.py` if you ever want to regenerate or tweak them.

## Ordering / checkout

The cart stores selections in the browser and submits orders via a pre-filled
email to the studio. To switch any piece to instant card payment, create a
Stripe Payment Link for it and paste the URL into that work's `checkoutUrl`.

## Legacy site

The previous site (pottery classes, booking system, Firebase/Stripe
integration) is preserved untouched in `archive/legacy-site/`.
