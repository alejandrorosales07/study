const crypto = require('crypto');

// Verify Stripe webhook signature without the npm package
function verifyStripeSignature(rawBody, sigHeader, secret) {
  try {
    const parts     = sigHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t=')).slice(2);
    const sigs      = parts.filter(p => p.startsWith('v1=')).map(p => p.slice(3));
    const signed    = `${timestamp}.${rawBody}`;
    const expected  = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex');
    // Replay attack guard: reject if older than 5 minutes
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    return sigs.some(s => {
      try { return crypto.timingSafeEqual(Buffer.from(s, 'hex'), Buffer.from(expected, 'hex')); }
      catch { return false; }
    });
  } catch { return false; }
}

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'STRIPE_WEBHOOK_SECRET not set' }) };
  }

  const sig = event.headers['stripe-signature'];
  if (!sig) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing stripe-signature header' }) };
  }

  // event.body is the raw string in Netlify Functions
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  if (!verifyStripeSignature(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)) {
    console.error('Invalid Stripe signature');
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  let stripeEvent;
  try { stripeEvent = JSON.parse(rawBody); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  // Handle relevant events
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const plan      = session.metadata?.plan;
    const userEmail = session.customer_email;
    // Log for your records — plan is also applied client-side on the success redirect
    console.log(`Payment success: ${userEmail} → ${plan} plan | session ${session.id}`);
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const sub = stripeEvent.data.object;
    console.log(`Subscription cancelled: ${sub.customer}`);
    // In a real app with a DB you'd downgrade the user here
  }

  return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
};
