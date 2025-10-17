"use client";
import { useEffect, useState } from "react";
import { useMiniKit, useQuickAuth, useComposeCast } from "@coinbase/onchainkit/minikit";
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

interface AuthResponse {
  success: boolean;
  user?: {
    fid: number;
  };
}

export default function EventDetailPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const router = useRouter();
  const [event, setEvent] = useState<Event>(mockEvent);
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: authData, isLoading: isAuthLoading } = useQuickAuth<AuthResponse>("/api/auth", { method: "GET" });
  const { composeCastAsync } = useComposeCast();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && (!authData || !authData.success)) {
      router.push("/");
    }
  }, [authData, isAuthLoading, router]);

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
    if (!authData?.success) {
      alert("Please authenticate to register for events");
      return;
    }

    setIsRegistering(true);

    try {
      // TODO: Integrate with smart contract to register for event
      console.log("Registering for event:", event.id);
      console.log("User FID:", authData.user?.fid);

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
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 safe-top">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Event Details</h1>
        </div>
      </div>

      {/* Event Hero */}
      <div className="px-6 py-6">
        <div className="w-full aspect-[16/9] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center text-8xl mb-6">
          {event.image}
        </div>

        {/* Event Info */}
        <div className="space-y-6">
          {/* Title and Host */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-muted-foreground">
              Hosted by <span className="font-medium text-foreground">{event.host}</span>
            </p>
          </div>

          {/* Key Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                📅
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Date & Time</div>
                <div className="font-medium">{formatDate(event.date)}</div>
                <div className="text-sm text-muted-foreground">{event.time}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                📍
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{event.location}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                👥
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Attendees</div>
                <div className="font-medium">
                  {event.attendees} / {event.maxAttendees} registered
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(availabilityPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-3">About this event</h2>
            <p className="text-muted-foreground leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Registration Status */}
          {event.isRegistered && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-semibold text-primary">You&apos;re registered!</div>
                  <div className="text-sm text-muted-foreground">See you at the event</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            {event.isRegistered ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={handleUnregister}
                disabled={isRegistering}
                className="w-full text-base font-semibold"
              >
                {isRegistering ? "Unregistering..." : "Unregister"}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleRegister}
                disabled={isRegistering || isFull}
                className="w-full text-base font-semibold"
              >
                {isRegistering ? "Registering..." : isFull ? "Event Full" : "Register for Event"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
