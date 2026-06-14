import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  if (!userId) {
    redirect("/login");
  }

  // Fetch application status stats
  const totalApplied = await db.application.count({
    where: { userId, status: "APPLIED" },
  });
  const interviewing = await db.application.count({
    where: { userId, status: "INTERVIEWING" },
  });
  const offers = await db.application.count({
    where: { userId, status: "OFFERED" },
  });
  const queued = await db.application.count({
    where: { userId, status: "QUEUED" },
  });
  const rejected = await db.application.count({
    where: { userId, status: "REJECTED" },
  });

  const totalApplications = await db.application.count({
    where: { userId },
  });

  // Fetch recent applications
  const recentApplications = await db.application.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      company: true,
      jobTitle: true,
      platform: true,
      status: true,
      fitScore: true,
      appliedAt: true,
    },
  });

  // Calculate dynamic stats
  const totalProcessed = totalApplied + interviewing + offers + rejected;
  const responseRate = totalProcessed > 0
    ? Math.round(((interviewing + offers) / totalProcessed) * 100)
    : 0;

  const realStats = {
    totalApplied,
    interviewing,
    offers,
    responseRate,
    totalQueued: queued,
    totalRejected: rejected,
  };

  // Convert schema objects to matching client types
  const formattedRecentApplications = recentApplications.map((app) => ({
    id: app.id,
    company: app.company,
    jobTitle: app.jobTitle,
    platform: app.platform as any,
    status: app.status,
    fitScore: app.fitScore,
    appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
  }));

  // Fetch chart activity (last 7 days of apps)
  const chartData: any[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const startOfDay = d;
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    const dayApplied = await db.application.count({
      where: {
        userId,
        status: "APPLIED",
        appliedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const dayInterviews = await db.application.count({
      where: {
        userId,
        status: "INTERVIEWING",
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    chartData.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      applied: dayApplied,
      interviews: dayInterviews,
    });
  }

  const pieData = [
    { name: "Interviewing", value: interviewing, color: "var(--color-status-interviewing)" },
    { name: "Applied", value: totalApplied, color: "var(--color-status-applied)" },
    { name: "Queued", value: queued, color: "var(--color-status-queued)" },
    { name: "Offers", value: offers, color: "var(--color-status-offered)" },
    { name: "Rejected", value: rejected, color: "var(--color-status-rejected)" },
  ];

  return (
    <DashboardClient
      realStats={realStats}
      realRecentApplications={formattedRecentApplications}
      realChartData={chartData}
      realPieData={pieData}
      userId={userId}
    />
  );
}
