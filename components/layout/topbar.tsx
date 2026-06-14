"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { MagnifyingGlass, Bell, SignOut, User, GearSix, Briefcase, FileText, Envelope, Trash, List } from "@phosphor-icons/react";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface TopbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "applications" | "resumes" | "emails">("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    applications: any[];
    resumes: any[];
    emails: any[];
  }>({ applications: [], resumes: [], emails: [] });

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const isTyping = 
        document.activeElement?.tagName === "INPUT" || 
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilter("all");
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ applications: [], resumes: [], emails: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background/50 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Mobile Sidebar Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="flex md:hidden shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <List size={22} />
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-[240px]">
            <Sidebar className="flex h-full w-[240px]" isMobile />
          </SheetContent>
        </Sheet>

        {/* Search Bar Trigger */}
        <div 
          onClick={() => setOpen(true)}
          className="relative w-full cursor-pointer select-none group"
        >
          <MagnifyingGlass
            size={20}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-foreground transition-colors"
          />
          <div className="w-full bg-accent/30 pl-11 pr-4 py-2.5 text-sm rounded-lg border border-transparent transition-smooth group-hover:bg-accent/50 text-muted-foreground flex items-center justify-between">
            <span>Search...</span>
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput 
          placeholder="Type to search..." 
          value={query} 
          onValueChange={setQuery}
        />
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/10 bg-accent/5">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs h-8 px-3.5 rounded-md transition-smooth font-medium"
          >
            All
          </Button>
          <Button
            variant={filter === "applications" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("applications")}
            className="text-xs h-8 px-3.5 rounded-md transition-smooth font-medium"
          >
            Applications
          </Button>
          <Button
            variant={filter === "resumes" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("resumes")}
            className="text-xs h-8 px-3.5 rounded-md transition-smooth font-medium"
          >
            Resumes
          </Button>
          <Button
            variant={filter === "emails" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("emails")}
            className="text-xs h-8 px-3.5 rounded-md transition-smooth font-medium"
          >
            Emails
          </Button>
        </div>

        <CommandList className="p-2">
          {loading && (
            <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
              Searching database...
            </div>
          )}
          
          {!loading && !query.trim() && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Search for applications, resumes, or emails.
            </div>
          )}

          {!loading && query.trim() && 
            ((filter === "all" && results.applications.length === 0 && results.resumes.length === 0 && results.emails.length === 0) ||
             (filter === "applications" && results.applications.length === 0) ||
             (filter === "resumes" && results.resumes.length === 0) ||
             (filter === "emails" && results.emails.length === 0)) && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!loading && (filter === "all" || filter === "applications") && results.applications.length > 0 && (
            <CommandGroup heading="Applications">
              {results.applications.map((app) => (
                <CommandItem
                  key={app.id}
                  onSelect={() => {
                    setOpen(false);
                    window.location.href = `/applications?id=${app.id}`;
                  }}
                  className="cursor-pointer gap-4 p-3"
                >
                  <Briefcase size={18} className="text-muted-foreground shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold">{app.company}</span>
                    <span className="text-xs text-muted-foreground">{app.jobTitle}</span>
                  </div>
                  <Badge className="ml-auto text-[9px] bg-primary/10 text-primary border-primary/20 shrink-0">
                    {app.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && (filter === "all" || filter === "resumes") && results.resumes.length > 0 && (
            <CommandGroup heading="Resumes">
              {results.resumes.map((resume) => (
                <CommandItem
                  key={resume.id}
                  onSelect={() => {
                    setOpen(false);
                    window.location.href = `/resumes`;
                  }}
                  className="cursor-pointer gap-4 p-3"
                >
                  <FileText size={18} className="text-muted-foreground shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold">{resume.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {resume.isMaster ? "Master Resume" : "Tailored Resume"}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!loading && (filter === "all" || filter === "emails") && results.emails.length > 0 && (
            <CommandGroup heading="Emails">
              {results.emails.map((email) => (
                <CommandItem
                  key={email.id}
                  onSelect={() => {
                    setOpen(false);
                    window.location.href = `/emails`;
                  }}
                  className="cursor-pointer gap-4 p-3"
                >
                  <Envelope size={18} className="text-muted-foreground shrink-0" />
                  <div className="flex flex-col max-w-[85%] flex-1">
                    <span className="font-semibold truncate">{email.subject}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{email.sender}</span>
                    <span className="text-[10px] text-muted-foreground/70 truncate italic">{email.snippet}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-smooth"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent className="w-80 p-2" align="end">
            <DropdownMenuLabel className="flex justify-between items-center py-1">
              <span className="font-bold">Notifications</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={async () => {
                      try {
                        await fetch("/api/notifications", { method: "POST" });
                        fetchNotifications();
                      } catch (err) {
                        console.error("Failed to mark all as read:", err);
                      }
                    }}
                    className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && <span className="text-[10px] text-muted-foreground/30">•</span>}
                    <button 
                      onClick={async () => {
                        try {
                          await fetch("/api/notifications", { method: "DELETE" });
                          fetchNotifications();
                        } catch (err) {
                          console.error("Failed to clear notifications:", err);
                        }
                      }}
                      className="text-[10px] text-destructive hover:underline font-medium cursor-pointer"
                    >
                      Clear all
                    </button>
                  </>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto space-y-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={cn(
                      "cursor-pointer flex flex-col items-start gap-1 p-2 rounded-md transition-smooth relative group pr-8",
                      !n.isRead ? "bg-accent/40 text-foreground font-semibold" : "text-muted-foreground hover:bg-accent/20"
                    )}
                    onClick={async () => {
                      if (!n.isRead) {
                        await fetch("/api/notifications", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: n.id }),
                        });
                      }
                      window.location.href = `/applications?id=${n.applicationId}`;
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1">
                        {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block shrink-0" />}
                        {n.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-left truncate w-full">{n.message}</p>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        try {
                          await fetch("/api/notifications", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: n.id }),
                          });
                          fetchNotifications();
                        } catch (err) {
                          console.error("Failed to delete notification:", err);
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete notification"
                    >
                      <Trash size={14} />
                    </button>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        <div className="h-6 w-px bg-border" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 w-9 rounded-full transition-smooth hover:scale-105">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user?.image || ""} alt={user?.name || "User Avatar"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">{user?.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 py-2"
              render={
                <a href="/resumes">
                  <User size={16} />
                  <span>Profile</span>
                </a>
              }
            />
            <DropdownMenuItem
              className="cursor-pointer gap-2 py-2"
              render={
                <a href="/settings">
                  <GearSix size={16} />
                  <span>Settings</span>
                </a>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <SignOut size={16} />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
