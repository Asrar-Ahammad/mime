"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tailorResume } from "@/lib/ai/resume-tailor";
import { revalidatePath } from "next/cache";

export async function setMasterAction(id: string) {
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
    const resume = await db.resume.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!resume || resume.userId !== userId) {
      return { success: false, error: "Resume not found or unauthorized" };
    }

    // Set all resumes of user to isMaster: false, then set target to isMaster: true
    await db.$transaction([
      db.resume.updateMany({
        where: { userId, isMaster: true },
        data: { isMaster: false },
      }),
      db.resume.update({
        where: { id },
        data: { isMaster: true },
      }),
    ]);

    revalidatePath("/resumes");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to set master resume:", error);
    return { success: false, error: error.message || "Failed to set master" };
  }
}

export async function deleteAction(id: string) {
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
    const resume = await db.resume.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!resume || resume.userId !== userId) {
      return { success: false, error: "Resume not found or unauthorized" };
    }

    await db.resume.delete({
      where: { id },
    });

    revalidatePath("/resumes");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete resume:", error);
    return { success: false, error: error.message || "Failed to delete" };
  }
}

export async function tailorAction(
  resumeId: string,
  jobTitle: string,
  company: string,
  jobDescription: string
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
    // Fetch parent resume
    const parentResume = await db.resume.findUnique({
      where: { id: resumeId },
    });

    if (!parentResume || parentResume.userId !== userId) {
      return { success: false, error: "Base resume not found" };
    }

    const baseParsed = parentResume.parsedContent as any;
    if (!baseParsed) {
      return { success: false, error: "Base resume is not parsed or has no structured content" };
    }

    // Call LLM Tailoring
    const tailoredContent = await tailorResume(baseParsed, jobTitle, company, jobDescription);

    // Save tailored resume variant to DB
    const newResume = await db.resume.create({
      data: {
        userId,
        name: `Tailored for ${company} — ${jobTitle}`,
        originalFile: parentResume.originalFile,
        parsedContent: tailoredContent as any,
        isMaster: false,
        parentResumeId: parentResume.id,
      },
    });

    revalidatePath("/resumes");
    return {
      success: true,
      data: {
        id: newResume.id,
        name: newResume.name,
        isMaster: newResume.isMaster,
        originalFile: newResume.originalFile,
        parsedContent: newResume.parsedContent,
        createdAt: newResume.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Failed to tailor resume:", error);
    return { success: false, error: error.message || "Failed to tailor resume" };
  }
}

export async function updateNameAction(id: string, name: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!name.trim()) {
    return { success: false, error: "Resume name cannot be empty" };
  }

  try {
    // Verify ownership
    const resume = await db.resume.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!resume || resume.userId !== userId) {
      return { success: false, error: "Resume not found or unauthorized" };
    }

    await db.resume.update({
      where: { id },
      data: { name: name.trim() },
    });

    revalidatePath("/resumes");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update resume name:", error);
    return { success: false, error: error.message || "Failed to update name" };
  }
}
