"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GearSix, FloppyDisk, Plus, X, Sparkle, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AgentConfigData {
  id?: string;
  targetRoles: string[];
  targetLocations: string[];
  minSalary: number | null;
  platforms: string[];
  autoApply: boolean;
  dailyLimit: number;
  isActive: boolean;
  syncHour: number;
  syncMinute: number;
}

interface SettingsClientProps {
  initialConfig: AgentConfigData | null;
  saveAction: (data: AgentConfigData) => Promise<{ success: boolean; error?: string }>;
}

export function SettingsClient({ initialConfig, saveAction }: SettingsClientProps) {
  const [config, setConfig] = useState<AgentConfigData>(() => {
    const base = initialConfig || {
      targetRoles: ["Software Engineer", "Frontend Developer"],
      targetLocations: ["Remote", "Bangalore"],
      minSalary: 1200000,
      platforms: ["instahyre", "wellfound", "naukri"],
      autoApply: false,
      dailyLimit: 15,
      isActive: false,
      syncHour: 6,
      syncMinute: 0,
    };
    return {
      ...base,
      syncHour: base.syncHour ?? 6,
      syncMinute: base.syncMinute ?? 0,
    };
  });

  const [roleInput, setRoleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [saving, setSaving] = useState(false);

  const availablePlatforms = [
    { id: "naukri", label: "Naukri (India)", active: true },
    { id: "instahyre", label: "Instahyre", active: false },
    { id: "wellfound", label: "Wellfound (formerly AngelList)", active: false },
    { id: "indeed", label: "Indeed", active: false },
  ];

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput.trim()) return;
    if (config.targetRoles.includes(roleInput.trim())) return;
    setConfig((prev) => ({
      ...prev,
      targetRoles: [...prev.targetRoles, roleInput.trim()],
    }));
    setRoleInput("");
  };

  const handleRemoveRole = (role: string) => {
    setConfig((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.filter((r) => r !== role),
    }));
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    if (config.targetLocations.includes(locationInput.trim())) return;
    setConfig((prev) => ({
      ...prev,
      targetLocations: [...prev.targetLocations, locationInput.trim()],
    }));
    setLocationInput("");
  };

  const handleRemoveLocation = (loc: string) => {
    setConfig((prev) => ({
      ...prev,
      targetLocations: prev.targetLocations.filter((l) => l !== loc),
    }));
  };

  const handlePlatformToggle = (platformId: string) => {
    setConfig((prev) => {
      const exists = prev.platforms.includes(platformId);
      const updated = exists
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId];
      return { ...prev, platforms: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveAction(config);
      if (result.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Configure search preferences, target job portals, and automated agent settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Settings Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-card border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Preferences</CardTitle>
              <CardDescription>Define target roles, locations, and compensation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Target Roles */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Roles
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-9 p-2 rounded-lg bg-accent/20 border border-border/40">
                  {config.targetRoles.length === 0 && (
                    <span className="text-xs text-muted-foreground/60 py-1">No roles added yet.</span>
                  )}
                  {config.targetRoles.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="gap-1 bg-primary/15 text-primary hover:bg-primary/20 border border-primary/10 py-1 px-2.5"
                    >
                      {role}
                      <button
                        onClick={() => handleRemoveRole(role)}
                        className="rounded-full hover:bg-primary/20 p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <form onSubmit={handleAddRole} className="flex gap-2">
                  <Input
                    placeholder="e.g. Fullstack Engineer"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="bg-accent/20 text-sm h-9"
                  />
                  <Button type="submit" size="sm" variant="outline" className="h-9 gap-1.5 transition-smooth" title="Add">
                    <Plus size={14} />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </form>
              </div>

              {/* Target Locations */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Locations
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-9 p-2 rounded-lg bg-accent/20 border border-border/40">
                  {config.targetLocations.length === 0 && (
                    <span className="text-xs text-muted-foreground/60 py-1">No locations added yet.</span>
                  )}
                  {config.targetLocations.map((loc) => (
                    <Badge
                      key={loc}
                      variant="secondary"
                      className="gap-1 bg-primary/15 text-primary hover:bg-primary/20 border border-primary/10 py-1 px-2.5"
                    >
                      {loc}
                      <button
                        onClick={() => handleRemoveLocation(loc)}
                        className="rounded-full hover:bg-primary/20 p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <form onSubmit={handleAddLocation} className="flex gap-2">
                  <Input
                    placeholder="e.g. Remote, Bangalore"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="bg-accent/20 text-sm h-9"
                  />
                  <Button type="submit" size="sm" variant="outline" className="h-9 gap-1.5 transition-smooth" title="Add">
                    <Plus size={14} />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </form>
              </div>

              {/* Min Salary & Daily Limit */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Min Salary (INR / annum)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 1500000"
                    value={config.minSalary || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        minSalary: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="bg-accent/20 text-sm h-9"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Daily Application Limit
                  </label>
                  <Input
                    type="number"
                    value={config.dailyLimit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        dailyLimit: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="bg-accent/20 text-sm h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Platforms Card */}
          <Card className="glass-card border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Job Platforms</CardTitle>
              <CardDescription>Select which job boards Mime should scan and apply on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availablePlatforms.map((platform) => {
                const isChecked = config.platforms.includes(platform.id);
                const isDisabled = !platform.active;
                return (
                  <div
                    key={platform.id}
                    onClick={() => !isDisabled && handlePlatformToggle(platform.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4 transition-smooth",
                      isDisabled
                        ? "border-border/20 bg-accent/5 opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-accent/20",
                      !isDisabled && isChecked ? "border-primary bg-primary/5" : !isDisabled ? "border-border/40 bg-accent/10" : ""
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {platform.label}
                        {isDisabled && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal opacity-70">
                            Coming Soon
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isDisabled
                          ? `Support for ${platform.label} is under development.`
                          : `Mime will scan active feeds on ${platform.label}.`
                        }
                      </p>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center transition-smooth",
                        isDisabled
                          ? "border-muted-foreground/20"
                          : isChecked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                      )}
                    >
                      {!isDisabled && isChecked && <Plus size={12} weight="bold" className="rotate-45" />}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Automation control */}
        <div className="space-y-6">
          <Card className="glass-card border-border/40 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Agent Automation</CardTitle>
              <CardDescription>Configure bot execution and matching mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Toggle */}
              <div
                onClick={() => setConfig((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-smooth",
                  config.isActive ? "border-emerald-500 bg-emerald-500/5" : "border-border/40 bg-accent/10"
                )}
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">Agent Engine Status</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {config.isActive ? "Active and polling databases" : "Inactive / Idle"}
                  </p>
                </div>
                <div
                  className={cn(
                    "relative h-5 w-10 rounded-full transition-smooth",
                    config.isActive ? "bg-emerald-500" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-smooth shadow-sm",
                      config.isActive ? "left-[22px]" : "left-1"
                    )}
                  />
                </div>
              </div>

              {/* Auto Apply Toggle (HITL vs Auto) */}
              <div
                onClick={() => setConfig((prev) => ({ ...prev, autoApply: !prev.autoApply }))}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-smooth",
                  config.autoApply ? "border-primary bg-primary/5" : "border-border/40 bg-accent/10"
                )}
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">Human-in-the-Loop</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {config.autoApply ? "Autonomous Mode (auto-submits)" : "Manual Review Required"}
                  </p>
                </div>
                <div
                  className={cn(
                    "relative h-5 w-10 rounded-full transition-smooth",
                    config.autoApply ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-smooth shadow-sm",
                      config.autoApply ? "left-[22px]" : "left-1"
                    )}
                  />
                </div>
              </div>

              {/* Daily Sync Time */}
              <div className="space-y-2.5 rounded-lg border border-border/40 bg-accent/10 p-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock size={14} className="text-primary" />
                  Daily Inbox Sync Time
                </label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      value={config.syncHour ?? 6}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          syncHour: parseInt(e.target.value) ?? 6,
                        }))
                      }
                      className="w-full bg-background/50 border border-border/40 rounded-md p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const ampm = i >= 12 ? "PM" : "AM";
                        const displayHour = i % 12 === 0 ? 12 : i % 12;
                        return (
                          <option key={i} value={i} className="bg-background text-foreground">
                            {displayHour} {ampm} ({i.toString().padStart(2, "0")}:00)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <span className="text-muted-foreground font-semibold">:</span>
                  <div className="flex-1">
                    <select
                      value={config.syncMinute ?? 0}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          syncMinute: parseInt(e.target.value) ?? 0,
                        }))
                      }
                      className="w-full bg-background/50 border border-border/40 rounded-md p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {[0, 15, 30, 45].map((min) => (
                        <option key={min} value={min} className="bg-background text-foreground">
                          {min.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Checks for status updates from Gmail at {(config.syncHour ?? 6).toString().padStart(2, "0")}:{(config.syncMinute ?? 0).toString().padStart(2, "0")} daily.
                </p>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-primary font-semibold text-xs">
                  <Sparkle size={14} />
                  <span>AI Powered Matching</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Mime tailors your resume bullets using OpenAI GPT-4o relative to the scanned job descriptions to achieve the best ATS match score.
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-2 transition-smooth shadow-lg shadow-primary/15"
              >
                <FloppyDisk size={18} />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
