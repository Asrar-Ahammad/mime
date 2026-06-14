import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ResumesClient } from "@/components/resumes/resumes-client";
import { setMasterAction, deleteAction, tailorAction, updateNameAction } from "./actions";

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

  return (
    <ResumesClient
      initialResumes={formattedResumes}
      setMasterAction={setMasterAction}
      deleteAction={deleteAction}
      tailorAction={tailorAction}
      updateNameAction={updateNameAction}
    />
  );
}
