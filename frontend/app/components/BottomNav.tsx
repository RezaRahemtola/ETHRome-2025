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
    <nav
      className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
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
                    cursor-pointer relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition-all duration-200 min-w-[60px]
                    ${isActive
                    ? "bg-purple-100"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                  }
                  `}
                >
                  {/* Icon */}
                  <div className={`relative z-10 transition-all duration-200`}>
                    <Icon
                      className={`h-6 w-6 ${isActive ? "text-purple-600" : ""}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  {/* Label */}
                  <span className={`relative z-10 text-xs transition-all duration-200 whitespace-nowrap ${
                    isActive ? "font-bold text-purple-600" : "font-medium"
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
