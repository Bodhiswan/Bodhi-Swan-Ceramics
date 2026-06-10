# Netlify Webhook Setup

This project can keep the main website on GitHub Pages and use Netlify only for the Stripe webhook.

## What the Webhook Does

- receives `checkout.session.completed` from Stripe
- verifies the Stripe signature
- reads the purchased item slug from Stripe metadata
- marks that item as sold out in:
  - `shop-admin/items.json`
  - `assets/js/shop-data.js`
- commits those changes back to GitHub
- GitHub Pages redeploys automatically

The buyer's shipping address stays in Stripe. It is not written into the public repo.

## Files Added

- `netlify/functions/stripe-webhook.js`
- `netlify/functions/webhook-health.js`
- `netlify.toml`

## Netlify Setup

1. Create a new Netlify site from this GitHub repo.
2. In site settings, confirm:
   - build command: none
   - publish directory: `.`
   - functions directory: `netlify/functions`
3. Deploy the site.

Your webhook URL will look like:

`https://your-netlify-site.netlify.app/.netlify/functions/stripe-webhook`

## Netlify Environment Variables

Add these environment variables in Netlify:

- `STRIPE_WEBHOOK_SECRET`
- `GITHUB_TOKEN`
- `GITHUB_REPOSITORY`
- `GITHUB_BRANCH`

Recommended values:

- `GITHUB_REPOSITORY=Bodhiswan/Bodhi-Swan-Ceramics`
- `GITHUB_BRANCH=main`

## GitHub Token

Create a fine-grained GitHub personal access token with access to:

- repository contents: read and write

Store that token in Netlify as `GITHUB_TOKEN`.

## Stripe Setup

In Stripe:

1. Go to Developers -> Webhooks
2. Add endpoint
3. Use your Netlify function URL:
   - `https://your-netlify-site.netlify.app/.netlify/functions/stripe-webhook`
4. Subscribe to:
   - `checkout.session.completed`
5. Copy the signing secret into Netlify as:
   - `STRIPE_WEBHOOK_SECRET`

## Test the Webhook

Health check:

`https://your-netlify-site.netlify.app/.netlify/functions/webhook-health`

If that returns `ok: true`, the function host is up.

## Important

This flow assumes each ceramic item is unique and should become sold out after a successful purchase.
