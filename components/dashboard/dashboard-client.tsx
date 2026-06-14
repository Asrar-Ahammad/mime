"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  Sparkle,
  Envelope,
  ArrowRight,
  Plus,
  Play,
  FileArrowUp,
  EnvelopeSimple,
  CheckCircle,
  Clock,
  Warning,
} from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mock data for fallback / demonstration
const mockStats = {
  totalApplied: 42,
  interviewing: 6,
  offers: 2,
  responseRate: 19, // % (interviewing + offers + viewed / total)
  totalQueued: 15,
  totalRejected: 12,
};

const mockChartData = [
  { date: "Jun 08", applied: 3, interviews: 0 },
  { date: "Jun 09", applied: 5, interviews: 1 },
  { date: "Jun 10", applied: 8, interviews: 2 },
  { date: "Jun 11", applied: 4, interviews: 1 },
  { date: "Jun 12", applied: 10, interviews: 3 },
  { date: "Jun 13", applied: 7, interviews: 4 },
  { date: "Jun 14", applied: 12, interviews: 6 },
];

const mockPieData = [
  { name: "Interviewing", value: 6, color: "var(--color-status-interviewing)" },
  { name: "Applied", value: 22, color: "var(--color-status-applied)" },
  { name: "Queued", value: 15, color: "var(--color-status-queued)" },
  { name: "Offers", value: 2, color: "var(--color-status-offered)" },
  { name: "Rejected", value: 12, color: "var(--color-status-rejected)" },
];

const mockRecentApplications = [
  {
    id: "1",
    company: "Google",
    jobTitle: "Senior Frontend Engineer",
    platform: "direct",
    status: "INTERVIEWING",
    fitScore: 94,
    appliedAt: "2026-06-12T10:00:00.000Z",
  },
  {
    id: "2",
    company: "Stripe",
    jobTitle: "Software Engineer, Core API",
    platform: "indeed",
    status: "APPLIED",
    fitScore: 88,
    appliedAt: "2026-06-13T14:30:00.000Z",
  },
  {
    id: "3",
    company: "Instahyre",
    jobTitle: "React Developer",
    platform: "instahyre",
    status: "QUEUED",
    fitScore: 81,
    appliedAt: null,
  },
  {
    id: "4",
    company: "Wellfound Co.",
    jobTitle: "Fullstack AI Engineer",
    platform: "wellfound",
    status: "OFFERED",
    fitScore: 97,
    appliedAt: "2026-06-10T09:15:00.000Z",
  },
  {
    id: "5",
    company: "Razorpay",
    jobTitle: "UI Engineer",
    platform: "naukri",
    status: "REJECTED",
    fitScore: 76,
    appliedAt: "2026-06-08T16:45:00.000Z",
  },
];

interface DashboardClientProps {
  realStats: any;
  realRecentApplications: any[];
  realChartData: any[];
  realPieData: any[];
  isDemo: boolean;
  userId: string;
}

export function DashboardClient({
  realStats,
  realRecentApplications,
  realChartData,
  realPieData,
  isDemo: serverIsDemo,
  userId,
}: DashboardClientProps) {
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(serverIsDemo);

  const stats = showDemo ? mockStats : realStats;
  const chartData = showDemo ? mockChartData : realChartData;
  const pieData = showDemo ? mockPieData : realPieData;
  const recentApplications = showDemo ? mockRecentApplications : realRecentApplications;

  const statusColors: Record<string, string> = {
    QUEUED: "bg-status-queued/10 text-status-queued border-status-queued/20",
    APPROVED: "bg-status-queued/10 text-status-queued border-status-queued/20",
    APPLYING: "bg-status-applied/10 text-status-applied border-status-applied/20",
    APPLIED: "bg-status-applied/10 text-status-applied border-status-applied/20",
    VIEWED: "bg-status-applied/20 text-status-applied border-status-applied/30",
    INTERVIEWING: "bg-status-interviewing/10 text-status-interviewing border-status-interviewing/20",
    OFFERED: "bg-status-offered/10 text-status-offered border-status-offered/20",
    REJECTED: "bg-status-rejected/10 text-status-rejected border-status-rejected/20",
    WITHDRAWN: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">
      {/* Top Banner for Demo mode */}
      {showDemo && (
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkle size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Showing Demo Data</p>
              <p className="text-xs text-muted-foreground">
                Get started by uploading your master resume and configuring the AI Agent.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/resumes"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              <FileArrowUp size={16} />
              Upload Resume
            </Link>
            {serverIsDemo && (
              <Button
                size="sm"
                onClick={() => {
                  document.cookie = `dismissed_demo_${userId}=true; path=/; max-age=31536000; SameSite=Lax`;
                  setShowDemo(false);
                  router.refresh();
                }}
                className="bg-primary hover:bg-primary/95 text-primary-foreground"
              >
                Dismiss Demo
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Monitor application status, tailored resume variants, and emails.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/agent"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth gap-2"
            )}
            title="Run AI Agent"
          >
            <Play size={16} weight="fill" />
            <span className="hidden sm:inline">Run AI Agent</span>
          </Link>
          <Link
            href="/resumes"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "transition-smooth gap-2"
            )}
            title="Tailor Resume"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Tailor Resume</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Applied */}
        <Card className="glass-card transition-smooth hover:scale-[1.02] hover:border-primary/30 [--card-spacing:--spacing(3)] sm:[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Applications Sent</CardTitle>
            <div className="rounded-lg bg-status-applied/10 p-1.5 sm:p-2 text-status-applied shrink-0">
              <Briefcase size={16} className="sm:w-5 sm:h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats.totalApplied}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Total submitted</p>
          </CardContent>
        </Card>

        {/* Interviewing */}
        <Card className="glass-card transition-smooth hover:scale-[1.02] hover:border-status-interviewing/30 [--card-spacing:--spacing(3)] sm:[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Interviews</CardTitle>
            <div className="rounded-lg bg-status-interviewing/10 p-1.5 sm:p-2 text-status-interviewing shrink-0">
              <Calendar size={16} className="sm:w-5 sm:h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats.interviewing}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Live processes</p>
          </CardContent>
        </Card>

        {/* Offers */}
        <Card className="glass-card transition-smooth hover:scale-[1.02] hover:border-status-offered/30 [--card-spacing:--spacing(3)] sm:[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Offers Received</CardTitle>
            <div className="rounded-lg bg-status-offered/10 p-1.5 sm:p-2 text-status-offered shrink-0">
              <CheckCircle size={16} className="sm:w-5 sm:h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats.offers}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Congratulations!</p>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card className="glass-card transition-smooth hover:scale-[1.02] hover:border-primary/30 [--card-spacing:--spacing(3)] sm:[--card-spacing:--spacing(4)]">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Response Rate</CardTitle>
            <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2 text-primary shrink-0">
              <Sparkle size={16} className="sm:w-5 sm:h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{stats.responseRate}%</div>
            <div className="w-full bg-accent h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.responseRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Application Trend Line */}
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Application Activity</CardTitle>
            <CardDescription>Applications vs Interview invites over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] w-full pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="appliedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-status-applied)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-status-applied)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="interviewColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-status-interviewing)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-status-interviewing)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="applied"
                  name="Applications"
                  stroke="var(--color-status-applied)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#appliedColor)"
                />
                <Area
                  type="monotone"
                  dataKey="interviews"
                  name="Interviews"
                  stroke="var(--color-status-interviewing)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#interviewColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Stages Pie */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Application Funnel</CardTitle>
            <CardDescription>Breakdown by hiring stage</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[280px]">
            {pieData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
              <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Clock size={32} />
                No applications sent yet
              </div>
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          color: "var(--foreground)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs w-full max-w-[240px]">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications table */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Applications List */}
        <Card className="glass-card md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
              <CardDescription>Track status and AI match details</CardDescription>
            </div>
            <Link
              href="/applications"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-primary hover:text-primary/80 gap-1 text-xs"
              )}
            >
              View All
              <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {recentApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
                <Briefcase size={40} className="text-muted-foreground/40 mb-3" />
                No applications yet. Run the agent to find jobs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-6 py-3">Company & Role</th>
                      <th className="px-6 py-3">Source</th>
                      <th className="px-6 py-3">AI Fit</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {recentApplications.map((app) => (
                      <tr key={app.id} className="group hover:bg-accent/20 transition-smooth">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{app.company}</div>
                          <div className="text-xs text-muted-foreground font-normal mt-0.5">{app.jobTitle}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                            {app.platform}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {app.fitScore ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "font-bold text-xs",
                                  app.fitScore >= 90
                                    ? "text-status-offered"
                                    : app.fitScore >= 80
                                    ? "text-primary"
                                    : "text-status-queued"
                                )}
                              >
                                {app.fitScore}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-smooth",
                              statusColors[app.status] || "bg-accent text-muted-foreground"
                            )}
                          >
                            {app.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                          {app.appliedAt
                            ? new Date(app.appliedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Not Applied"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Help / Agent Status */}
        <Card className="glass-card flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Agent Activity</CardTitle>
            <CardDescription>Recent actions performed by Mime</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {showDemo ? (
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="rounded-full bg-status-applied/10 p-2 text-status-applied shrink-0">
                    <Sparkle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Scanned Wellfound platform</p>
                    <p className="text-[10px] text-muted-foreground">Discovered 14 Software Engineer jobs</p>
                    <span className="text-[9px] text-muted-foreground/60">10 minutes ago</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="rounded-full bg-status-interviewing/10 p-2 text-status-interviewing shrink-0">
                    <EnvelopeSimple size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Email alert matching</p>
                    <p className="text-[10px] text-muted-foreground">Detected update from Google: Next Steps Interview</p>
                    <span className="text-[9px] text-muted-foreground/60">2 hours ago</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="rounded-full bg-status-queued/10 p-2 text-status-queued shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Tailored new resume version</p>
                    <p className="text-[10px] text-muted-foreground">Variant tailored for Stripe SWE role</p>
                    <span className="text-[9px] text-muted-foreground/60">4 hours ago</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground text-center">
                <Warning size={32} className="text-muted-foreground/30 mb-2" />
                No recent agent logs. Configure and run the agent to start automation.
              </div>
            )}
          </CardContent>
          <div className="p-6 pt-0 border-t border-border/20 mt-4">
            <Link
              href="/agent"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full text-xs gap-1.5 transition-smooth justify-center"
              )}
            >
              Open Control Panel
              <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
