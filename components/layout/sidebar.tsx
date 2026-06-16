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
  GearSix,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", icon: House, label: "Dashboard" },
  { href: "/applications", icon: Briefcase, label: "Applications" },
  { href: "/resumes", icon: FileText, label: "Resumes" },
  { href: "/agent", icon: Robot, label: "Agent" },
  { href: "/emails", icon: Envelope, label: "Emails" },
];

const bottomItems = [
  { href: "/settings", icon: GearSix, label: "Settings" },
];

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
}

export function Sidebar({ className, isMobile }: SidebarProps = {}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative z-20 flex h-full flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[240px]",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary glow">
          <span className="text-sm font-bold text-primary-foreground">M</span>
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-foreground animate-fade-in">
            mime
          </span>
        )}
      </div>

      <Separator />

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "shrink-0 transition-smooth",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={linkContent} />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 p-3">
        <Separator className="mb-2" />
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className="shrink-0"
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={linkContent} />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </div>

      {/* Collapse toggle */}
      {!isMobile && (
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 rounded-full border border-border bg-background shadow-sm hover:bg-accent"
        >
          {collapsed ? <CaretRight size={12} /> : <CaretLeft size={12} />}
        </Button>
      )}
    </aside>
  );
}
