"use client";
import { useEffect } from "react";
import { useMiniKit, useQuickAuth } from "@coinbase/onchainkit/minikit";
import BottomNav from "../components/BottomNav";

interface AuthResponse {
  success: boolean;
  user?: {
    fid: number;
  };
}

export default function ProfilePage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { data: authData } = useQuickAuth<AuthResponse>("/api/auth", { method: "GET" });

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const stats = [
    { label: "Events Attended", value: 12 },
    { label: "Events Hosted", value: 3 },
    { label: "Network Size", value: 48 }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 safe-top">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* User Info */}
        <div className="bg-card rounded-3xl p-6 border border-border">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white mb-4">
              {context?.user?.displayName?.[0] || "?"}
            </div>

            {/* Name */}
            <h2 className="text-2xl font-bold mb-1">
              {context?.user?.displayName || "Anonymous User"}
            </h2>

            {/* Username */}
            {context?.user?.username && (
              <p className="text-muted-foreground mb-3">
                @{context.user.username}
              </p>
            )}

            {/* FID */}
            {authData?.user?.fid && (
              <div className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
                FID: {authData.user.fid}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-4 border border-border text-center"
            >
              <div className="text-2xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          <button className="w-full bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-all active:scale-[0.98] text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                ⚙️
              </div>
              <span className="font-medium">Settings</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-all active:scale-[0.98] text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                📊
              </div>
              <span className="font-medium">Analytics</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-all active:scale-[0.98] text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                ❓
              </div>
              <span className="font-medium">Help & Support</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="w-full bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-all active:scale-[0.98] text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                ℹ️
              </div>
              <span className="font-medium">About Raduno</span>
            </div>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Version */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          Raduno v1.0.0 • Powered by Base
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
