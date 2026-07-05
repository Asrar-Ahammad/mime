"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tailorResume } from "@/lib/ai/resume-tailor";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

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

export async function generateCoverLetterAction(
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
    const resume = await db.resume.findUnique({
      where: { id: resumeId, userId },
      select: { parsedContent: true },
    });

    if (!resume) {
      return { success: false, error: "Resume not found" };
    }

    let resumeText = "";
    if (resume.parsedContent && Object.keys(resume.parsedContent as object).length > 0) {
      resumeText = JSON.stringify(resume.parsedContent);
    }

    if (!resumeText) {
      return { success: false, error: "Resume has no structured content" };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15 * 1000,
      maxRetries: 1,
    });

    const prompt = `You are an expert career advisor. Write a highly personalized, professional, and concise cover letter (max 300 words) for the following job application.
The cover letter should highlight how the candidate's specific experience and skills from their resume match the job requirements.

Job Title: ${jobTitle}
Company: ${company}
Job Description:
${jobDescription}

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

    // Persist the cover letter in the database by creating a QUEUED application
    await db.application.create({
      data: {
        userId,
        resumeId,
        company,
        jobTitle,
        jobUrl: "", // Optional/empty since it's just generated
        jobDescription,
        platform: "direct",
        status: "QUEUED",
        coverLetter,
      },
    });

    return { success: true, coverLetter };
  } catch (err: any) {
    console.error("Failed to generate cover letter:", err);
    return { success: false, error: err.message || "Failed to generate cover letter" };
  }
}
