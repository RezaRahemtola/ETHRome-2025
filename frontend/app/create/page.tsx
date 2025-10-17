"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

export default function CreateEventPage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 safe-top">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Create Event</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
        {/* Event Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Event Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Web3 Developers Meetup"
            required
            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell attendees what your event is about..."
            rows={4}
            required
            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Category
          </label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`p-3 rounded-xl border-2 transition-all ${
                  formData.category === cat.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium mb-2">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-2">
              Time
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Rome, Italy"
            required
            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Max Attendees */}
        <div>
          <label htmlFor="maxAttendees" className="block text-sm font-medium mb-2">
            Maximum Attendees
          </label>
          <input
            type="number"
            id="maxAttendees"
            name="maxAttendees"
            value={formData.maxAttendees}
            onChange={handleChange}
            placeholder="100"
            min="1"
            required
            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold rounded-2xl py-4 px-6 transition-colors active:scale-[0.98] transform disabled:scale-100"
          >
            {isSubmitting ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
