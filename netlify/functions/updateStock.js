const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let eventData;
  try {
    eventData = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return { statusCode: 400, body: 'Invalid signature' };
  }

  if (eventData.type === 'checkout.session.completed') {
    const session = eventData.data.object;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SHEET_ID;

    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:C',
    });

    const rows = readRes.data.values;

    for (const item of lineItems.data) {
      const priceId = item.price.id;
      const qty = item.quantity;

      const rowIndex = rows.findIndex(r => r[0] === priceId);
      if (rowIndex >= 0) {
        const currentStock = parseInt(rows[rowIndex][2], 10);
        const newStock = Math.max(0, currentStock - qty);

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Sheet1!C${rowIndex + 2}`, // +2 to account for header row
          valueInputOption: 'RAW',
          requestBody: { values: [[newStock]] },
        });

        console.log(`✅ Updated ${priceId}: ${currentStock} -> ${newStock}`);
      } else {
        console.warn(`⚠️ Price ID ${priceId} not found in Google Sheet`);
      }
    }

    return { statusCode: 200, body: 'Stock updated' };
  }

  return { statusCode: 200, body: 'No action taken' };
};
