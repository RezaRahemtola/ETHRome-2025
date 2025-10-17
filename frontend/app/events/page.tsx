"use client";
import { useEffect, useState } from "react";
import { useMiniKit, useQuickAuth } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  image: string;
  host: string;
}

// Mock data - will be replaced with smart contract data
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Web3 Developers Meetup",
    date: "2025-11-15",
    time: "18:00",
    location: "Rome, Italy",
    attendees: 42,
    maxAttendees: 100,
    image: "🌐",
    host: "DevDAO"
  },
  {
    id: "2",
    title: "NFT Art Exhibition",
    date: "2025-11-20",
    time: "19:00",
    location: "Milan, Italy",
    attendees: 28,
    maxAttendees: 50,
    image: "🎨",
    host: "ArtChain"
  },
  {
    id: "3",
    title: "Blockchain Hackathon",
    date: "2025-11-25",
    time: "09:00",
    location: "Florence, Italy",
    attendees: 156,
    maxAttendees: 200,
    image: "⚡",
    host: "HackBase"
  }
];

interface AuthResponse {
  success: boolean;
  user?: {
    fid: number;
  };
}

export default function EventsPage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const router = useRouter();
  const [events] = useState<Event[]>(mockEvents);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  const { data: authData, isLoading: isAuthLoading } = useQuickAuth<AuthResponse>("/api/auth", { method: "GET" });

  // Initialize the miniapp and check auth
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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getAvailabilityColor = (attendees: number, max: number) => {
    const percentage = (attendees / max) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-secondary";
    return "text-primary";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 safe-top">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Events</h1>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-semibold text-white">
                {context?.user?.displayName?.[0] || "?"}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {(["all", "upcoming", "past"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="px-6 py-4 space-y-4">
        {events.map((event) => (
          <button
            key={event.id}
            onClick={() => router.push(`/events/${event.id}`)}
            className="w-full bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-all active:scale-[0.98] text-left"
          >
            <div className="flex gap-4">
              {/* Event Icon */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl flex-shrink-0">
                {event.image}
              </div>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-card-foreground mb-1 truncate">
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatDate(event.date)} • {event.time}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    📍 {event.location}
                  </span>
                  <span className={getAvailabilityColor(event.attendees, event.maxAttendees)}>
                    {event.attendees}/{event.maxAttendees} attending
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center text-muted-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}

        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to create an event!
            </p>
            <button
              onClick={() => router.push("/create")}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
            >
              Create Event
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
