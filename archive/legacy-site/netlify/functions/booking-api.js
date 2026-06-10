const appsScriptUrl = process.env.BOOKING_APPS_SCRIPT_URL || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

async function sendToAppsScript(action, data = null) {
  if (!appsScriptUrl) {
    throw new Error('Missing BOOKING_APPS_SCRIPT_URL');
  }

  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      data
    })
  });

  const result = await response.json();
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Apps Script request failed for ${action}`);
  }

  return result;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const result = await sendToAppsScript('getAvailability');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
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

    const payload = JSON.parse(event.body || '{}');
    const action = payload.action;

    if (!action) {
      throw new Error('Missing action');
    }

    if (!['submitBookingRequest', 'getAvailability'].includes(action)) {
      throw new Error('Unsupported action');
    }

    const result = await sendToAppsScript(action, payload.data || null);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
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
