"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft } from "lucide-react";
import { CONSTRUCTOR_ARGS, CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { getAddress } from "viem";

export default function CreateEventPage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { isConnected } = useAccount();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    maxAttendees: "",
    category: "meetup",
    coverImage: null as File | null,
    ipfsHash: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEventAddress, setCreatedEventAddress] = useState<string | null>(null);

  // Contract write hook
  const {
    writeContract,
    data: hash,
    isPending: isCreating,
    isError: isCreateError,
    error: createError
  } = useWriteContract();

  // Wait for transaction to be confirmed
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash
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
      router.push("/");
    }
  }, [isConnected, router]);

  // Handle successful transaction and extract event address from logs
  useEffect(() => {
    const extractEventAddress = async () => {
      if (isConfirmed && receipt) {
        try {
          console.log("Event created! Checking receipt for EventCreated event...");
          console.log(receipt);

          // The createEvent function returns an address and emits an EventCreated event
          // We can extract the event address from the logs
          if (receipt.logs && receipt.logs.length > 0) {
            // Look for EventCreated event (first indexed parameter is the eventAddress)
            const eventCreatedLog = receipt.logs.find(log =>
              log.topics[0] === "0xa54c7891edaa21526f9ad14c69ae2fd966ac0969fcd9a990a4e006427afd382e"
            );

            if (eventCreatedLog && eventCreatedLog.topics[1]) {
              // The first indexed parameter (eventAddress) is in topics[1]
              // Convert from bytes32 to address (remove padding)
              const paddedAddress = eventCreatedLog.topics[1];
              const addr = getAddress("0x" + paddedAddress.slice(-40));
              console.log("Created event address:", addr);
              setCreatedEventAddress(addr);
              setIsSubmitting(false);

              // Redirect to events page after successful creation
              setTimeout(() => router.push("/events"), 2000);
              return;
            }
          }

          console.log("Event address not found in receipt logs");
          setIsSubmitting(false);
        } catch (error) {
          console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
          setIsSubmitting(false);
        }
      }
    };

    extractEventAddress();
  }, [isConfirmed, receipt, router]);

  // Handle errors
  useEffect(() => {
    if (isCreateError) {
      setIsSubmitting(false);
    }
  }, [isCreateError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("Creating event:", formData);
    console.log("Creator FID:", context?.user?.fid);

    try {
      // Call the createEvent method on the smart contract
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "createEvent",
        args: CONSTRUCTOR_ARGS
      });
    } catch (error) {
      console.error("Create event error:", error);
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        coverImage: file
      });
    }
  };

  const categories = [
    { value: "meetup", label: "Meetup", icon: "👥" },
    { value: "workshop", label: "Workshop", icon: "🛠️" },
    { value: "conference", label: "Conference", icon: "🎤" },
    { value: "social", label: "Social", icon: "🎉" },
    { value: "hackathon", label: "Hackathon", icon: "⚡" },
    { value: "other", label: "Other", icon: "📌" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 gradient-mesh opacity-30 -z-10" />

      {/* Header with glass morphism */}
      <div className="sticky top-0 glass border-b border-border/50 z-10 safe-top">
        <div className="px-6 py-5 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2 hover:bg-muted/70"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gradient">Create Event</h1>
            <p className="text-xs text-muted-foreground">Share your event with the community</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 pb-nav space-y-8">
        {/* Event Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-semibold text-foreground">
            Event Title <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Web3 Developers Meetup"
            className="h-12 text-base"
            required
          />
          <p className="text-xs text-muted-foreground">Make it clear and compelling</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-semibold text-foreground">
            Description <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What's your event about? Who should attend? What will they learn or experience?"
            rows={5}
            className="text-base resize-none"
            required
          />
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Category */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-foreground">
            Category <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`group p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                  formData.category === cat.value
                    ? "border-0 gradient-primary-secondary shadow-lg text-white"
                    : "border-border/50 glass-card hover:border-primary/30"
                }`}
              >
                <div className={`text-3xl mb-1.5 transition-transform duration-300 ${
                  formData.category === cat.value ? "scale-110" : "group-hover:scale-110"
                }`}>{cat.icon}</div>
                <div className={`text-xs font-semibold ${
                  formData.category === cat.value ? "text-white" : "text-foreground"
                }`}>{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Date and Time */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-foreground">
            When <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="date" className="block text-xs text-muted-foreground">
                Date
              </label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="time" className="block text-xs text-muted-foreground">
                Time
              </label>
              <Input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="h-12"
                required
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-semibold text-foreground">
            Location <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <Input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Rome, Italy or Virtual"
              className="h-12 pl-12 text-base"
              required
            />
          </div>
        </div>

        {/* Advanced Options */}
        <Accordion type="single" collapsible className="glass-card rounded-2xl px-6 border border-border/50">
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
              Advanced Options
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-2">
              {/* Capacity */}
              <div className="space-y-2">
                <label htmlFor="maxAttendees" className="block text-sm font-semibold text-foreground">
                  Capacity
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <Input
                    type="number"
                    id="maxAttendees"
                    name="maxAttendees"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    placeholder="100"
                    className="h-12 pl-12 text-base"
                    min={1}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Maximum number of attendees (optional)</p>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label htmlFor="coverImage" className="block text-sm font-semibold text-foreground">
                  Cover Image
                </label>
                <div className="relative">
                  <Input
                    type="file"
                    id="coverImage"
                    name="coverImage"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="h-12 text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.coverImage ? `Selected: ${formData.coverImage.name}` : "Upload a cover image for your event (optional)"}
                </p>
              </div>

              {/* IPFS Hash */}
              <div className="space-y-2">
                <label htmlFor="ipfsHash" className="block text-sm font-semibold text-foreground">
                  Website IPFS Hash
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    id="ipfsHash"
                    name="ipfsHash"
                    value={formData.ipfsHash}
                    onChange={handleChange}
                    placeholder="e.g., QmX7..."
                    className="h-12 pl-12 text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground">IPFS hash for event website (optional)</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Transaction Status */}
        {hash && (
          <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-3">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Transaction Hash:</div>
              <div className="text-xs font-mono break-all">{hash}</div>
            </div>

            {isConfirming && (
              <div className="text-sm text-primary animate-pulse">
                ⏳ Waiting for confirmation...
              </div>
            )}

            {isConfirmed && createdEventAddress && (
              <div className="space-y-3">
                <div className="text-sm text-green-500 font-semibold">
                  ✓ Event created successfully!
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Event Contract Address:</div>
                  <div className="text-xs font-mono break-all bg-background/50 p-3 rounded-lg border border-primary/20">
                    {createdEventAddress}
                  </div>
                  <a
                    href={`https://basescan.org/address/${createdEventAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-xs text-primary hover:underline inline-block"
                  >
                    View on Basescan →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {isCreateError && createError && (
          <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
            <div className="text-sm text-destructive font-semibold mb-2">Transaction Failed</div>
            <div className="text-xs text-destructive/80">{createError.message}</div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6 space-y-3">
          <Button
            type="submit"
            disabled={isSubmitting || isCreating || isConfirming}
            size="lg"
            className="w-full text-base font-bold h-16 rounded-2xl gradient-primary-secondary border-0 shadow-xl shadow-primary/30 transition-all duration-300 text-white hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                     viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Waiting for Approval...
              </span>
            ) : isConfirming ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none"
                     viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Event...
              </span>
            ) : (
              "Create Event ✨"
            )}
          </Button>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
