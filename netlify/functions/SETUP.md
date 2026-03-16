# Lumina — Deployment Setup Guide

## Files to commit to GitHub
```
lumina/
├── index.html
├── netlify.toml
└── netlify/
    └── functions/
        ├── claude.js
        ├── create-checkout.js
        ├── stripe-webhook.js
        ├── google-verify.js
        ├── github-auth.js
        └── config.js
```

---

## Environment Variables (Netlify → Site configuration → Environment variables)

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → Developers → Webhooks → signing secret |
| `STRIPE_SCHOLAR_PRICE_ID` | dashboard.stripe.com → Products → Scholar plan → price ID (price_xxx) |
| `STRIPE_PRO_PRICE_ID` | dashboard.stripe.com → Products → Pro plan → price ID (price_xxx) |
| `YOUR_DOMAIN` | Your Netlify URL e.g. https://lumina-abc123.netlify.app |
| `GOOGLE_CLIENT_ID` | console.cloud.google.com (optional) |
| `GITHUB_CLIENT_ID` | github.com/settings/developers (optional) |
| `GITHUB_CLIENT_SECRET` | github.com/settings/developers (optional) |

---

## Stripe Setup (10 minutes)

1. Sign up at **stripe.com**
2. Go to **Products** → **Add product**
3. Create "Scholar" → $7/month (recurring) → copy the **Price ID** (starts with `price_`)
4. Create "Pro" → $10/month (recurring) → copy the **Price ID**
5. Go to **Developers → API keys** → copy the **Secret key** (starts with `sk_`)
6. Go to **Developers → Webhooks** → **Add endpoint**
   - URL: `https://YOUR-SITE.netlify.app/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy the **Signing secret**
7. Add all 4 values as Netlify env vars

---

## Google OAuth Setup (optional, 10 minutes)

1. Go to **console.cloud.google.com**
2. Create a new project
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized JavaScript origins: `https://YOUR-SITE.netlify.app`
6. Copy the **Client ID** → add as `GOOGLE_CLIENT_ID` in Netlify

---

## GitHub OAuth Setup (optional, 5 minutes)

1. Go to **github.com/settings/developers → OAuth Apps → New OAuth App**
2. Homepage URL: `https://YOUR-SITE.netlify.app`
3. Authorization callback URL: `https://YOUR-SITE.netlify.app` (the app handles it in JS)
4. Copy **Client ID** → `GITHUB_CLIENT_ID`
5. Generate a **Client secret** → `GITHUB_CLIENT_SECRET`

---

## Email Waitlist

No setup needed. Netlify Forms captures submissions automatically.
View them at: **Netlify dashboard → Forms**

---

## After adding env vars — always redeploy!

Netlify → Deploys → Trigger deploy → Deploy site
