exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const { credential } = JSON.parse(event.body);
    if (!credential) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing credential' }) };
    }

    // Verify the Google ID token using Google's tokeninfo endpoint
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid Google token' }) };
    }

    // Optionally verify audience matches your client ID
    if (process.env.GOOGLE_CLIENT_ID && data.aud !== process.env.GOOGLE_CLIENT_ID) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token audience mismatch' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        email:   data.email,
        name:    data.name,
        picture: data.picture,
      }),
    };

  } catch (err) {
    console.error('google-verify error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
