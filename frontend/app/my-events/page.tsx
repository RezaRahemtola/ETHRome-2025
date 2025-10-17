"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  image: string;
}

// Mock data
const mockRegisteredEvents: Event[] = [
  {
    id: "2",
    title: "NFT Art Exhibition",
    date: "2025-11-20",
    time: "19:00",
    location: "Milan, Italy",
    attendees: 28,
    image: "🎨"
  }
];

const mockHostedEvents: Event[] = [];

export default function MyEventsPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { isConnected } = useAccount();
  const router = useRouter();
  const [tab, setTab] = useState<"registered" | "hosted">("registered");
  const [registeredEvents] = useState<Event[]>(mockRegisteredEvents);
  const [hostedEvents] = useState<Event[]>(mockHostedEvents);

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const events = tab === "registered" ? registeredEvents : hostedEvents;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 safe-top">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">My Events</h1>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab("registered")}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === "registered"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Registered ({registeredEvents.length})
            </button>
            <button
              onClick={() => setTab("hosted")}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === "hosted"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Hosting ({hostedEvents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="px-6 py-4 pb-nav space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <button
              key={event.id}
              onClick={() => router.push(`/events/${event.id}`)}
              className="w-full bg-card rounded-2xl p-4 border border-border hover:border-primary/50 transition-all active:scale-[0.98] text-left"
            >
              <div className="flex gap-4">
                {/* Event Icon */}
                <div
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-3xl flex-shrink-0">
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
                  <div className="text-xs text-muted-foreground">
                    📍 {event.location}
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
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {tab === "registered" ? "🎟️" : "🎪"}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {tab === "registered" ? "No registered events" : "No hosted events"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {tab === "registered"
                ? "Browse events and register to see them here"
                : "Create your first event to get started"}
            </p>
            <button
              onClick={() => router.push(tab === "registered" ? "/events" : "/create")}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium"
            >
              {tab === "registered" ? "Browse Events" : "Create Event"}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
