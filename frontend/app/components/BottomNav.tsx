"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Plus, Ticket, User } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="max-w-screen-xl mx-auto pb-safe">
        <div className="flex items-center justify-around px-2 py-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1"
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`w-full flex flex-col items-center justify-center h-auto py-2 px-2 gap-1 ${
                    !isActive && "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
