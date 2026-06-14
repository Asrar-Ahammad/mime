import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { EmailsClient } from "@/components/emails/emails-client";
import { syncEmailsAction, linkEmailAction, deleteEmailAction, deleteEmailsAction } from "./actions";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EmailsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  if (!userId) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const initialThreadId = resolvedSearchParams.threadId as string | undefined;

  // Fetch all applications for the dropdown selector
  const applications = await db.application.findMany({
    where: { userId },
    select: {
      id: true,
      company: true,
      jobTitle: true,
    },
    orderBy: { company: "asc" },
  });

  // Fetch synced email threads.
  // In a multi-user setup, we retrieve threads that are linked to the user's applications,
  // or unlinked ones. Since this is local-only, retrieving all threads in the DB works great.
  const emailThreads = await db.emailThread.findMany({
    where: {
      OR: [
        { applicationId: null },
        { application: { userId } },
      ],
    },
    include: {
      application: {
        select: {
          id: true,
          company: true,
          jobTitle: true,
        },
      },
    },
    orderBy: { lastMessageDate: "desc" },
  });

  const formattedEmails = emailThreads.map((thread) => ({
    id: thread.id,
    gmailThreadId: thread.gmailThreadId,
    subject: thread.subject,
    snippet: thread.snippet,
    sender: thread.sender,
    lastMessageDate: thread.lastMessageDate.toISOString(),
    isRead: thread.isRead,
    applicationId: thread.applicationId,
    application: thread.application,
    rawMessages: thread.rawMessages,
  }));

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading emails...</div>}>
      <EmailsClient
        initialEmails={formattedEmails}
        applications={applications}
        syncAction={syncEmailsAction}
        linkAction={linkEmailAction}
        deleteAction={deleteEmailAction}
        deleteMultipleAction={deleteEmailsAction}
        initialThreadId={initialThreadId}
      />
    </Suspense>
  );
}
