"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  House,
  Briefcase,
  FileText,
  Robot,
  Envelope,
} from "@phosphor-icons/react";

const navItems = [
  { href: "/", icon: House, label: "Home" },
  { href: "/applications", icon: Briefcase, label: "Apps" },
  { href: "/resumes", icon: FileText, label: "Resumes" },
  { href: "/agent", icon: Robot, label: "Agent" },
  { href: "/emails", icon: Envelope, label: "Emails" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/80 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 h-full pt-1 pb-1 transition-smooth",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300",
                isActive ? "bg-primary/15 px-4 py-1" : "px-0 py-1"
              )}
            >
              <item.icon
                size={22}
                weight={isActive ? "fill" : "regular"}
                className="transition-smooth"
              />
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-all",
              isActive ? "font-bold text-primary" : "opacity-80"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
