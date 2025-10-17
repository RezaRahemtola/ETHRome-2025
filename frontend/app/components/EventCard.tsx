"use client";
import { useRouter } from "next/navigation";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees?: number;
  image: string;
}

export default function EventCard({
  id,
  title,
  date,
  time,
  location,
  attendees,
  maxAttendees,
  image,
}: EventCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getAvailabilityColor = (current: number, max: number | undefined) => {
    if (!max) return "text-primary";
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 70) return "text-secondary";
    return "text-primary";
  };

  const gradients = [
    "from-primary to-accent",
    "from-accent to-secondary",
    "from-secondary to-primary",
  ];

  // Use the id to consistently pick a gradient for each event
  const gradientIndex = parseInt(id) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <button
      onClick={() => router.push(`/events/${id}`)}
      className="group w-full glass-card rounded-2xl p-4 border border-border/50 hover-lift transition-all active:scale-[0.98] text-left hover:border-primary/50 relative overflow-hidden"
    >
      {/* Gradient accent line on hover */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="flex gap-4">
        {/* Event Icon with gradient background */}
        <div className="relative">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
            {image}
          </div>
          <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300 -z-10`} />
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-card-foreground mb-1.5 truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <span className="inline-block">📅</span>
            <span>{formatDate(date)} • {time}</span>
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground truncate flex items-center gap-1.5">
              <span className="inline-block">📍</span>
              <span>{location}</span>
            </span>
            {maxAttendees && (
              <span className={`font-semibold px-2 py-1 rounded-lg ${getAvailabilityColor(attendees, maxAttendees)} bg-current/10`}>
                {attendees}/{maxAttendees}
              </span>
            )}
          </div>
        </div>

        {/* Arrow with animated slide */}
        <div className="flex items-center text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1 duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
