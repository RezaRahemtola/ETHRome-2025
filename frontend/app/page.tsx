"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import WelcomePage from "./components/WelcomePage";

const WELCOME_SEEN_KEY = "raduno_welcome_seen";

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { isConnected } = useAccount();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(true);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Check if we should skip the welcome page
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(WELCOME_SEEN_KEY) === "true";

    // Skip welcome page if user has seen it AND wallet is connected
    if (hasSeenWelcome && isConnected) {
      router.push("/events");
    } else {
      setShowWelcome(true);
    }
  }, [isConnected, router]);

  if (!showWelcome) {
    return null; // Render nothing while redirecting
  }

  return <WelcomePage />;
}
