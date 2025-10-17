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
    subtitle: "Decentralized event platform",
    description: "TODO",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["marketing", "ads", "quickstart", "waitlist"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`
  },
  baseBuilder: {
    ownerAddress: "0x0769259d160c3D185CEDbB5380fF99E032e8e58e"
  }
} as const;
