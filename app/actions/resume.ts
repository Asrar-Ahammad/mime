"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveResumeAction(data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Create a new resume record
    const resume = await db.resume.create({
      data: {
        userId,
        name: data.contact?.name ? `${data.contact.name}'s Resume` : "Untitled Resume",
        originalFile: "created_in_editor", // placeholder
        parsedContent: data,
        isMaster: false,
      },
    });

    revalidatePath("/resumes");
    
    return { success: true, resumeId: resume.id };
  } catch (error) {
    console.error("Failed to save resume:", error);
    return { success: false, error: "Failed to save resume" };
  }
}
