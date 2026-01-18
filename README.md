# Recipe Keeper

Recipe Keeper is a modern web application for digitalizing, organizing, and preserving family recipes. It leverages AI (OpenAI Vision) to scan recipes from images and PDFs, making it easy to build your digital cookbook.

## Features

-   **Recipe Scanning**: Upload images or PDFs of recipes, and let AI extract ingredients and instructions.
-   **Monetization**: Credit-based system for scanning. Users get 5 free credits on signup and can purchase more via Stripe.
-   **Organization**: Categorize recipes, add tags, and organize into collections.
-   **PDF Export**: Generate beautiful PDF cookbooks from your collections.
-   **Multi-language**: Supports English and German.
-   **Responsive Design**: Mobile-first interface built with Tailwind CSS and Shadcn UI.

## Tech Stack

-   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
-   **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
-   **AI**: OpenAI GPT-4 Vision API
-   **Payments**: Stripe
-   **Edge**: Cloudflare Workers (Image Optimization)

## Setup Guide

### Prerequisites

-   Node.js 18+
-   npm or yarn
-   Supabase CLI
-   Stripe Account

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/recipe-keeper.git
cd recipe-keeper
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase (Get these from your Supabase Project Settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Get these from Stripe Dashboard -> Developers -> API keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI (For Edge Functions, set in Supabase Dashboard secrets, not here for local dev unless serving functions locally)
OPENAI_API_KEY=sk-...
```

### 3. Supabase Setup

1.  **Login**: `npx supabase login`
2.  **Link Project**: `npx supabase link --project-ref your-project-ref`
3.  **Push Database**:
    ```bash
    npx supabase db push
    ```
    This applies all migrations, including the credit system and profiles table.

4.  **Deploy Edge Functions**:
    ```bash
    npx supabase functions deploy --no-verify-jwt
    ```
    This deploys `analyze-recipe`, `scrape-recipe`, etc.

5.  **Set Secrets**:
    Set the following secrets in your Supabase Dashboard (Edge Functions -> Secrets) or via CLI:
    ```bash
    npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
    npx supabase secrets set OPENAI_API_KEY=sk-...
    npx supabase secrets set SUPABASE_URL=https://your-project.supabase.co
    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key
    ```
    *Note: The Next.js app uses `STRIPE_SECRET_KEY` from `.env.local`, but if you move logic to Edge Functions, they need it too.*

### 4. Stripe Setup

1.  **Create Products**:
    The app currently uses on-the-fly pricing in `src/app/api/stripe/checkout/route.ts` for simplicity.
    -   20 Credits: 5.00 CHF
    -   50 Credits: 10.00 CHF
    -   100 Credits: 35.00 CHF
    
    *Optional: You can create these Products in Stripe and update the code to use Price IDs.*

2.  **Webhook Configuration**:
    -   Go to Stripe Dashboard -> Developers -> Webhooks.
    -   Add Endpoint: `https://<your-deployment-url>/api/stripe/webhook`
        -   *Note: replace `<your-deployment-url>` with your actual Vercel or production domain (e.g. `https://recipe-keeper.vercel.app`).*
    -   Select events: `checkout.session.completed`
    -   Copy the Signing Secret (`whsec_...`) to your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

    **Local Development**:
    Use Stripe CLI to forward webhooks to localhost:
    ```bash
    stripe listen --forward-to localhost:3000/api/stripe/webhook
    ```
    Copy the CLI-generated secret to `.env.local`.

### 5. Run Locally

```bash
npm run dev
```
Visit `http://localhost:3000`.

## Deployment

### Vercel (Frontend)

1.  Push code to GitHub.
2.  Import project in Vercel.
3.  Add all Environment Variables from `.env.local`.
    *   **CRITICAL**: You MUST include `SUPABASE_SERVICE_ROLE_KEY` in Vercel. It is required for the `/api/credits/consume` and `/api/stripe/webhook` endpoints to manage user credits securely.
4.  Deploy.

### Supabase (Backend)

Database changes and Edge Functions are deployed via CLI commands mentioned in the Setup section.
