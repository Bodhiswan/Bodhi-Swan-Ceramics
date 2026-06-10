exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({
    ok: true,
    service: 'stripe-webhook',
    timestamp: new Date().toISOString()
  })
});
