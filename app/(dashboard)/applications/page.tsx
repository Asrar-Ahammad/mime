import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ApplicationsClient } from "@/components/applications/applications-client";
import { updateApplicationAction, deleteApplicationAction, bulkDeleteApplicationsAction, createApplicationAction } from "./actions";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  if (!userId) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const initialAppId = resolvedSearchParams.id as string | undefined;

  // Fetch applications from DB
  const dbApps = await db.application.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      resume: {
        select: {
          id: true,
          name: true,
        },
      },
      emailThreads: {
        select: {
          id: true,
          gmailThreadId: true,
          subject: true,
          snippet: true,
          sender: true,
          lastMessageDate: true,
        },
      },
    },
  });

  // Convert schema objects to matching client types
  const formattedApps = dbApps.map((app) => ({
    id: app.id,
    company: app.company,
    jobTitle: app.jobTitle,
    jobUrl: app.jobUrl,
    jobDescription: app.jobDescription,
    platform: app.platform,
    status: app.status as any,
    fitScore: app.fitScore,
    notes: app.notes,
    appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    resume: app.resume,
    emailThreads: app.emailThreads.map((thread) => ({
      id: thread.id,
      gmailThreadId: thread.gmailThreadId,
      subject: thread.subject,
      snippet: thread.snippet,
      sender: thread.sender,
      lastMessageDate: thread.lastMessageDate.toISOString(),
    })),
  }));

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading applications...</div>}>
      <ApplicationsClient
        initialApplications={formattedApps}
        updateAction={updateApplicationAction}
        deleteAction={deleteApplicationAction}
        bulkDeleteAction={bulkDeleteApplicationsAction}
        createAction={createApplicationAction}
        initialAppId={initialAppId}
      />
    </Suspense>
  );
}
