# Stripe Fulfillment Notes

This project now supports:

- Stripe product + price + payment link creation
- Stripe payment links that collect:
  - shipping address
  - phone number

## What Works Right Now

When an item is created with:

```powershell
node scripts/sync-shop-with-stripe.mjs --stripe
```

its Stripe Payment Link is created with shipping address collection enabled for Australia and phone number collection enabled.

That means Stripe can collect:

- customer name
- email
- shipping address
- phone number

You can view those details in Stripe after purchase.

## What Does Not Work Automatically Yet

The live site is currently deployed as a static GitHub Pages site.

Because GitHub Pages is static, it cannot directly receive Stripe webhooks.

That means automatic "mark sold out after purchase" needs one additional live backend endpoint.

## Prepared Pieces

These pieces are already in the repo:

- `scripts/mark-item-sold-out.mjs`
  - marks an item sold out locally
- `webhook-examples/stripe-webhook-handler.js`
  - example webhook logic for a serverless host

## Best Production Path

Use one small serverless webhook endpoint on:

- Netlify
- Vercel
- Render
- Cloudflare Workers

Then configure Stripe to send `checkout.session.completed` to that endpoint.

The webhook handler can:

1. verify the Stripe event
2. read the purchased item slug from Stripe metadata
3. update `shop-admin/items.json`
4. update `assets/js/shop-data.js`
5. commit those changes back to GitHub
6. let GitHub Pages redeploy

## Important Note

Stripe payment links created before this update may not collect shipping address and phone number.

If you want older live items to collect those details too, recreate or refresh their payment links.
