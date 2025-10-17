"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

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
    category: "meetup"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Integrate with smart contract to create event
    console.log("Creating event:", formData);
    console.log("Creator FID:", context?.user?.fid);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    router.push("/events");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 safe-top">
        <div className="px-6 py-5 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="-ml-2 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Event</h1>
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
                className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
                  formData.category === cat.value
                    ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <div className="text-3xl mb-1.5">{cat.icon}</div>
                <div className="text-xs font-semibold">{cat.label}</div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

        {/* Max Attendees */}
        <div className="space-y-2">
          <label htmlFor="maxAttendees" className="block text-sm font-semibold text-foreground">
            Capacity <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">Maximum number of attendees</p>
        </div>

        {/* Submit Button */}
        <div className="pt-6 space-y-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="w-full text-base font-bold h-14 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Event...
              </span>
            ) : (
              "Create Event"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By creating an event, you agree to our community guidelines
          </p>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
