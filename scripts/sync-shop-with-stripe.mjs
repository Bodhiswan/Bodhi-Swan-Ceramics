import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const itemsPath = path.join(rootDir, 'shop-admin', 'items.json');
const shopDataPath = path.join(rootDir, 'assets', 'js', 'shop-data.js');
const localKeyPath = path.join(rootDir, 'shop-admin', 'stripe-secret-key.txt');

const shouldSyncStripe = process.argv.includes('--stripe');

async function getStripeSecretKey() {
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }

  try {
    const fileKey = await fs.readFile(localKeyPath, 'utf8');
    const trimmed = fileKey.trim();
    return trimmed || '';
  } catch {
    return '';
  }
}

async function readItems() {
  const raw = await fs.readFile(itemsPath, 'utf8');
  return JSON.parse(raw);
}

async function writeItems(items) {
  const formatted = `${JSON.stringify(items, null, 2)}\n`;
  await fs.writeFile(itemsPath, formatted, 'utf8');
}

async function writeShopData(items) {
  const websiteItems = items.map((item) => ({
    slug: item.slug,
    title: item.title,
    price: `AUD ${item.priceAud}`,
    description: item.description,
    image: item.image,
    alt: item.alt,
    stripeUrl: item.stripe?.paymentLinkUrl || '',
    soldOut: Boolean(item.soldOut)
  }));

  const js = `// Generated from shop-admin/items.json\nwindow.BODHI_SHOP_ITEMS = ${JSON.stringify(websiteItems, null, 2)};\n`;
  await fs.writeFile(shopDataPath, js, 'utf8');
}

function assertValidItem(item) {
  const required = ['slug', 'title', 'priceAud', 'description', 'image', 'alt'];
  for (const key of required) {
    if (!item[key] && item[key] !== 0) {
      throw new Error(`Item "${item.slug || item.title || 'unknown'}" is missing required field "${key}".`);
    }
  }
}

async function stripeRequest(endpoint, body) {
  const stripeSecretKey = await getStripeSecretKey();
  const response = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Stripe request failed for ${endpoint}`);
  }

  return data;
}

async function ensureStripeResources(item) {
  item.stripe ||= {
    productId: '',
    priceId: '',
    paymentLinkId: '',
    paymentLinkUrl: ''
  };

  if (!item.stripe.productId) {
    const product = await stripeRequest('products', {
      name: item.title,
      description: item.description,
      'metadata[slug]': item.slug,
      active: item.soldOut ? 'false' : 'true'
    });
    item.stripe.productId = product.id;
  }

  if (!item.soldOut && !item.stripe.priceId) {
    const price = await stripeRequest('prices', {
      product: item.stripe.productId,
      currency: 'aud',
      unit_amount: String(Math.round(Number(item.priceAud) * 100))
    });
    item.stripe.priceId = price.id;
  }

  if (!item.soldOut && item.stripe.priceId && (!item.stripe.paymentLinkId || !item.stripe.paymentLinkUrl)) {
    const paymentLink = await stripeRequest('payment_links', {
      'line_items[0][price]': item.stripe.priceId,
      'line_items[0][quantity]': '1',
      'metadata[slug]': item.slug,
      'shipping_address_collection[allowed_countries][0]': 'AU',
      'phone_number_collection[enabled]': 'true'
    });
    item.stripe.paymentLinkId = paymentLink.id;
    item.stripe.paymentLinkUrl = paymentLink.url;
  }
}

async function main() {
  const items = await readItems();
  items.forEach(assertValidItem);

  if (shouldSyncStripe) {
    if (!(await getStripeSecretKey())) {
      throw new Error('Missing Stripe key. Set STRIPE_SECRET_KEY or create shop-admin/stripe-secret-key.txt before running with --stripe.');
    }

    for (const item of items) {
      await ensureStripeResources(item);
    }

    await writeItems(items);
  }

  await writeShopData(items);
  console.log(`Shop data written to ${path.relative(rootDir, shopDataPath)}`);

  if (shouldSyncStripe) {
    console.log('Stripe products, prices, and payment links synced.');
  } else {
    console.log('Stripe was not contacted. Run with --stripe when you want to create/update Stripe resources.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
