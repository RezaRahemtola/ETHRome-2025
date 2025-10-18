"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft } from "lucide-react";
import { CONSTRUCTOR_ARGS, CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract";
import { encodeFunctionData } from "viem";
import type { TransactionError, TransactionResponseType } from "@coinbase/onchainkit/transaction";
import { Transaction, TransactionButton } from "@coinbase/onchainkit/transaction";

export default function CreateEventPage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
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
    ipfsHash: "",
    eventId: ""
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

  const handleSuccess = (response: TransactionResponseType) => {
    console.log("Event created successfully!", response);

    // Redirect to events page after successful creation
    setTimeout(() => router.push("/events"), 2000);
  };

  const handleError = (error: TransactionError) => {
    console.error("Create event error:", error);
  };

  // Encode the contract call for the Transaction component
  const calls = [
    {
      to: CONTRACT_ADDRESS as `0x${string}`,
      data: encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: "createEvent",
        args: CONSTRUCTOR_ARGS
      }),
      value: BigInt(0)
    }
  ];

  // Generate URL-friendly slug from title
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_]+/g, "-")  // Replace spaces and underscores with dashes
      .replace(/^-+|-+$/g, "");  // Remove leading/trailing dashes
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Auto-generate eventId from title, but allow manual override
    if (name === "title") {
      setFormData({
        ...formData,
        title: value,
        eventId: generateSlug(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
      <form className="px-6 py-6 pb-nav space-y-8">
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

              {/* Event ID */}
              <div className="space-y-2">
                <label htmlFor="eventId" className="block text-sm font-semibold text-foreground">
                  Event ID
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    id="eventId"
                    name="eventId"
                    value={formData.eventId}
                    onChange={handleChange}
                    placeholder="id"
                    className="h-12 pl-12 text-base font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ID auto-generated from title (can be customized)
                </p>
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

        {/* Transaction Component with Gas Sponsorship */}
        <div className="pt-6 space-y-3">
          <Transaction
            calls={calls}
            onSuccess={handleSuccess}
            onError={handleError}
            capabilities={{
              paymasterService: {
                url: process.env.NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT!
              }
            }}
          >
            <TransactionButton
              className="w-full text-base font-bold h-16 rounded-2xl gradient-primary-secondary border-0 shadow-xl shadow-primary/30 transition-all duration-300 text-white hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              text="Create Event ✨"
            />
          </Transaction>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
