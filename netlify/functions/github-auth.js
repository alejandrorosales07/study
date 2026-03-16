exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'GitHub OAuth not configured' }) };
  }

  try {
    const { code } = JSON.parse(event.body);
    if (!code) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code' }) };
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('GitHub token error:', tokenData);
      return { statusCode: 401, headers, body: JSON.stringify({ error: tokenData.error_description || 'Failed to get access token' }) };
    }

    // Get user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    const userData = await userRes.json();

    // Get user email (may not be public on profile)
    let email = userData.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      const emails = await emailRes.json();
      const primary = emails.find(e => e.primary && e.verified);
      email = primary?.email || emails[0]?.email;
    }

    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No email on GitHub account. Please make your email public or use another sign-in method.' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        email,
        name:    userData.name || userData.login,
        avatar:  userData.avatar_url,
        login:   userData.login,
      }),
    };

  } catch (err) {
    console.error('github-auth error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
