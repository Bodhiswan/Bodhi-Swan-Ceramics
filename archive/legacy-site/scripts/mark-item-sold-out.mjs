import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const itemsPath = path.join(rootDir, 'shop-admin', 'items.json');
const shopDataPath = path.join(rootDir, 'assets', 'js', 'shop-data.js');
const slug = process.argv[2];

if (!slug) {
  console.error('Usage: node scripts/mark-item-sold-out.mjs <item-slug>');
  process.exit(1);
}

const raw = await fs.readFile(itemsPath, 'utf8');
const items = JSON.parse(raw);
const item = items.find((entry) => entry.slug === slug);

if (!item) {
  console.error(`No item found for slug "${slug}"`);
  process.exit(1);
}

item.soldOut = true;

const websiteItems = items.map((entry) => ({
  slug: entry.slug,
  title: entry.title,
  price: `AUD ${entry.priceAud}`,
  description: entry.description,
  image: entry.image,
  alt: entry.alt,
  stripeUrl: entry.stripe?.paymentLinkUrl || '',
  soldOut: Boolean(entry.soldOut)
}));

await fs.writeFile(itemsPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
await fs.writeFile(
  shopDataPath,
  `// Generated from shop-admin/items.json\nwindow.BODHI_SHOP_ITEMS = ${JSON.stringify(websiteItems, null, 2)};\n`,
  'utf8'
);

console.log(`Marked "${slug}" as sold out.`);
