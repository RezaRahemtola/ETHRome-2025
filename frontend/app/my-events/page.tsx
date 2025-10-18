"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import EventCard from "../components/EventCard";
import { Button } from "@/components/ui/button";
import { CONTRACT_ABI as FACTORY_ABI, CONTRACT_ADDRESS as FACTORY_ADDRESS } from "@/lib/contracts/factory";
import { CONTRACT_ABI as EVENT_ABI } from "@/lib/contracts/event";
import { base } from "wagmi/chains";
import { fetchEventsByAddresses, type EventData } from "@/lib/events";
import { toast } from "sonner";

export default function MyEventsPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const publicClient = usePublicClient();
  const [tab, setTab] = useState<"registered" | "hosted">("registered");
  const [registeredEvents, setRegisteredEvents] = useState<EventData[]>([]);
  const [hostedEvents, setHostedEvents] = useState<EventData[]>([]);
  const [isLoadingHosted, setIsLoadingHosted] = useState(true);
  const [isLoadingRegistered, setIsLoadingRegistered] = useState(true);

  // Get all deployed event addresses
  const { data: allEventAddresses, isLoading: isLoadingAddresses } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getDeployedEvents",
    chainId: base.id
  });

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Redirect if wallet not connected
  useEffect(() => {
    if (!isConnected) {
      toast.error("Authentication required", {
        description: "Please connect your wallet to view your events."
      });
      router.push("/");
    }
  }, [isConnected, router]);

  // Fetch hosted events (events where current user is the owner)
  useEffect(() => {
    const loadHostedEvents = async () => {
      if (!address || !publicClient || isLoadingAddresses) {
        return;
      }

      if (!allEventAddresses || allEventAddresses.length === 0) {
        setIsLoadingHosted(false);
        return;
      }

      try {
        // Check each event to see if the user is the owner
        const ownershipChecks = await Promise.all(
          (allEventAddresses as `0x${string}`[]).map(async (eventAddress) => {
            try {
              const contractOwner = await publicClient.readContract({
                address: eventAddress,
                abi: EVENT_ABI,
                functionName: "owner"
              }) as `0x${string}`;

              const isOwner = contractOwner.toLowerCase() === address.toLowerCase();
              return { eventAddress, isOwner };
            } catch (error) {
              console.error(`Error checking ownership for ${eventAddress}:`, error);
              return { eventAddress, isOwner: false };
            }
          })
        );

        const hostedAddresses = ownershipChecks
          .filter(check => check.isOwner)
          .map(check => check.eventAddress);

        console.log(`Found ${hostedAddresses.length} hosted events for ${address}`);

        if (hostedAddresses.length > 0) {
          const eventDetails = await fetchEventsByAddresses(hostedAddresses);
          setHostedEvents(eventDetails);
        } else {
          setHostedEvents([]);
        }
      } catch (error) {
        console.error("Error fetching hosted events:", error);
        setHostedEvents([]);
      } finally {
        setIsLoadingHosted(false);
      }
    };

    loadHostedEvents();
  }, [address, allEventAddresses, publicClient, isLoadingAddresses]);

  // Fetch registered events (events user has registered for)
  useEffect(() => {
    const loadRegisteredEvents = async () => {
      if (!address || !publicClient || isLoadingAddresses) {
        return;
      }

      if (!allEventAddresses || allEventAddresses.length === 0) {
        setIsLoadingRegistered(false);
        return;
      }

      try {
        // Check each event to see if the user is a participant
        const isParticipantChecks = await Promise.all(
          (allEventAddresses as `0x${string}`[]).map(async (eventAddress) => {
            try {
              const isParticipant = await publicClient.readContract({
                address: eventAddress,
                abi: EVENT_ABI,
                functionName: "isParticipant",
                args: [address]
              });
              return { eventAddress, isParticipant };
            } catch (error) {
              console.error(`Error checking participation for ${eventAddress}:`, error);
              return { eventAddress, isParticipant: false };
            }
          })
        );

        const registeredAddresses = isParticipantChecks
          .filter(check => check.isParticipant)
          .map(check => check.eventAddress);

        if (registeredAddresses.length > 0) {
          const eventDetails = await fetchEventsByAddresses(registeredAddresses);
          setRegisteredEvents(eventDetails);
        }
      } catch (error) {
        console.error("Error fetching registered events:", error);
      } finally {
        setIsLoadingRegistered(false);
      }
    };

    loadRegisteredEvents();
  }, [address, allEventAddresses, publicClient, isLoadingAddresses]);

  const events = tab === "registered" ? registeredEvents : hostedEvents;
  const isLoading = tab === "registered" ? isLoadingRegistered : isLoadingHosted;

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
              {!isLoadingRegistered && (
                <span className={`ml-1.5 text-xs ${tab === "registered" ? "text-primary" : "text-muted-foreground"}`}>
                  {registeredEvents.length}
                </span>
              )}
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
              {!isLoadingHosted && (
                <span className={`ml-1.5 text-xs ${tab === "hosted" ? "text-primary" : "text-muted-foreground"}`}>
                  {hostedEvents.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="px-6 py-6 pb-nav">
        {isLoading ? (
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
        ) : events.length > 0 ? (
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
            <Button
              variant="outline"
              onClick={() => router.push(tab === "registered" ? "/events" : "/create")}
              className="px-8 py-3 h-auto"
            >
              {tab === "registered" ? "Browse Events" : "Create Event"}
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
