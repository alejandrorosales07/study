exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const required = ['STRIPE_SECRET_KEY','STRIPE_SCHOLAR_PRICE_ID','STRIPE_PRO_PRICE_ID','YOUR_DOMAIN'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Missing env vars: ${missing.join(', ')}` }) };
  }

  try {
    const { plan, userEmail, userName } = JSON.parse(event.body);

    const priceMap = {
      scholar: process.env.STRIPE_SCHOLAR_PRICE_ID,
      pro:     process.env.STRIPE_PRO_PRICE_ID,
    };

    if (!priceMap[plan]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Invalid plan: ${plan}` }) };
    }

    const domain = process.env.YOUR_DOMAIN.replace(/\/$/, '');
    const successUrl = `${domain}/?payment=success&plan=${plan}&email=${encodeURIComponent(userEmail)}`;
    const cancelUrl  = `${domain}/?payment=cancelled`;

    // Build Stripe checkout session via REST (no npm package needed)
    const params = new URLSearchParams({
      'payment_method_types[0]':        'card',
      'line_items[0][price]':           priceMap[plan],
      'line_items[0][quantity]':        '1',
      'mode':                           'subscription',
      'customer_email':                 userEmail,
      'success_url':                    successUrl,
      'cancel_url':                     cancelUrl,
      'metadata[plan]':                 plan,
      'metadata[userName]':             userName || '',
      'subscription_data[metadata][plan]': plan,
    });

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Stripe error:', data);
      return { statusCode: res.status, headers, body: JSON.stringify({ error: data.error?.message || 'Stripe error' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ url: data.url }) };

  } catch (err) {
    console.error('create-checkout error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
