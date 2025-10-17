"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Plus, Ticket, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/events",
      label: "Events",
      icon: Calendar
    },
    {
      href: "/create",
      label: "Create",
      icon: Plus
    },
    {
      href: "/my-events",
      label: "My Events",
      icon: Ticket
    },
    {
      href: "/profile",
      label: "Profile",
      icon: User
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-screen-xl mx-auto safe-bottom">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex justify-center"
              >
                <button
                  className={`
                    flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]
                    ${isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground active:scale-95"
                    }
                  `}
                >
                  <div className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                    <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={`text-xs font-semibold transition-all ${
                    isActive ? "font-bold" : "font-medium"
                  }`}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
