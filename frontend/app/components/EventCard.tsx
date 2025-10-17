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

  return (
    <button
      onClick={() => router.push(`/events/${id}`)}
      className="w-full bg-card rounded-xl p-3 border border-border hover:border-primary/50 transition-all active:scale-[0.98] text-left"
    >
      <div className="flex gap-3">
        {/* Event Icon */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center text-2xl flex-shrink-0">
          {image}
        </div>

        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-card-foreground mb-1 truncate">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mb-1">
            {formatDate(date)} • {time}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground truncate">
              📍 {location}
            </span>
            {maxAttendees && (
              <span className={`font-medium ${getAvailabilityColor(attendees, maxAttendees)}`}>
                {attendees}/{maxAttendees}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-muted-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}
