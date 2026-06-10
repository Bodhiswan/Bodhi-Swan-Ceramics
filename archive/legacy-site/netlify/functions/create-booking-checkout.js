const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const bookingAppsScriptUrl = process.env.BOOKING_APPS_SCRIPT_URL || '';
const publicSiteUrl = process.env.PUBLIC_SITE_URL || 'https://bodhiswan.com';
const bookingApiUrl = process.env.BOOKING_API_URL || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

const classPricing = {
  'first-class': {
    amount: 7000,
    name: 'First pottery class',
    description: 'Introductory pottery class with Bodhi Swan Ceramics'
  },
  'returning-class': {
    amount: 6000,
    name: 'Returning pottery class',
    description: 'Returning pottery class with Bodhi Swan Ceramics'
  }
};

function sanitizeText(value, maxLength = 500) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function validateBookingPayload(payload) {
  const requiredFields = ['date', 'dateKey', 'time', 'classType', 'fullName', 'email', 'phone', 'experience'];
  for (const field of requiredFields) {
    if (!sanitizeText(payload[field])) {
      throw new Error(`Missing ${field}`);
    }
  }

  if (!classPricing[payload.classType]) {
    throw new Error('This class type is not configured for online payment');
  }
}

async function stripeRequest(endpoint, body) {
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

async function fetchAvailability(dateKey) {
  const url = bookingApiUrl || (bookingAppsScriptUrl ? `${bookingAppsScriptUrl}?action=getAvailability` : '');
  if (!url) {
    return null;
  }

  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Unable to check availability');
  }

  return result?.data?.slots?.[dateKey] || null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Method Not Allowed'
      })
    };
  }

  try {
    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    if (!bookingAppsScriptUrl) {
      throw new Error('Missing BOOKING_APPS_SCRIPT_URL');
    }

    const payload = JSON.parse(event.body || '{}');
    validateBookingPayload(payload);

    const availability = await fetchAvailability(payload.dateKey);
    if (availability && availability.available <= 0) {
      throw new Error('That session is no longer available');
    }

    const pricing = classPricing[payload.classType];
    const bookingNotes = sanitizeText(payload.notes, 450);

    const session = await stripeRequest('checkout/sessions', {
      mode: 'payment',
      success_url: `${publicSiteUrl}/calendar.html?booking=paid&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicSiteUrl}/calendar.html?booking=cancelled`,
      customer_email: sanitizeText(payload.email, 200),
      'phone_number_collection[enabled]': 'true',
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'aud',
      'line_items[0][price_data][product_data][name]': pricing.name,
      'line_items[0][price_data][product_data][description]': `${pricing.description} on ${sanitizeText(payload.date, 120)} at ${sanitizeText(payload.time, 60)}`,
      'line_items[0][price_data][unit_amount]': String(pricing.amount),
      'line_items[0][quantity]': '1',
      'metadata[kind]': 'booking',
      'metadata[date]': sanitizeText(payload.date, 120),
      'metadata[dateKey]': sanitizeText(payload.dateKey, 20),
      'metadata[time]': sanitizeText(payload.time, 60),
      'metadata[classType]': sanitizeText(payload.classType, 50),
      'metadata[fullName]': sanitizeText(payload.fullName, 120),
      'metadata[email]': sanitizeText(payload.email, 200),
      'metadata[phone]': sanitizeText(payload.phone, 50),
      'metadata[experience]': sanitizeText(payload.experience, 60),
      'metadata[notes]': bookingNotes,
      'metadata[paymentAmountAud]': String(pricing.amount / 100)
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: error.message
      })
    };
  }
};
