# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Raduno** is a decentralized event platform built as a Base miniapp. Users can create events, register for events, and share their registrations via Farcaster casts. The app works both as a standalone web app and as a miniapp within the Base/Farcaster ecosystem.

## Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Deployment
```bash
vercel --prod                                    # Deploy to production
vercel env add NEXT_PUBLIC_PROJECT_NAME production
vercel env add NEXT_PUBLIC_ONCHAINKIT_API_KEY production
vercel env add NEXT_PUBLIC_URL production
```

## Environment Variables

Required variables in `.env.local`:
- `NEXT_PUBLIC_PROJECT_NAME` - App name (default: "Raduno")
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - Coinbase Developer Platform API key
- `NEXT_PUBLIC_URL` - Production URL (auto-detected in development)

## Architecture Overview

### Tech Stack
- **Next.js 15** with App Router
- **Tailwind CSS v4** (CSS-based configuration, no tailwind.config.js)
- **shadcn/ui** components (New York style)
- **OnchainKit** for wallet/Base integration
- **wagmi** for wallet connection state
- **Farcaster MiniKit SDK** for miniapp features

### Authentication & Wallet Connection

The app uses **wallet connection** (not Farcaster-specific auth) for access control:

- **Welcome page** (`/`) - Public, shows disabled "Get Started" button until wallet connected
- **Protected pages** - All other routes check `useAccount().isConnected` and redirect to `/` if not connected
- **Farcaster auth endpoint** (`/api/auth`) still exists for MiniKit JWT verification but is not used for route protection

### Key Configuration Files

**`minikit.config.ts`**
- Defines Farcaster manifest configuration
- Includes `accountAssociation` object (signed credentials from Farcaster)
- Used by `/app/.well-known/farcaster.json` route

**`app/rootProvider.tsx`**
- Wraps app with `OnchainKitProvider`
- Chain: Base
- MiniKit enabled with `autoConnect: true`
- Wallet preference: "all" (supports any Web3 wallet)

**`app/globals.css`**
- Tailwind v4 CSS-based configuration
- HSL color system with CSS variables (no `--color-` prefix)
- Mobile-first spacing (4px base unit)
- Base brand colors: blue primary (`255 70% 45%`), purple secondary (`285 60% 55%`)

### Page Structure

```
/                    → WelcomePage (public)
/events              → EventsPage (protected)
/events/[id]         → EventDetailPage (protected)
/create              → CreateEventPage (protected)
/my-events           → MyEventsPage (protected)
/profile             → ProfilePage (protected)
```

### Component Patterns

**Authentication Guard Pattern:**
```tsx
const { isConnected } = useAccount();

useEffect(() => {
  if (!isConnected) {
    router.push("/");
  }
}, [isConnected, router]);
```

**MiniKit Initialization Pattern:**
```tsx
const { isFrameReady, setFrameReady } = useMiniKit();

useEffect(() => {
  if (!isFrameReady) {
    setFrameReady();
  }
}, [setFrameReady, isFrameReady]);
```

**Cast Composition Pattern:**
```tsx
const { composeCastAsync } = useComposeCast();

const result = await composeCastAsync({
  text: castText,
  embeds: [process.env.NEXT_PUBLIC_URL || ""]
});

if (result?.cast) {
  console.log("Cast created:", result.cast.hash);
}
```

### Important Implementation Details

1. **Tailwind v4 Differences:**
   - No `tailwind.config.js` (uses CSS `@theme` blocks)
   - Import with `@import "tailwindcss";`
   - PostCSS plugin: `@tailwindcss/postcss`
   - Color variables use standard names (e.g., `--primary`, not `--color-primary`)

2. **shadcn/ui Integration:**
   - Style: "new-york"
   - Components in `/components/ui`
   - Uses `cn()` utility from `/lib/utils.ts`
   - All components use HSL color system

3. **Mobile Optimization:**
   - 44px minimum touch targets (Base guidelines)
   - Safe area utilities (`.safe-top`, `.safe-bottom`, etc.)
   - Bottom navigation bar for primary navigation
   - Portrait-focused design

4. **Event Registration Flow:**
   - Check wallet connection
   - Simulate smart contract call (TODO: integrate actual contract)
   - Compose Farcaster cast with event details
   - Update local state

5. **API Route Authentication:**
   - `/api/auth` uses Farcaster Quick Auth
   - Verifies JWT tokens with domain matching
   - `getUrlHost()` helper handles Vercel environments
   - Returns user FID but not used for route protection

## Farcaster MiniApp Publishing

To update the manifest for Base app publishing:

1. Sign manifest at [farcaster.xyz/~/developers/mini-apps/manifest](https://farcaster.xyz/~/developers/mini-apps/manifest)
2. Update `accountAssociation` in `minikit.config.ts`
3. Test at [base.dev/preview](https://base.dev/preview)
4. Deploy and post URL in Base app to publish

## Smart Contract Integration (TODO)

The app is designed for smart contract integration but currently uses mock data:

- Event creation: `handleSubmit` in `/app/create/page.tsx`
- Event registration: `handleRegister` in `/app/events/[id]/page.tsx`
- Event data: Mock arrays in each page component

When integrating contracts:
- Use `address` from `useAccount()` for user identification
- Use `viem` and `wagmi` hooks (already installed)
- Base chain is pre-configured in `RootProvider`
