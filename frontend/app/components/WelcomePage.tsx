"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/events");
  };

  const benefits = [
    {
      icon: "🎫",
      title: "Create Events Freely",
      description: "Launch your own events in minutes.\nNo middlemen, just you and your community.",
      gradient: "from-primary to-accent"
    },
    {
      icon: "🔐",
      title: "Secure & Transparent",
      description: "Every registration lives onchain.\nVerifiable, immutable, and trustworthy.",
      gradient: "from-accent to-secondary"
    },
    {
      icon: "⚡",
      title: "Instant Registration",
      description: "Register for events with one tap.\nYour wallet is your ticket.",
      gradient: "from-secondary to-primary"
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-background safe-bottom overflow-hidden relative">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />

      {/* Content centered vertically */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Logo/Icon with gradient */}
          <div className="flex justify-center">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-primary/30 overflow-hidden">
                <Image
                  src="/icon.png"
                  alt="Raduno"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute -inset-1 rounded-2xl gradient-primary-secondary opacity-50 blur-xl -z-10" />
            </div>
          </div>

          {/* Title with gradient text */}
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gradient">
              Raduno
            </h1>
            <p className="text-base text-muted-foreground">
              The decentralized event platform
            </p>
          </div>

          {/* Benefits Grid with glass morphism */}
          <div className="grid grid-cols-1 gap-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group text-left p-4 rounded-xl glass-card hover-lift"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {benefit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-sm text-card-foreground mb-1 group-hover:text-primary transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="w-full text-base font-bold h-12 rounded-xl gradient-primary-secondary border-0 shadow-xl shadow-primary/30 transition-all duration-300 text-white hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02]"
            >
              Get Started ✨
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
