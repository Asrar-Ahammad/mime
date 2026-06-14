"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Plus, X, Sparkles, Clock, Target, MapPin, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PwaInstallPrompt } from "./pwa-install-prompt";

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
    <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-12 px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-6 pt-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
              <Settings className="h-7 w-7 text-primary" />
            </div>
            Settings
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure your AI job search parameters and agent preferences.
          </p>
        </div>
        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 transition-smooth shadow-lg shadow-primary/20 rounded-xl"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Core Parameters */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <Card className="glass-card border-border/40 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden relative rounded-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-80" />
            <CardHeader className="pb-4 space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Global Agent Parameters
              </CardTitle>
              <CardDescription className="text-sm">
                Define the roles and locations the AI agent should prioritize during autonomous scans.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Target Roles */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Briefcase size={16} className="text-muted-foreground" />
                  Target Roles
                </label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[3rem] p-3 rounded-xl bg-background/50 border border-border/50 shadow-inner">
                  {config.targetRoles.length === 0 && (
                    <span className="text-sm text-muted-foreground/60 py-1 px-2 italic">
                      No roles added. The agent needs at least one role to search.
                    </span>
                  )}
                  {config.targetRoles.map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 py-1.5 px-3 rounded-full text-sm font-medium transition-smooth"
                    >
                      {role}
                      <button
                        onClick={() => handleRemoveRole(role)}
                        className="rounded-full hover:bg-primary/30 p-0.5 text-primary/70 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                        aria-label={`Remove ${role}`}
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <form onSubmit={handleAddRole} className="flex gap-3">
                  <Input
                    placeholder="e.g. Frontend Engineer, Product Manager"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="bg-background/50 border-border/50 text-sm h-11 rounded-xl shadow-sm focus-visible:ring-primary/30"
                  />
                  <Button type="submit" variant="secondary" className="h-11 px-5 gap-2 transition-smooth rounded-xl font-medium border border-border/50 hover:bg-accent hover:text-accent-foreground">
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Role</span>
                  </Button>
                </form>
              </div>

              {/* Target Locations */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <MapPin size={16} className="text-muted-foreground" />
                  Target Locations
                </label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[3rem] p-3 rounded-xl bg-background/50 border border-border/50 shadow-inner">
                  {config.targetLocations.length === 0 && (
                    <span className="text-sm text-muted-foreground/60 py-1 px-2 italic">
                      No locations added. Add 'Remote' or specific cities.
                    </span>
                  )}
                  {config.targetLocations.map((loc) => (
                    <Badge
                      key={loc}
                      variant="secondary"
                      className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 py-1.5 px-3 rounded-full text-sm font-medium transition-smooth"
                    >
                      {loc}
                      <button
                        onClick={() => handleRemoveLocation(loc)}
                        className="rounded-full hover:bg-primary/30 p-0.5 text-primary/70 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                        aria-label={`Remove ${loc}`}
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <form onSubmit={handleAddLocation} className="flex gap-3">
                  <Input
                    placeholder="e.g. Remote, San Francisco, London"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="bg-background/50 border-border/50 text-sm h-11 rounded-xl shadow-sm focus-visible:ring-primary/30"
                  />
                  <Button type="submit" variant="secondary" className="h-11 px-5 gap-2 transition-smooth rounded-xl font-medium border border-border/50 hover:bg-accent hover:text-accent-foreground">
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Location</span>
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution & Misc */}
        <div className="space-y-6 md:space-y-8">
          <Card className="glass-card border-border/40 bg-card/40 backdrop-blur-md shadow-lg rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Scheduled Execution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 rounded-xl border border-border/30 bg-background/30 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Daily Sync Active
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Inbox sync runs automatically once per day at midnight UTC to check for status updates.
                </p>
              </div>
              
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 space-y-3 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Sparkles size={64} className="text-primary" />
                </div>
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles size={16} />
                  <span>AI Powered Matching</span>
                </div>
                <p className="text-xs leading-relaxed text-foreground/80 relative z-10">
                  Mime tailors your resume bullets using OpenAI GPT-4o relative to the scanned job descriptions to achieve the best ATS match score automatically.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <PwaInstallPrompt />
        </div>
      </div>

    </div>
  );
}

