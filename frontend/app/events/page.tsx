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

export default function EventsPage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { isConnected } = useAccount();
  const router = useRouter();
  const [events] = useState<Event[]>(mockEvents);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

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

  const getAvailabilityColor = (attendees: number, max: number) => {
    const percentage = (attendees / max) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-secondary";
    return "text-primary";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 safe-top">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Discover</h1>
              <p className="text-sm text-muted-foreground">Find your next experience</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {(["all", "upcoming", "past"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="px-6 py-4 pb-nav">
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
              maxAttendees={event.maxAttendees}
              image={event.image}
            />
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-4xl">
              📅
            </div>
            <h3 className="text-xl font-bold mb-2">No events found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Be the first to create an event and start building your community!
            </p>
            <button
              onClick={() => router.push("/create")}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
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
