"use client";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function ProfilePage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Redirect if wallet not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  const stats = [
    { label: "Events Attended", value: 12 },
    { label: "Events Hosted", value: 3 },
    { label: "Network Size", value: 48 }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 safe-top">
        <div className="px-6 py-5">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="px-6 py-6 pb-nav space-y-6">
        {/* User Card with gradient background */}
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border border-border">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/50" />

          <div className="relative p-8">
            <div className="flex flex-col items-center text-center">
              {/* Avatar with enhanced styling */}
              {context?.user?.pfpUrl ? (
                <div className="relative mb-5">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-30 blur-xl rounded-full" />
                  <img
                    src={context.user.pfpUrl}
                    alt={context.user.displayName || "Profile"}
                    className="relative w-28 h-28 rounded-full object-cover border-4 border-background shadow-xl"
                  />
                </div>
              ) : (
                <div className="relative mb-5">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-20 blur-2xl rounded-full" />
                  <div
                    className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-primary/25">
                    {context?.user?.displayName?.[0] || "?"}
                  </div>
                </div>
              )}

              {/* Name */}
              <h2 className="text-3xl font-bold mb-2">
                {context?.user?.displayName || "Anonymous User"}
              </h2>

              {/* Username or Wallet Address */}
              {context?.user?.username ? (
                <p className="text-base text-muted-foreground font-medium mb-1">
                  @{context.user.username}
                </p>
              ) : null}

              {address && !context?.user?.username && (
                <div
                  className="inline-flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground font-mono font-semibold">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid with enhanced design */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-5 border border-border text-center hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="text-3xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-semibold leading-tight uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info Section */}

        {/* Footer */}
        <div className="text-center pt-6 space-y-2">
          <div className="text-xs text-muted-foreground font-medium">
            Raduno v1.0.0
          </div>
          <div className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-primary">Base</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
