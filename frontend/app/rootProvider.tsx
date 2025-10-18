"use client";
import { ReactNode } from "react";
import { base } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import "@coinbase/onchainkit/styles.css";
import { ThemeProvider } from "@/components/theme-provider";

export function RootProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <OnchainKitProvider
        apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        chain={base}
        rpcUrl={process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'}
        config={{
          appearance: {
            mode: "auto"
          },
          wallet: {
            display: "modal",
            preference: "all"
          },
          paymaster: process.env.NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT
        }}
        miniKit={{
          enabled: true,
          autoConnect: true,
          notificationProxyUrl: undefined
        }}
      >
        {children}
      </OnchainKitProvider>
    </ThemeProvider>
  );
}
