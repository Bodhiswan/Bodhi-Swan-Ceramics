// Example webhook handler for a serverless platform such as Netlify, Vercel, or Render.
// This file is not live by itself on GitHub Pages.
//
// What it does:
// 1. Verifies the Stripe webhook signature
// 2. Reads the purchased item slug from Stripe metadata
// 3. Marks that item as sold out in the repo data
// 4. Pushes the updated files back to GitHub so Pages redeploys

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const githubToken = process.env.GITHUB_TOKEN;
const githubRepo = process.env.GITHUB_REPOSITORY || 'Bodhiswan/Bodhi-Swan-Ceramics';
const githubBranch = process.env.GITHUB_BRANCH || 'main';

function verifyStripeSignature(payload, signatureHeader) {
  if (!stripeWebhookSecret || !signatureHeader) {
    throw new Error('Missing Stripe webhook secret or signature header');
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((piece) => {
      const [key, value] = piece.split('=');
      return [key, value];
    })
  );

  const signedPayload = `${parts.t}.${payload}`;
  const expected = crypto
    .createHmac('sha256', stripeWebhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  if (expected !== parts.v1) {
    throw new Error('Invalid Stripe signature');
  }
}

async function githubRequest(endpoint, method = 'GET', body) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `GitHub request failed: ${endpoint}`);
  }

  return data;
}

function buildShopData(items) {
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

  return `// Generated from shop-admin/items.json\nwindow.BODHI_SHOP_ITEMS = ${JSON.stringify(websiteItems, null, 2)};\n`;
}

export async function handleStripeWebhook(rawBody, signatureHeader) {
  verifyStripeSignature(rawBody, signatureHeader);

  const event = JSON.parse(rawBody);
  if (event.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Event ignored' };
  }

  const slug = event.data?.object?.metadata?.slug;
  if (!slug) {
    throw new Error('Missing item slug in Stripe metadata');
  }

  const itemsFile = await githubRequest(`/repos/${githubRepo}/contents/shop-admin/items.json?ref=${githubBranch}`);
  const items = JSON.parse(Buffer.from(itemsFile.content, 'base64').toString('utf8'));

  const item = items.find((entry) => entry.slug === slug);
  if (!item) {
    throw new Error(`No item found for slug "${slug}"`);
  }

  item.soldOut = true;

  const newItemsJson = `${JSON.stringify(items, null, 2)}\n`;
  const newShopData = buildShopData(items);

  await githubRequest(`/repos/${githubRepo}/contents/shop-admin/items.json`, 'PUT', {
    message: `Mark ${slug} sold out after Stripe purchase`,
    content: Buffer.from(newItemsJson).toString('base64'),
    sha: itemsFile.sha,
    branch: githubBranch
  });

  const shopDataFile = await githubRequest(`/repos/${githubRepo}/contents/assets/js/shop-data.js?ref=${githubBranch}`);
  await githubRequest(`/repos/${githubRepo}/contents/assets/js/shop-data.js`, 'PUT', {
    message: `Update shop data after Stripe purchase for ${slug}`,
    content: Buffer.from(newShopData).toString('base64'),
    sha: shopDataFile.sha,
    branch: githubBranch
  });

  return { statusCode: 200, body: 'Item marked sold out' };
}
