const crypto = require('node:crypto');

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

  if (!parts.t || !parts.v1) {
    throw new Error('Malformed Stripe signature header');
  }

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
    throw new Error(data.message || `GitHub request failed for ${endpoint}`);
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

async function updateRepoForSoldOut(slug) {
  const itemsFile = await githubRequest(`/repos/${githubRepo}/contents/shop-admin/items.json?ref=${githubBranch}`);
  const items = JSON.parse(Buffer.from(itemsFile.content, 'base64').toString('utf8'));

  const item = items.find((entry) => entry.slug === slug);
  if (!item) {
    throw new Error(`No item found for slug "${slug}"`);
  }

  if (item.soldOut) {
    return { alreadySoldOut: true, item };
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

  return { alreadySoldOut: false, item };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const signatureHeader = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    verifyStripeSignature(event.body, signatureHeader);

    const stripeEvent = JSON.parse(event.body);
    if (stripeEvent.type !== 'checkout.session.completed') {
      return {
        statusCode: 200,
        body: 'Event ignored'
      };
    }

    const session = stripeEvent.data?.object;
    const slug = session?.metadata?.slug;
    if (!slug) {
      throw new Error('Missing item slug in Stripe metadata');
    }

    const result = await updateRepoForSoldOut(slug);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        slug,
        alreadySoldOut: result.alreadySoldOut,
        customerEmail: session.customer_details?.email || '',
        shippingName: session.shipping_details?.name || '',
        shippingAddress: session.shipping_details?.address || null
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
