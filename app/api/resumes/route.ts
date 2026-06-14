import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { parseResumeText } from "@/lib/ai/resume-parser";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract text from PDF
    const text = await extractTextFromPDF(buffer);

    // 2. Parse text with LLM
    const parsedContent = await parseResumeText(text);

    // 3. Save to database
    // Check if it's the user's first resume
    const existingResumesCount = await db.resume.count({
      where: { userId },
    });

    const isMaster = existingResumesCount === 0;

    const newResume = await db.resume.create({
      data: {
        userId,
        name: file.name.replace(/\.pdf$/i, "") || "My Resume",
        originalFile: file.name,
        parsedContent: parsedContent as any,
        isMaster,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newResume.id,
        name: newResume.name,
        isMaster: newResume.isMaster,
        originalFile: newResume.originalFile,
        parsedContent: newResume.parsedContent,
        createdAt: newResume.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error processing resume upload:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process resume upload" },
      { status: 500 }
    );
  }
}
