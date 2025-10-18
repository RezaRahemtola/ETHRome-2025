"use client";
import { useEffect, useState } from "react";
import { useComposeCast, useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useReadContract } from "wagmi";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Share2 } from "lucide-react";
import { type EventData, fetchEventByAddress } from "@/lib/events";
import { toast } from "sonner";
import { CONTRACT_ABI as FACTORY_ABI, CONTRACT_ADDRESS as FACTORY_ADDRESS } from "@/lib/contracts/factory";
import { CONTRACT_ABI as EVENT_ABI } from "@/lib/contracts/event";
import { base } from "wagmi/chains";
import { createPublicClient, encodeFunctionData, http } from "viem";
import type { TransactionError, TransactionResponseType } from "@coinbase/onchainkit/transaction";
import { Transaction, TransactionButton } from "@coinbase/onchainkit/transaction";

interface Event extends Omit<EventData, "description"> {
  description: string;
  isRegistered: boolean;
  isHost: boolean;
}

export default function EventDetailPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address } = useAccount();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [eventContractAddress, setEventContractAddress] = useState<`0x${string}` | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { composeCastAsync } = useComposeCast();

  // Get all deployed event addresses from factory
  const { data: eventAddresses } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getDeployedEvents",
    chainId: base.id
  });

  // Fetch event data by finding the contract address with matching label
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventAddresses || eventAddresses.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org")
        });

        // Find the event contract with the matching label
        let eventAddress: `0x${string}` | null = null;
        for (const addr of eventAddresses as `0x${string}`[]) {
          const label = await publicClient.readContract({
            address: addr,
            abi: EVENT_ABI,
            functionName: "label"
          }) as string;

          if (label === eventId) {
            eventAddress = addr;
            break;
          }
        }

        if (!eventAddress) {
          console.error("Event not found:", eventId);
          setIsLoading(false);
          return;
        }

        // Fetch complete event data including capacity and participant count
        const eventData = await fetchEventByAddress(eventAddress);
        if (eventData) {
          // Check if user is registered and if user is the owner
          let isRegistered = false;
          let isHost = false;
          if (address) {
            try {
              const [participantStatus, contractOwner] = await Promise.all([
                publicClient.readContract({
                  address: eventAddress,
                  abi: EVENT_ABI,
                  functionName: "isParticipant",
                  args: [address]
                }) as Promise<boolean>,
                publicClient.readContract({
                  address: eventAddress,
                  abi: EVENT_ABI,
                  functionName: "owner"
                }) as Promise<`0x${string}`>
              ]);

              isRegistered = participantStatus;
              isHost = contractOwner.toLowerCase() === address.toLowerCase();
            } catch (error) {
              console.error("Error checking registration/ownership status:", error);
            }
          }

          setEventContractAddress(eventAddress);
          setEvent({
            ...eventData,
            description: eventData.description || "No description available",
            isRegistered,
            isHost
          });
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [eventId, eventAddresses, address]);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Reset modal state when component unmounts or registration status changes
  useEffect(() => {
    return () => {
      setShowSuccessModal(false);
    };
  }, []);

  // Close modal if user navigates or registration status changes unexpectedly
  useEffect(() => {
    if (event && !event.isRegistered && showSuccessModal) {
      setShowSuccessModal(false);
    }
  }, [event, showSuccessModal]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const handleRegisterSuccess = async (response: TransactionResponseType) => {
    console.log("Registration successful:", response);

    // Guard: Only proceed if currently not registered
    if (event?.isRegistered) {
      console.warn("Register handler called but already registered, ignoring");
      return;
    }

    // Reload event data to get updated registration status
    if (eventContractAddress && address) {
      try {
        const publicClient = createPublicClient({
          chain: base,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org")
        });

        const [isRegistered, participantCount] = await Promise.all([
          publicClient.readContract({
            address: eventContractAddress,
            abi: EVENT_ABI,
            functionName: "isParticipant",
            args: [address]
          }) as Promise<boolean>,
          publicClient.readContract({
            address: eventContractAddress,
            abi: EVENT_ABI,
            functionName: "getParticipantCount"
          }) as Promise<bigint>
        ]);

        setEvent(prev => prev ? {
          ...prev,
          isRegistered,
          attendees: Number(participantCount)
        } : null);

        // Show success modal instead of auto-casting
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Error refreshing event data:", error);
      }
    }
  };

  const handleShareOnFeed = async () => {
    if (!event) return;

    setIsSharing(true);
    setShowSuccessModal(false);

    try {
      const castText = `Just registered for ${event.title}! 🎉\n\n${event.description.slice(0, 100)}...\n\n📅 ${formatDate(event.date)} at ${event.time}\n📍 ${event.location}\n\nJoin us on Raduno!`;
      const eventUrl = `${process.env.NEXT_PUBLIC_URL || "https://raduno.vercel.app"}/events/${eventId}`;

      const result = await composeCastAsync({
        text: castText,
        embeds: [eventUrl]
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      }
    } catch (error) {
      console.error("Error composing cast:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnregisterSuccess = async (response: TransactionResponseType) => {
    console.log("Unregistration successful:", response);

    // Guard: Only proceed if currently registered
    if (!event?.isRegistered) {
      console.warn("Unregister handler called but not registered, ignoring");
      return;
    }

    // Show success toast and redirect
    toast.success("Successfully unregistered", {
      description: "You have been removed from this event."
    });

    // Redirect to events page
    router.push("/events");
  };

  const handleError = (error: TransactionError) => {
    console.error("Transaction failed:", error);
  };

  const handleShare = async () => {
    if (!event) return;

    setIsSharing(true);

    try {
      // Compose a cast to share the event
      const castText = `Check out this event: ${event.title}!\n\n📅 ${formatDate(event.date)} at ${event.time}\n📍 ${event.location}\n👥 ${event.attendees} attendees already!\n\nDiscover more events on Raduno 🚀`;

      const eventUrl = `${process.env.NEXT_PUBLIC_URL || "https://raduno.vercel.app"}/events/${eventId}`;
      const result = await composeCastAsync({
        text: castText,
        embeds: [eventUrl]
      });

      if (result?.cast) {
        console.log("Cast shared successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the share");
      }
    } catch (error) {
      console.error("Error sharing event:", error);
    } finally {
      setIsSharing(false);
    }
  };

  // Show loading state while fetching data
  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 gradient-mesh opacity-30 -z-10" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  const availabilityPercentage = event.maxAttendees > 0 ? (event.attendees / event.maxAttendees) * 100 : 0;
  const isFull = event.maxAttendees > 0 && availabilityPercentage >= 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 gradient-mesh opacity-30 -z-10" />

      {/* Hero Image Section */}
      <div className="relative h-80 overflow-hidden">
        {/* Gradient hero */}
        <div className="absolute inset-0 gradient-mesh opacity-60">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        {/* Back and Share buttons overlay with glass effect */}
        <div className="absolute top-0 left-0 right-0 safe-top z-10">
          <div className="px-4 py-4 flex justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="glass hover:bg-background/90 shadow-lg border border-border/30"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              disabled={isSharing}
              className="glass hover:bg-background/90 shadow-lg border border-border/30"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Event icon centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="text-9xl drop-shadow-2xl">
              {event.image}
            </div>
            <div
              className="absolute -inset-12 bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl rounded-full -z-10" />
          </div>
        </div>

        {/* Attendance badge with glass effect */}
        <div className="absolute bottom-6 right-6">
          <div className="px-4 py-2.5 rounded-full glass border border-border/50 shadow-xl">
            <span className="text-sm font-bold text-gradient">
              {event.maxAttendees === 0
                ? `${event.attendees} attending`
                : `${event.attendees}/${event.maxAttendees} attending`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-6 space-y-6">
        {/* Title and Host */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="inline-block px-4 py-1.5 rounded-full gradient-primary-secondary text-white text-xs font-bold shadow-md">
              {event.category.toUpperCase()}
            </div>
            {event.isHost && (
              <div
                className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold shadow-md">
                YOUR EVENT
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold leading-tight text-gradient">{event.title}</h1>
          <p className="text-base text-muted-foreground">
            Hosted by <span className="font-semibold text-foreground">{event.isHost ? "You" : event.host}</span>
          </p>
        </div>

        {/* Registration Status Banner */}
        {event.isRegistered && (
          <div className="glass-card gradient-primary-secondary rounded-2xl p-5 shadow-xl border-0">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0">
                ✅
              </div>
              <div>
                <div className="font-bold text-lg">You&#39;re registered!</div>
                <div className="text-sm">We&#39;ll see you there</div>
              </div>
            </div>
          </div>
        )}

        {/* Key Details Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="group flex items-start gap-4 p-5 rounded-2xl glass-card hover-lift">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl gradient-primary-secondary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div
                className="absolute -inset-1 rounded-xl gradient-primary-secondary opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300 -z-10" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Date & Time
              </div>
              <div className="font-bold text-foreground text-lg">{formatDate(event.date)}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{event.time}</div>
            </div>
          </div>

          <div className="group flex items-start gap-4 p-5 rounded-2xl glass-card hover-lift">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl gradient-primary-secondary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div
                className="absolute -inset-1 rounded-xl gradient-primary-secondary opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300 -z-10" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Location</div>
              <div className="font-bold text-foreground text-lg">{event.location}</div>
            </div>
          </div>

          <div className="group flex items-start gap-4 p-5 rounded-2xl glass-card hover-lift">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl gradient-primary-secondary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div
                className="absolute -inset-1 rounded-xl gradient-primary-secondary opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300 -z-10" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {event.maxAttendees === 0 ? "Attendees" : "Capacity"}
              </div>
              <div className="font-bold text-foreground text-lg">
                {event.maxAttendees === 0
                  ? `${event.attendees} registered`
                  : `${event.attendees} / ${event.maxAttendees} registered`
                }
              </div>
              {event.maxAttendees > 0 && (
                <div className="w-full bg-border/50 rounded-full h-3 mt-3 overflow-hidden shadow-inner">
                  <div
                    className={`rounded-full h-3 transition-all duration-500 ${
                      availabilityPercentage >= 90 ? "bg-destructive" :
                        availabilityPercentage >= 70 ? "bg-warning" :
                          "gradient-primary-secondary"
                    }`}
                    style={{ width: `${Math.min(availabilityPercentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-2">
          <h2 className="text-2xl font-bold mb-4">About this event</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            {event.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 pb-8 space-y-4">
          {eventContractAddress && (
            <>
              {event.isHost && (
                <div className="glass-card rounded-2xl p-5 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-lg font-bold mb-1">You&#39;re hosting this event!</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your event and see who&#39;s registered
                  </p>
                </div>
              )}

              {(!event.isHost || process.env.NEXT_PUBLIC_APP_ENV === "dev") && (
                event.isRegistered ? (
                  <Transaction
                    key="unregister-transaction"
                    calls={[{
                      to: eventContractAddress,
                      data: encodeFunctionData({
                        abi: EVENT_ABI,
                        functionName: "unregister"
                      }),
                      value: BigInt(0)
                    }]}
                    onSuccess={handleUnregisterSuccess}
                    onError={handleError}
                    capabilities={{
                      paymasterService: {
                        url: process.env.NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT!
                      }
                    }}
                  >
                    <TransactionButton
                      className="w-full text-base font-bold h-16 rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      text="Unregister from Event"
                    />
                  </Transaction>
                ) : (
                  <Transaction
                    key="register-transaction"
                    calls={[{
                      to: eventContractAddress,
                      data: encodeFunctionData({
                        abi: EVENT_ABI,
                        functionName: "register"
                      }),
                      value: BigInt(0)
                    }]}
                    onSuccess={handleRegisterSuccess}
                    onError={handleError}
                    capabilities={{
                      paymasterService: {
                        url: process.env.NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT!
                      }
                    }}
                  >
                    <TransactionButton
                      className="w-full text-base font-bold h-12 rounded-xl gradient-primary-secondary border-0 shadow-xl shadow-primary/30 transition-all duration-300 text-white hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      text={isFull ? "Event is full" : "Register for Event ✨"}
                      disabled={isFull}
                    />
                  </Transaction>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent
          className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] rounded-3xl p-0 gap-0 border-0 shadow-2xl overflow-hidden gradient-primary-secondary">
          {/* Gradient header background */}
          <div className="relative p-8 pb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="relative text-center">
              <div className="mx-auto mb-4 text-6xl">🎉</div>
              <DialogTitle className="text-center text-3xl font-bold text-white mb-2">
                You&apos;re Registered!
              </DialogTitle>
              <DialogDescription className="text-center text-base text-white/90">
                We&apos;re excited to see you at
              </DialogDescription>
              <div className="text-center text-lg font-bold text-white mt-1">
                {event?.title}
              </div>
            </div>
          </div>

          {/* Buttons section */}
          <div className="p-6 space-y-3">
            <Button
              onClick={handleShareOnFeed}
              disabled={isSharing}
              className="w-full h-14 text-base font-bold bg-white text-primary hover:bg-white/90 border-0 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all rounded-xl"
            >
              {isSharing ? "Sharing..." : "Share on Feed 📢"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/events");
              }}
              className="w-full h-14 text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 rounded-xl transition-all"
            >
              Browse Other Events
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
