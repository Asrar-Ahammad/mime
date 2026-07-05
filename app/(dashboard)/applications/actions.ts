"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export async function updateApplicationAction(
  id: string,
  data: { status?: ApplicationStatus; notes?: string; coverLetter?: string }
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
    if (data.coverLetter !== undefined) {
      updateData.coverLetter = data.coverLetter;
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
        coverLetter: app.coverLetter,
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

export async function generateCoverLetterAction(applicationId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const app = await db.application.findUnique({
      where: { id: applicationId },
      select: {
        userId: true,
        jobTitle: true,
        company: true,
        jobDescription: true,
        resumeId: true,
      },
    });

    if (!app || app.userId !== userId) {
      return { success: false, error: "Application not found or unauthorized" };
    }

    let resumeText = "";
    if (app.resumeId) {
      const resume = await db.resume.findUnique({
        where: { id: app.resumeId },
        select: { parsedContent: true },
      });
      if (resume) {
        resumeText = JSON.stringify(resume.parsedContent || "");
      }
    } else {
      // Find user's master resume or latest resume
      const fallbackResume = await db.resume.findFirst({
        where: { userId },
        orderBy: [{ isMaster: "desc" }, { createdAt: "desc" }],
        select: { parsedContent: true },
      });
      if (fallbackResume) {
        resumeText = JSON.stringify(fallbackResume.parsedContent || "");
      }
    }

    if (!resumeText) {
      return { success: false, error: "Please upload a resume first to generate a cover letter." };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert career advisor. Write a highly personalized, professional, and concise cover letter (max 300 words) for the following job application.
The cover letter should highlight how the candidate's specific experience and skills from their resume match the job requirements.

Job Title: ${app.jobTitle}
Company: ${app.company}
Job Description:
${app.jobDescription || "Not provided."}

Candidate Resume Details:
${resumeText}

Write the cover letter directly. Do not include any introductory remarks, placeholders (like [Date], [Hiring Manager]), or sign-off boilerplate if they can be avoided. Keep it punchy, engaging, and professional.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an assistant that writes highly optimized cover letters." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const coverLetter = response.choices[0]?.message?.content || "";

    if (!coverLetter) {
      return { success: false, error: "Failed to generate cover letter text." };
    }

    await db.application.update({
      where: { id: applicationId },
      data: { coverLetter },
    });

    revalidatePath("/applications");
    return { success: true, coverLetter };
  } catch (err: any) {
    console.error("Failed to generate cover letter:", err);
    return { success: false, error: err.message || "Failed to generate cover letter" };
  }
}
