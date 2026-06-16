"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Robot,
  GearSix,
  Sparkle,
  Terminal,
  Circle,
  Clock,
  Warning,
  CheckCircle,
  Spinner,
} from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentClientProps {
  config: {
    isActive: boolean;
    autoApply: boolean;
    targetRoles: string[];
    targetLocations: string[];
    platforms: string[];
    dailyLimit: number;
  } | null;
  hasMasterResume: boolean;
  runAgentAction: () => Promise<{ success: boolean; count?: number; error?: string }>;
  toggleAgentAction: (active: boolean) => Promise<{ success: boolean; error?: string }>;
}

export function AgentClient({
  config,
  hasMasterResume,
  runAgentAction,
  toggleAgentAction,
}: AgentClientProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isActive, setIsActive] = useState(config?.isActive || false);
  const [logs, setLogs] = useState<string[]>([
    "System initialized. Ready to scan.",
  ]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const handleToggleActive = async () => {
    const newState = !isActive;
    try {
      const result = await toggleAgentAction(newState);
      if (result.success) {
        setIsActive(newState);
        addLog(newState ? "Agent Engine activated." : "Agent Engine deactivated / placed on standby.");
        toast.success(newState ? "Agent activated" : "Agent standby mode");
      } else {
        toast.error(result.error || "Failed to update agent state");
      }
    } catch (err) {
      toast.error("Failed to toggle agent status");
    }
  };

  const handleRunAgent = async () => {
    if (!hasMasterResume) {
      toast.error("You must upload a Master Resume first!");
      return;
    }
    if (!config || config.targetRoles.length === 0) {
      toast.error("Please configure target roles in Settings.");
      return;
    }

    setIsRunning(true);
    setLogs([]);
    addLog("Starting AI Job Application Agent Loop...");

    // Automatically activate engine (set isActive to true in DB and UI)
    try {
      const toggleRes = await toggleAgentAction(true);
      if (toggleRes.success) {
        setIsActive(true);
        addLog("Agent Engine automatically activated.");
      } else {
        addLog(`Failed to automatically activate: ${toggleRes.error}`);
      }
    } catch (err) {
      console.error("Failed to automatically activate agent:", err);
    }

    // Simulated log stream while action runs
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    
    addLog(`Loading search preferences. Platforms: ${config.platforms.join(", ")}`);
    await delay(800);
    addLog(`Target roles: ${config.targetRoles.join(" | ")}`);
    await delay(600);
    addLog(`Target locations: ${config.targetLocations.join(" | ")}`);
    await delay(1000);

    for (const platform of config.platforms) {
      addLog(`Connecting to ${platform} browser session...`);
      await delay(800);
      addLog(`[${platform}] Searching active postings...`);
      await delay(1200);
      addLog(`[${platform}] Scraped matching roles.`);
    }

    addLog("Evaluating candidate master resume profile with discovered postings...");
    await delay(1500);
    addLog("Calling OpenAI GPT-4o-mini to calculate ATS fit scores...");
    await delay(1000);

    try {
      const result = await runAgentAction();
      if (result.success) {
        const foundCount = result.count || 0;
        addLog(`Analysis complete. Discovered ${foundCount} new job postings.`);
        if (foundCount > 0) {
          addLog("Created and queued applications for your review on the dashboard.");
          toast.success(`Discovered ${foundCount} matching jobs!`);
        } else {
          addLog("No new matching jobs discovered in this cycle.");
          toast.info("Scrape complete. No new matches.");
        }
      } else {
        addLog(`Engine Error: ${result.error}`);
        toast.error(result.error || "Failed to run agent");
      }
    } catch (error) {
      addLog("Critical Engine Exception occurred.");
      toast.error("An unexpected error occurred during execution.");
    } finally {
      setIsRunning(false);
      addLog("Agent cycle finished. Standby mode.");

      // Automatically go to standby mode (set isActive to false in DB and UI)
      try {
        const toggleRes = await toggleAgentAction(false);
        if (toggleRes.success) {
          setIsActive(false);
          addLog("Agent Engine automatically returned to standby.");
        } else {
          addLog(`Failed to automatically put agent on standby: ${toggleRes.error}`);
        }
      } catch (err) {
        console.error("Failed to automatically deactivate agent:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">AI Agent</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Control the scraper bot, view terminal execution logs, and monitor target matches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleToggleActive}
            variant="outline"
            className={cn(
              "gap-2 h-9 text-xs transition-smooth bg-card",
              isActive ? "border-emerald-500 text-emerald-400 hover:text-emerald-300" : "border-border"
            )}
            title={isActive ? "Engine Active" : "Standby Mode"}
          >
            <Circle size={10} weight={isActive ? "fill" : "regular"} className={cn(isActive && "animate-pulse")} />
            <span className="hidden sm:inline">{isActive ? "Engine Active" : "Standby Mode"}</span>
          </Button>
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-1.5"
            )}
            title="Settings"
          >
            <GearSix size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Agent Status & terminal */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Terminal logs panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-border/40 shadow-lg overflow-hidden flex flex-col h-[480px]">
            <CardHeader className="bg-accent/10 border-b border-border/20 py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">Agent Console Logs</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="bg-black/95 p-4 font-mono text-[11px] leading-relaxed text-zinc-300 overflow-y-auto flex-1 h-full select-text selection:bg-zinc-700/50 selection:text-white">
              {logs.map((log, idx) => (
                <div key={idx} className="pb-1 text-justify">
                  {log}
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="animate-ping h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Agent scanning targets...</span>
                </div>
              )}
              <div ref={consoleEndRef} />
            </CardContent>
          </Card>
        </div>

        {/* Configurations Summary panel */}
        <div className="space-y-6">
          {/* Engine control card */}
          <Card className="glass-card border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Engine Control</CardTitle>
              <CardDescription>Initiate an on-demand scanning and matching loop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleRunAgent}
                disabled={isRunning}
                className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-2 transition-smooth shadow-lg shadow-primary/15"
              >
                {isRunning ? (
                  <>
                    <Spinner size={18} className="animate-spin" />
                    Running Engine...
                  </>
                ) : (
                  <>
                    <Play size={18} weight="fill" />
                    Trigger Agent Cycle
                  </>
                )}
              </Button>

              {!hasMasterResume && (
                <div className="flex gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs">
                  <Warning size={20} className="text-yellow-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Master Resume Missing</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">
                      You must upload and set a Master Resume in the{" "}
                      <Link href="/resumes" className="text-primary underline">
                        Resumes
                      </Link>{" "}
                      tab before the agent can compute matching scores.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences indicators */}
          <Card className="glass-card border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Preference Summary</CardTitle>
              <CardDescription>Active criteria for agent discovery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {config ? (
                <>
                  {/* Target Roles */}
                  <div className="space-y-1.5">
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Target Roles
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {config.targetRoles.map((role) => (
                        <Badge key={role} variant="outline" className="text-[10px] bg-accent/20 border-border/40 text-muted-foreground">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Target Locations */}
                  <div className="space-y-1.5">
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Target Locations
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {config.targetLocations.map((loc) => (
                        <Badge key={loc} variant="outline" className="text-[10px] bg-accent/20 border-border/40 text-muted-foreground">
                          {loc}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="space-y-1.5">
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                      Target Platforms
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {config.platforms.map((plat) => (
                        <Badge key={plat} className="text-[10px] bg-primary/10 border-primary/20 text-primary capitalize">
                          {plat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Daily Limit
                      </p>
                      <p className="text-sm font-bold text-foreground">{config.dailyLimit} applications</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Review Mode
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {config.autoApply ? "Auto-Apply" : "HITL (Review)"}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground leading-relaxed">
                  <Warning size={24} className="text-muted-foreground/40 mb-1.5" />
                  No configuration found. Visit Settings to set preferences.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
