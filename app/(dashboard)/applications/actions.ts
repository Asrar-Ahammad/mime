"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateApplicationAction(
  id: string,
  data: { status?: ApplicationStatus; notes?: string }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify ownership
    const app = await db.application.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!app || app.userId !== userId) {
      return { success: false, error: "Application not found or unauthorized" };
    }

    const updateData: any = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "APPLIED") {
        updateData.appliedAt = new Date();
      }
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    await db.application.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/applications");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to update application:", err);
    return { success: false, error: err.message || "Failed to update" };
  }
}

export async function deleteApplicationAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify ownership
    const app = await db.application.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!app || app.userId !== userId) {
      return { success: false, error: "Application not found or unauthorized" };
    }

    await db.application.delete({
      where: { id },
    });

    revalidatePath("/applications");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete application:", err);
    return { success: false, error: err.message || "Failed to delete" };
  }
}

export async function bulkDeleteApplicationsAction(ids: string[]) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!ids.length) {
    return { success: false, error: "No applications selected" };
  }

  try {
    // Delete only apps owned by this user
    const result = await db.application.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    revalidatePath("/applications");
    revalidatePath("/");
    return { success: true, count: result.count };
  } catch (err: any) {
    console.error("Failed to bulk delete applications:", err);
    return { success: false, error: err.message || "Failed to delete" };
  }
}

export async function createApplicationAction(data: {
  company: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  platform: string;
  status: ApplicationStatus;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!data.company || !data.jobTitle || !data.jobUrl || !data.platform) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    const app = await db.application.create({
      data: {
        userId,
        company: data.company,
        jobTitle: data.jobTitle,
        jobUrl: data.jobUrl,
        jobDescription: data.jobDescription || "",
        platform: data.platform,
        status: data.status || "APPLIED",
        notes: data.notes || null,
        appliedAt: data.status === "APPLIED" ? new Date() : null,
      },
    });

    revalidatePath("/applications");
    revalidatePath("/");
    return {
      success: true,
      application: {
        id: app.id,
        company: app.company,
        jobTitle: app.jobTitle,
        jobUrl: app.jobUrl,
        jobDescription: app.jobDescription,
        platform: app.platform,
        status: app.status as string,
        fitScore: app.fitScore,
        notes: app.notes,
        appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
        createdAt: app.createdAt.toISOString(),
        resume: null,
        emailThreads: [],
      },
    };
  } catch (err: any) {
    console.error("Failed to create application:", err);
    return { success: false, error: err.message || "Failed to create" };
  }
}
