"use client";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import WelcomePage from "./components/WelcomePage";

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return <WelcomePage />;
}
