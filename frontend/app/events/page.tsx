"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import EventCard from "../components/EventCard";
import { useReadContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contracts/factory";
import { base } from "wagmi/chains";
import { fetchEventsByAddresses, type EventData } from "@/lib/events";
import { Button } from "@/components/ui/button";

export default function EventsPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [isLoading, setIsLoading] = useState(true);

  // Get all deployed event addresses from factory
  const { data: eventAddresses, isLoading: isLoadingAddresses } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: "getDeployedEvents",
    chainId: base.id
  });

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Fetch event details when addresses are loaded
  useEffect(() => {
    const loadEvents = async () => {
      // Wait for contract call to complete before showing "no events"
      if (isLoadingAddresses) {
        return;
      }

      if (!eventAddresses || eventAddresses.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const eventDetails = await fetchEventsByAddresses(eventAddresses as `0x${string}`[]);
        setEvents(eventDetails);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [eventAddresses, isLoadingAddresses]);

  // Filter events based on the selected filter
  useEffect(() => {
    if (events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    let filtered = events;

    if (filter === "upcoming") {
      filtered = events.filter(event => {
        // Parse the date from the event
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
      });
    } else if (filter === "past") {
      filtered = events.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate < now;
      });
    }

    setFilteredEvents(filtered);
  }, [events, filter]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 -z-10" />

      {/* Header with glass morphism */}
      <div className="sticky top-0 glass border-b border-border/50 z-10 safe-top">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-1 text-gradient">Discover</h1>
              <p className="text-sm text-muted-foreground">Find your next experience</p>
            </div>
          </div>

          {/* Filter Pills with gradient active state */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {(["all", "upcoming", "past"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === f
                    ? "gradient-primary-secondary text-white shadow-lg shadow-primary/30"
                    : "glass-card text-muted-foreground hover:bg-muted/70"
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
        {(isLoading || isLoadingAddresses) ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredEvents.map((event) => (
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

            {filteredEvents.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-4xl">
                  📅
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {events.length === 0 ? "No events found" : `No ${filter} events`}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {events.length === 0
                    ? "Be the first to create an event and start building your community!"
                    : `There are no ${filter} events at the moment. Check other filters!`
                  }
                </p>
                {events.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/create")}
                    className="px-6 py-3 h-auto"
                  >
                    Create Event
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
