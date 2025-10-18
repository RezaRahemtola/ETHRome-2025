const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjYyNzU4MCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDI2OWE5OUEwMjAzNWVDRTJGN2U0RjI0MDZGNmEyMTNlRTFhM0MzMEUifQ",
    payload: "eyJkb21haW4iOiJyYWR1bm8ucmV6YS5kZXYifQ",
    signature: "uBoTTFs2MMJhObSWZfxDkGUMJyzxTvjUBGfk9kI5pxxdtAQ25Dc1tTLAVV+Y8HbcHKgAN4r601mD0MPJCUKANhw="
  },
  miniapp: {
    version: "1",
    name: "Raduno",
    homeUrl: ROOT_URL,

    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/icon.png`,
    splashBackgroundColor: "#FFF",

    primaryCategory: "social",
    tags: ["events", "community", "meetups"],
    subtitle: "One-tap event signup",
    description: "Create events and manage registrations onchain with Raduno. Register with one tap, your wallet is your ticket.",
    tagline: "One-tap event signup",

    heroImageUrl: `${ROOT_URL}/icon.png`,
    // TODO
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],

    ogTitle: "Raduno",
    ogDescription: "Create events onchain with Raduno. Register with one tap, your wallet is your ticket.",

    ogImageUrl: `${ROOT_URL}/icon-og.png`
  }
} as const;
