"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WelcomePage() {
  const router = useRouter();

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
    <div className="min-h-screen flex flex-col bg-background safe-bottom">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl shadow-lg">
              🎪
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              Raduno
            </h1>
            <p className="text-lg text-muted-foreground">
              The decentralized event platform
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 gap-4 pt-4">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-left hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0 mt-1">
                      {benefit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-card-foreground mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button - Fixed at bottom */}
      <div className="sticky bottom-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          size="lg"
          onClick={() => router.push("/events")}
          className="w-full text-base font-semibold shadow-lg"
        >
          Get Started
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Powered by Base
        </p>
      </div>
    </div>
  );
}
