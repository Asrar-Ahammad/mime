import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ResumesClient } from "@/components/resumes/resumes-client";
import { setMasterAction, deleteAction, tailorAction, updateNameAction, generateCoverLetterAction } from "./actions";

export default async function ResumesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  if (!userId) {
    redirect("/login");
  }

  // Fetch all resumes for the user
  const dbResumes = await db.resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const formattedResumes = dbResumes.map((res) => ({
    id: res.id,
    name: res.name,
    isMaster: res.isMaster,
    originalFile: res.originalFile,
    parsedContent: res.parsedContent,
    createdAt: res.createdAt.toISOString(),
  }));

  // Fetch applications that have generated cover letters
  const dbApplicationsWithCL = await db.application.findMany({
    where: {
      userId,
      coverLetter: {
        not: null,
      },
    },
    select: {
      id: true,
      company: true,
      jobTitle: true,
      coverLetter: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedCoverLetters = dbApplicationsWithCL.map((app) => ({
    id: app.id,
    company: app.company,
    jobTitle: app.jobTitle,
    coverLetter: app.coverLetter || "",
    updatedAt: app.updatedAt.toISOString(),
  }));

  return (
    <ResumesClient
      initialResumes={formattedResumes}
      initialCoverLetters={formattedCoverLetters}
      setMasterAction={setMasterAction}
      deleteAction={deleteAction}
      tailorAction={tailorAction}
      updateNameAction={updateNameAction}
      generateCoverLetterAction={generateCoverLetterAction}
    />
  );
}
