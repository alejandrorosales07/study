exports.handler = async () => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600',
  },
  body: JSON.stringify({
    // These are PUBLIC keys — safe to expose to the browser
    googleClientId: process.env.GOOGLE_CLIENT_ID  || null,
    githubClientId: process.env.GITHUB_CLIENT_ID  || null,
  }),
});
