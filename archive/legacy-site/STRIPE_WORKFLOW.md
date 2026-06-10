# Stripe Workflow

This project is set up so the website shop can be updated from one source file and optionally synced to Stripe.

## Source of Truth

Edit:

- `shop-admin/items.json`

Each item includes:

- `title`
- `priceAud`
- `description`
- `image`
- `alt`
- `soldOut`
- Stripe IDs and payment link fields

## Website-Only Update

If you only want to update the website data:

```powershell
node scripts/sync-shop-with-stripe.mjs
```

That rewrites:

- `assets/js/shop-data.js`

## Stripe + Website Update

If you want the script to create Stripe products, prices, and payment links too:

```powershell
$env:STRIPE_SECRET_KEY="sk_live_or_test_here"
node scripts/sync-shop-with-stripe.mjs --stripe
```

Or save the key locally in:

- `shop-admin/stripe-secret-key.txt`

That file is ignored by git.

## Safe Access

Best option:

1. Create a restricted Stripe key in the Stripe Dashboard.
2. Give it the minimum permissions needed for:
   - Products
   - Prices
   - Payment Links
3. Put it in an environment variable locally instead of committing it to the repo.

Do not store live secret keys in tracked files.

## What You Can Send Me

You can send me item details in chat like:

- title
- price
- description
- image filename
- sold out or available

Then I can update `shop-admin/items.json` and regenerate the website data.

If you also want Stripe created automatically, I’ll need either:

- `STRIPE_SECRET_KEY` set locally, or
- a local `shop-admin/stripe-secret-key.txt` file
