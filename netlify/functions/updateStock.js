const { GoogleSpreadsheet } = require('google-spreadsheet');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let session;

  try {
    session = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (session.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Event ignored' };
  }

  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.data.object.id, { limit: 10 });
    console.log('Line items:', lineItems.data);

    const doc = new GoogleSpreadsheet('YOUR_SPREADSHEET_ID');
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    for (const item of lineItems.data) {
      const row = rows.find(r => r.PriceID === item.price.id);
      if (row) {
        row.Stock = Math.max(0, row.Stock - item.quantity);
        await row.save();
      }
    }

    return { statusCode: 200, body: 'Stock updated' };
  } catch (err) {
    console.error('Update stock failed:', err);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
