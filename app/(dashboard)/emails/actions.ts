"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncUserEmails } from "@/lib/email/email-parser";
import { revalidatePath } from "next/cache";

const globalForSync = globalThis as unknown as {
  activeSyncs: Set<string>;
};

if (!globalForSync.activeSyncs) {
  globalForSync.activeSyncs = new Set<string>();
}

export async function syncEmailsAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (globalForSync.activeSyncs.has(userId)) {
    return { success: true, background: true, message: "Sync already in progress" };
  }

  // Kick off background job
  globalForSync.activeSyncs.add(userId);
  
  // Fire and forget
  Promise.resolve().then(async () => {
    try {
      await syncUserEmails(userId);
    } catch (err) {
      console.error("Background sync failed:", err);
    } finally {
      globalForSync.activeSyncs.delete(userId);
    }
  });

  return { success: true, background: true };
}

export async function checkSyncStatusAction() {
  const session = await auth();
  if (!session?.user) return { isSyncing: false };
  const userId = (session.user as any).id;
  if (!userId) return { isSyncing: false };

  return { isSyncing: globalForSync.activeSyncs.has(userId) };
}

export async function linkEmailAction(threadId: string, applicationId: string | null) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify thread ownership by checking linked application user or google account user
    const thread = await db.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return { success: false, error: "Email thread not found" };
    }

    if (thread.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (applicationId) {
      // Verify application ownership
      const app = await db.application.findUnique({
        where: { id: applicationId },
        select: { userId: true },
      });

      if (!app || app.userId !== userId) {
        return { success: false, error: "Target application not found or unauthorized" };
      }
    }

    // Update connection
    await db.emailThread.update({
      where: { id: threadId },
      data: { applicationId },
    });

    revalidatePath("/emails");
    revalidatePath("/applications");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to link email thread:", err);
    return { success: false, error: err.message || "Failed to link thread" };
  }
}

export async function deleteEmailAction(threadId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const thread = await db.emailThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return { success: false, error: "Email thread not found" };
    }

    // Verify ownership
    if (thread.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.emailThread.delete({
      where: { id: threadId },
    });

    revalidatePath("/emails");
    revalidatePath("/applications");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete email thread:", err);
    return { success: false, error: err.message || "Failed to delete email" };
  }
}

export async function deleteEmailsAction(threadIds: string[]) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.emailThread.deleteMany({
      where: {
        id: { in: threadIds },
        userId,
      }
    });

    revalidatePath("/emails");
    revalidatePath("/applications");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete email threads:", err);
    return { success: false, error: err.message || "Failed to delete emails" };
  }
}
