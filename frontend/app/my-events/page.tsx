"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import EventCard from "../components/EventCard";

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

  const events = tab === "registered" ? registeredEvents : hostedEvents;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 safe-top">
        <div className="px-6 py-5">
          <h1 className="text-3xl font-bold mb-4">My Events</h1>

          {/* Tabs */}
          <div className="flex gap-2 bg-muted rounded-xl p-1">
            <button
              onClick={() => setTab("registered")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "registered"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registered
              <span className={`ml-1.5 text-xs ${tab === "registered" ? "text-primary" : "text-muted-foreground"}`}>
                {registeredEvents.length}
              </span>
            </button>
            <button
              onClick={() => setTab("hosted")}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === "hosted"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hosting
              <span className={`ml-1.5 text-xs ${tab === "hosted" ? "text-primary" : "text-muted-foreground"}`}>
                {hostedEvents.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="px-6 py-6 pb-nav">
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                date={event.date}
                time={event.time}
                location={event.location}
                attendees={event.attendees}
                image={event.image}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-muted flex items-center justify-center text-4xl">
              {tab === "registered" ? "🎟️" : "🎪"}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {tab === "registered" ? "No registered events" : "No hosted events"}
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              {tab === "registered"
                ? "Discover amazing events and register to see them here"
                : "Share your passion by creating your first event"}
            </p>
            <button
              onClick={() => router.push(tab === "registered" ? "/events" : "/create")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
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
