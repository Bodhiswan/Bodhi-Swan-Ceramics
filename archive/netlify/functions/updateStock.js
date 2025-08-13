const { GoogleSpreadsheet } = require('google-spreadsheet');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let session;
  const sig = event.headers['stripe-signature'];

  try {
    session = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (session.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Event ignored' };
  }

  try {
    const checkoutSession = session.data.object;
    const lineItems = await stripe.checkout.sessions.listLineItems(checkoutSession.id, { limit: 10 });

    const doc = new GoogleSpreadsheet('YOUR_SPREADSHEET_ID_HERE');
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    for (const item of lineItems.data) {
      const priceId = item.price.id;
      const qty = item.quantity;

      const row = rows.find(r => r.PriceID === priceId);
      if (row) {
        const currentStock = parseInt(row.Stock, 10);
        const newStock = Math.max(0, currentStock - qty);
        row.Stock = newStock;
        await row.save();
        console.log(`✅ Updated stock for ${row['Product Name']}: ${currentStock} → ${newStock}`);
      } else {
        console.warn(`❌ No row found for PriceID: ${priceId}`);
      }
    }

    return { statusCode: 200, body: 'Stock updated successfully' };
  } catch (err) {
    console.error('Update failed:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
