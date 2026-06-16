import { Metadata } from "next";
import { ResumeEditor } from "@/components/resumes/resume-editor";

export const metadata: Metadata = {
  title: "Resume Editor - Mime",
  description: "Customize and edit your master resume",
};

export default function ResumeEditorPage() {
  return (
    <main className="min-h-screen bg-background">
      <ResumeEditor />
    </main>
  );
}
