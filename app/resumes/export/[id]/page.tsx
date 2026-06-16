import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ArrowLeft, Printer } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Script from "next/script";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

function renderFormattedText(text: string) {
  if (!text) return "";
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}

export default async function ExportResumePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const { id } = await params;

  const resume = await db.resume.findUnique({
    where: { id },
  });

  if (!resume || resume.userId !== userId) {
    redirect("/resumes");
  }

  const parsed = resume.parsedContent as any;
  if (!parsed) {
    redirect("/resumes");
  }

  return (
    <div className="min-h-screen bg-neutral-900 print:bg-white text-zinc-100 print:text-black py-8 print:py-0 px-4">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 0;
          }
          body {
            margin: 0;
          }
        }
      `}} />
      {/* Control bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden bg-neutral-800/80 p-4 rounded-xl border border-neutral-700/50 backdrop-blur-md w-full">
        <div className="flex items-center gap-2 w-full min-w-0">
          <Link
            href="/resumes"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-zinc-400 hover:text-white gap-1.5 px-2 shrink-0"
            )}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Resumes</span>
          </Link>
          <span className="text-sm font-semibold text-zinc-300 truncate flex-1">
            {resume.name}
          </span>
        </div>
        <Button
          className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-1.5 shrink-0"
        >
          <Printer size={16} />
          Print / Save to PDF
        </Button>
        {/* We inject inline onClick script for printing to work without making this page a client component */}
        <Script
          id="print-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              document.querySelector('button').addEventListener('click', () => {
                window.print();
              });
              if (window.location.search.includes('download=true')) {
                setTimeout(() => {
                  window.print();
                }, 400);
              }
            `,
          }}
        />
      </div>

      {/* Sheet Container (Simulates Letter/A4 page) */}
      <article className="max-w-[800px] mx-auto bg-white text-black p-10 shadow-2xl print:shadow-none min-h-[1050px] font-serif border border-neutral-200 print:border-none rounded-sm">
        {/* Contact Header */}
        <header className="text-center border-b-[1.5px] border-zinc-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-zinc-900 mb-1">
            {parsed.contact?.name || session.user.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-700 font-sans">
            {parsed.contact?.email && <span>{parsed.contact.email}</span>}
            {parsed.contact?.email && parsed.contact?.phone && <span className="text-zinc-300">•</span>}
            {parsed.contact?.phone && <span>{parsed.contact.phone}</span>}
            {parsed.contact?.phone && parsed.contact?.location && <span className="text-zinc-300">•</span>}
            {parsed.contact?.location && <span>{parsed.contact.location}</span>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-600 font-sans mt-1">
            {parsed.contact?.linkedin && (
              <a href={parsed.contact.linkedin} target="_blank" rel="noreferrer" className="underline hover:text-zinc-800">
                LinkedIn
              </a>
            )}
            {parsed.contact?.linkedin && parsed.contact?.github && <span className="text-zinc-300">•</span>}
            {parsed.contact?.github && (
              <a href={parsed.contact.github} target="_blank" rel="noreferrer" className="underline hover:text-zinc-800">
                GitHub
              </a>
            )}
            {parsed.contact?.github && parsed.contact?.portfolio && <span className="text-zinc-300">•</span>}
            {parsed.contact?.portfolio && (
              <a href={parsed.contact.portfolio} target="_blank" rel="noreferrer" className="underline hover:text-zinc-800">
                Portfolio
              </a>
            )}
          </div>
        </header>

        {/* Summary */}
        {(parsed.summary || (parsed.profileEntries && parsed.profileEntries.filter((e: any) => e.isVisible).length > 0)) && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans mb-1.5 border-b border-zinc-200 pb-0.5">
              {parsed.profileHeading || "Professional Summary"}
            </h2>
            <div className="space-y-2">
              {parsed.profileEntries && parsed.profileEntries.filter((e: any) => e.isVisible).length > 0 ? (
                parsed.profileEntries.filter((e: any) => e.isVisible).map((entry: any, index: number) => (
                  <p 
                    key={index} 
                    style={{ textAlign: (entry.align || "left") as any }} 
                    className="text-xs leading-relaxed text-zinc-700 text-justify"
                  >
                    {renderFormattedText(entry.text)}
                  </p>
                ))
              ) : (
                <p className="text-xs leading-relaxed text-zinc-700 text-justify">
                  {renderFormattedText(parsed.summary)}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Technical Skills */}
        {parsed.skills && parsed.skills.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans mb-1.5 border-b border-zinc-200 pb-0.5">
              Technical Skills
            </h2>
            <p className="text-xs leading-relaxed text-zinc-700">
              <span className="font-bold font-sans text-[10px] uppercase text-zinc-600 mr-1.5">Technologies:</span>
              {parsed.skills.join(", ")}
            </p>
          </section>
        )}

        {/* Experience */}
        {parsed.experience && parsed.experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans mb-3 border-b border-zinc-200 pb-0.5">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {parsed.experience.map((exp: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-bold text-zinc-900">{exp.title}</h3>
                    <span className="text-[10px] font-sans text-zinc-600 font-medium">
                      {exp.startDate} – {exp.endDate || "Present"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-700 italic font-sans">
                    <span>{exp.company}</span>
                    {exp.location && <span>{exp.location}</span>}
                  </div>
                  {exp.description && (
                    <div 
                      className="text-xs leading-relaxed text-zinc-700 text-justify mt-1"
                      dangerouslySetInnerHTML={{ __html: exp.description }}
                    />
                  )}
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1">
                      {exp.bullets.map((bullet: string, bidx: number) => (
                        <li key={bidx} className="text-xs leading-relaxed text-zinc-700 text-justify">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {parsed.projects && parsed.projects.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans mb-3 border-b border-zinc-200 pb-0.5">
              Projects
            </h2>
            <div className="space-y-3">
              {parsed.projects.map((proj: any, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-bold text-zinc-900">
                      {proj.name}
                      {proj.url && (
                        <span className="text-[10px] font-sans text-zinc-500 font-normal ml-1.5 print:hidden">
                          ({proj.url})
                        </span>
                      )}
                    </h3>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="text-[9px] font-sans text-zinc-600 font-semibold uppercase tracking-wider">
                        {proj.technologies.join(" / ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-700 text-justify">
                    {proj.description}
                  </p>
                  {proj.bullets && proj.bullets.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      {proj.bullets.map((bullet: string, bidx: number) => (
                        <li key={bidx} className="text-xs leading-relaxed text-zinc-700 text-justify">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Publications */}
        {parsed.publications && parsed.publications.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans mb-3 border-b border-zinc-200 pb-0.5">
              Publications
            </h2>
            <div className="space-y-3">
              {parsed.publications.map((pub: any, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xs font-bold text-zinc-900">{pub.title}</h3>
                    {pub.date && (
                      <span className="text-[10px] font-sans text-zinc-600 font-medium">
                        {pub.date}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-700 italic font-sans">
                    <span>{pub.event || "Published Paper"}</span>
                  </div>
                  {pub.description && (
                    <p className="text-xs leading-relaxed text-zinc-700 text-justify">
                      {pub.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {parsed.education && parsed.education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 font-sans mb-2 border-b border-zinc-200 pb-0.5">
              Education
            </h2>
            <div className="space-y-2.5">
              {parsed.education.map((edu: any, idx: number) => (
                <div key={idx} className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900">{edu.degree}</h3>
                    <p className="text-[11px] text-zinc-700 font-sans mt-0.5">
                      {edu.institution} {edu.location && `| ${edu.location}`}
                    </p>
                  </div>
                  <span className="text-[10px] font-sans text-zinc-600 font-medium">
                    {edu.graduationDate}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
