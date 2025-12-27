# Convex Setup Guide

This project uses Convex as the backend with Clerk for authentication. Follow these steps to set it up:

## 1. Initialize Convex

Run the following command to initialize your Convex project:

```bash
npx convex dev
```

This will:
- Create a Convex account (if you don't have one)
- Set up a new Convex project
- Generate the `convex/_generated` directory with TypeScript types
- Create a `.env.local` file with your `NEXT_PUBLIC_CONVEX_URL`

## 2. Set Up Clerk

1. Create a Clerk account at [clerk.com](https://clerk.com) if you don't have one
2. Create a new application in Clerk
3. Get your Clerk keys from the dashboard:
   - Publishable Key (starts with `pk_`)
   - Secret Key (starts with `sk_`)

4. Add your Clerk publishable key to `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## 3. Configure Clerk in Convex Dashboard

1. Go to your Convex dashboard (https://dashboard.convex.dev)
2. Navigate to Settings → Authentication
3. Add Clerk as an authentication provider
4. Enter your Clerk Secret Key when prompted
5. Configure the JWT template name as "convex" (or update the code to match your template name)

## 4. Environment Variables

Your `.env.local` file should contain:

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Make sure this file is in your `.gitignore` (it should be by default).

## 5. Generate Types

After setting up Convex, generate TypeScript types:

```bash
npx convex codegen
```

This will create the `convex/_generated/api.d.ts` file that provides type safety for your Convex functions.

## 6. Run the Development Server

```bash
bun run dev
```

The app should now connect to your Convex backend with Clerk authentication!

## Troubleshooting

- **"No CONVEX_DEPLOYMENT set"**: Run `npx convex dev` first
- **Type errors**: Make sure you've run `npx convex codegen` after setting up Convex
- **Authentication errors**: 
  - Ensure Clerk is configured in your Convex dashboard
  - Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
  - Verify the JWT template name matches in both Clerk and Convex settings
