"use client";
import { useEffect, useState } from "react";

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 100),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1600),
      setTimeout(() => setStep(4), 2400),
      setTimeout(() => {
        setStep(5);
        setTimeout(onComplete, 600);
      }, 3200),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-mesh-animated opacity-50" />

      {/* Main animation container */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Logo with scale animation */}
        <div
          className={`transition-all duration-700 ${
            step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl gradient-primary-secondary flex items-center justify-center text-5xl shadow-2xl">
              🎪
            </div>
            {step >= 2 && (
              <div className="absolute inset-0 rounded-3xl animate-pulse-glow" />
            )}
          </div>
        </div>

        {/* Brand name with fade in */}
        <div
          className={`transition-all duration-700 delay-200 ${
            step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-5xl font-bold text-gradient">
            Raduno
          </h1>
        </div>

        {/* Tagline with fade in */}
        <div
          className={`transition-all duration-700 delay-300 ${
            step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-lg text-muted-foreground">
            The decentralized event platform
          </p>
        </div>

        {/* Feature icons with staggered animation */}
        <div
          className={`flex gap-6 transition-all duration-700 delay-500 ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {['🎫', '🔐', '⚡'].map((icon, index) => (
            <div
              key={icon}
              className={`w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-3xl transition-all duration-500`}
              style={{
                transitionDelay: `${600 + index * 150}ms`,
                opacity: step >= 4 ? 1 : 0,
                transform: step >= 4 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)'
              }}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        {step < 5 && (
          <div className="mt-8">
            <div className="w-32 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary-secondary transition-all duration-300 ease-out"
                style={{
                  width: `${(step / 4) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fade out overlay */}
      <div
        className={`absolute inset-0 bg-background transition-opacity duration-500 ${
          step >= 5 ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
