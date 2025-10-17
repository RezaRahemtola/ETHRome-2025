"use client";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const handleGetStarted = () => {
    if (isConnected) {
      router.push("/events");
    }
  };

  const benefits = [
    {
      icon: "🎫",
      title: "Create Events Freely",
      description: "Launch your own events in minutes. No middlemen, just you and your community."
    },
    {
      icon: "🔐",
      title: "Secure & Transparent",
      description: "Every registration lives onchain. Verifiable, immutable, and trustworthy."
    },
    {
      icon: "⚡",
      title: "Instant Registration",
      description: "Register for events with one tap. Your wallet is your ticket."
    }
  ];

  return (
    <div className="flex flex-col bg-background safe-bottom overflow-hidden">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-3xl shadow-lg">
              🎪
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Raduno
            </h1>
            <p className="text-base text-muted-foreground">
              The decentralized event platform
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-left p-4 rounded-xl bg-card border border-border">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-card-foreground mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button - Fixed at bottom */}
      <div className="p-6 bg-background">
        <Button
          size="lg"
          onClick={handleGetStarted}
          disabled={!isConnected}
          className="w-full text-base font-semibold h-12 rounded-xl"
        >
          {isConnected ? "Get Started" : "Connect Wallet"}
        </Button>
      </div>
    </div>
  );
}
