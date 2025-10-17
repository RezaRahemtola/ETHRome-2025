"use client";
import { useEffect, useState } from "react";
import { useMiniKit, useComposeCast } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  image: string;
  host: string;
  hostFid: number;
  category: string;
  isRegistered: boolean;
}

// Mock data - will be replaced with smart contract data
const mockEvent: Event = {
  id: "1",
  title: "Web3 Developers Meetup",
  description: "Join us for an exciting evening of Web3 development discussions, networking, and hands-on workshops. Perfect for developers of all levels interested in blockchain technology and decentralized applications.",
  date: "2025-11-15",
  time: "18:00",
  location: "Rome, Italy",
  attendees: 42,
  maxAttendees: 100,
  image: "🌐",
  host: "DevDAO",
  hostFid: 12345,
  category: "meetup",
  isRegistered: false
};

export default function EventDetailPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [event, setEvent] = useState<Event>(mockEvent);
  const [isRegistering, setIsRegistering] = useState(false);

  const { composeCastAsync } = useComposeCast();

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handleRegister = async () => {
    if (!isConnected) {
      alert("Please connect your wallet to register for events");
      return;
    }

    setIsRegistering(true);

    try {
      // TODO: Integrate with smart contract to register for event
      console.log("Registering for event:", event.id);
      console.log("User address:", address);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEvent({
        ...event,
        isRegistered: true,
        attendees: event.attendees + 1
      });

      // Compose a cast to share the event registration
      const castText = `Just registered for ${event.title}! 🎉\n\n${event.description.slice(0, 100)}...\n\n📅 ${formatDate(event.date)} at ${event.time}\n📍 ${event.location}\n\nJoin us on Raduno!`;

      // Use OnchainKit's useComposeCast hook
      const result = await composeCastAsync({
        text: castText,
        embeds: [process.env.NEXT_PUBLIC_URL || ""]
      });

      // result.cast can be null if user cancels
      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error registering for event:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    setIsRegistering(true);

    // TODO: Integrate with smart contract to unregister from event
    console.log("Unregistering from event:", event.id);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setEvent({
      ...event,
      isRegistered: false,
      attendees: event.attendees - 1
    });

    setIsRegistering(false);
  };

  const availabilityPercentage = (event.attendees / event.maxAttendees) * 100;
  const isFull = availabilityPercentage >= 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image Section */}
      <div className="relative h-80">
        {/* Full-bleed gradient hero */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        {/* Back button overlay */}
        <div className="absolute top-0 left-0 right-0 safe-top z-10">
          <div className="px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="bg-background/80 backdrop-blur-md hover:bg-background/90 shadow-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Event icon centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-9xl drop-shadow-2xl animate-in zoom-in duration-300">
            {event.image}
          </div>
        </div>

        {/* Attendance badge */}
        <div className="absolute bottom-6 right-6">
          <div className="px-4 py-2 rounded-full bg-background/90 backdrop-blur-md border border-border shadow-lg">
            <span className="text-sm font-bold text-foreground">
              {event.attendees}/{event.maxAttendees} attending
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-6 space-y-6">
        {/* Title and Host */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            {event.category.toUpperCase()}
          </div>
          <h1 className="text-4xl font-bold leading-tight">{event.title}</h1>
          <p className="text-base text-muted-foreground">
            Hosted by <span className="font-semibold text-foreground">{event.host}</span>
          </p>
        </div>

        {/* Registration Status Banner */}
        {event.isRegistered && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
                ✅
              </div>
              <div>
                <div className="font-bold text-primary text-lg">You're registered!</div>
                <div className="text-sm text-muted-foreground">We'll see you there</div>
              </div>
            </div>
          </div>
        )}

        {/* Key Details Cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Date & Time</div>
              <div className="font-bold text-foreground">{formatDate(event.date)}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{event.time}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Location</div>
              <div className="font-bold text-foreground">{event.location}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Capacity</div>
              <div className="font-bold text-foreground">
                {event.attendees} / {event.maxAttendees} registered
              </div>
              <div className="w-full bg-border rounded-full h-2.5 mt-2.5">
                <div
                  className={`rounded-full h-2.5 transition-all ${
                    availabilityPercentage >= 90 ? 'bg-destructive' :
                    availabilityPercentage >= 70 ? 'bg-warning' :
                    'bg-primary'
                  }`}
                  style={{ width: `${Math.min(availabilityPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-2">
          <h2 className="text-xl font-bold mb-3">About this event</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            {event.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 pb-8">
          {event.isRegistered ? (
            <Button
              variant="destructive"
              size="lg"
              onClick={handleUnregister}
              disabled={isRegistering}
              className="w-full text-base font-bold h-14 rounded-xl shadow-lg"
            >
              {isRegistering ? "Unregistering..." : "Unregister from Event"}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleRegister}
              disabled={isRegistering || isFull}
              className="w-full text-base font-bold h-14 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isRegistering ? "Registering..." : isFull ? "Event is Full" : "Register for Event"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
