"use client";

import { useState, useTransition, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  FilePdf,
  FileArrowUp,
  CheckCircle,
  Trash,
  Plus,
  ArrowRight,
  Sparkle,
  LinkedinLogo,
  GithubLogo,
  Envelope,
  Phone,
  MapPin,
  Spinner,
  CaretRight,
  PencilSimple,
  Check,
  X,
} from "@phosphor-icons/react";
import { Sparkles, Copy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";

interface Resume {
  id: string;
  name: string;
  isMaster: boolean;
  originalFile: string;
  parsedContent: any;
  createdAt: string;
}

interface CoverLetterInfo {
  id: string;
  company: string;
  jobTitle: string;
  coverLetter: string;
  updatedAt: string;
}

interface ResumesClientProps {
  initialResumes: Resume[];
  initialCoverLetters: CoverLetterInfo[];
  setMasterAction: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ success: boolean; error?: string }>;
  tailorAction: (
    resumeId: string,
    jobTitle: string,
    company: string,
    jobDescription: string
  ) => Promise<{ success: boolean; data?: Resume; error?: string }>;
  updateNameAction: (id: string, name: string) => Promise<{ success: boolean; error?: string }>;
  generateCoverLetterAction: (
    resumeId: string,
    jobTitle: string,
    company: string,
    jobDescription: string
  ) => Promise<{ success: boolean; coverLetter?: string; error?: string }>;
}

export function ResumesClient({
  initialResumes,
  initialCoverLetters,
  setMasterAction,
  deleteAction,
  tailorAction,
  updateNameAction,
  generateCoverLetterAction,
}: ResumesClientProps) {
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [coverLetters, setCoverLetters] = useState<CoverLetterInfo[]>(initialCoverLetters);
  const [viewingCL, setViewingCL] = useState<CoverLetterInfo | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(
    initialResumes.find((r) => r.isMaster) || initialResumes[0] || null
  );

  const [uploading, setUploading] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [generatingCL, setGeneratingCL] = useState(false);
  const [generatedCL, setGeneratedCL] = useState("");
  const [copied, setCopied] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Sync edit name state when selected resume changes
  useEffect(() => {
    if (selectedResume) {
      setEditNameValue(selectedResume.name);
      setIsEditingName(false);
    }
  }, [selectedResume?.id]);

  const handleSaveName = () => {
    if (!selectedResume) return;
    if (!editNameValue.trim()) {
      toast.error("Resume name cannot be empty");
      return;
    }
    startTransition(async () => {
      const result = await updateNameAction(selectedResume.id, editNameValue.trim());
      if (result.success) {
        setResumes((prev) =>
          prev.map((r) =>
            r.id === selectedResume.id ? { ...r, name: editNameValue.trim() } : r
          )
        );
        setSelectedResume((prev) =>
          prev ? { ...prev, name: editNameValue.trim() } : null
        );
        setIsEditingName(false);
        toast.success("Resume name updated");
      } else {
        toast.error(result.error || "Failed to update resume name");
      }
    });
  };

  // Dropzone upload logic
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setResumes((prev) => [result.data, ...prev]);
        setSelectedResume(result.data);
        toast.success("Resume uploaded and parsed successfully!");
      } else {
        toast.error(result.error || "Failed to upload and parse resume.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleSetMaster = (id: string) => {
    startTransition(async () => {
      const result = await setMasterAction(id);
      if (result.success) {
        setResumes((prev) =>
          prev.map((r) => ({ ...r, isMaster: r.id === id }))
        );
        setSelectedResume((prev) => (prev ? { ...prev, isMaster: prev.id === id } : null));
        toast.success("Master resume updated");
      } else {
        toast.error(result.error || "Failed to update master resume");
      }
    });
  };

  const triggerDelete = (id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteConfirmOpen(false);
    setDeleteId(null);
    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.success) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
        if (selectedResume?.id === id) {
          const remaining = resumes.filter((r) => r.id !== id);
          setSelectedResume(remaining.find((r) => r.isMaster) || remaining[0] || null);
        }
        toast.success("Resume deleted");
      } else {
        toast.error(result.error || "Failed to delete resume");
      }
    });
  };

  const handleTailor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResume) return;
    if (!jobTitle || !company || !jobDesc) {
      toast.error("Please fill in all target job details.");
      return;
    }

    setTailoring(true);
    try {
      const result = await tailorAction(selectedResume.id, jobTitle, company, jobDesc);
      if (result.success && result.data) {
        setResumes((prev) => [result.data!, ...prev]);
        setSelectedResume(result.data);
        setJobTitle("");
        setCompany("");
        setJobDesc("");
        setTailorOpen(false);
        toast.success("Resume tailored successfully!");
      } else {
        toast.error(result.error || "Failed to tailor resume.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during tailoring.");
    } finally {
      setTailoring(false);
    }
  };

  const handleGenerateCoverLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResume) return;
    if (!jobTitle || !company || !jobDesc) {
      toast.error("Please fill in all target job details.");
      return;
    }

    setGeneratingCL(true);
    try {
      const result = await generateCoverLetterAction(selectedResume.id, jobTitle, company, jobDesc);
      if (result.success && result.coverLetter) {
        setGeneratedCL(result.coverLetter);
        
        // Add the newly persisted cover letter to client state
        const newCL = {
          id: Math.random().toString(), // Temp ID for list rendering key
          company,
          jobTitle,
          coverLetter: result.coverLetter,
          updatedAt: new Date().toISOString(),
        };
        setCoverLetters((prev) => [newCL, ...prev]);
        
        toast.success("Cover letter generated successfully!");
      } else {
        toast.error(result.error || "Failed to generate cover letter.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred during generation.");
    } finally {
      setGeneratingCL(false);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Resumes</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Upload your master resume and generate tailored variants optimized for specific job roles.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {selectedResume && (
            <>
              <Button onClick={() => {
                setGeneratedCL("");
                setCoverLetterOpen(true);
              }} variant="outline" className="gap-1.5 sm:gap-2 shrink-0 bg-card border-border/40 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Generate Cover Letter</span>
                <span className="inline sm:hidden">Cover Letter</span>
              </Button>
              <Button onClick={() => setTailorOpen(true)} variant="outline" className="gap-1.5 sm:gap-2 shrink-0 bg-card border-border/40 text-xs sm:text-sm">
                <Sparkle size={16} weight="fill" />
                <span className="hidden sm:inline">Tailor Resume</span>
                <span className="inline sm:hidden">Tailor</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 w-full min-w-0">
        {/* Left Side: Upload & List */}
        <div className="space-y-6 lg:col-span-1 w-full min-w-0">
          {/* Upload Box */}
          <Card className="glass-card border-border/40 shadow-lg w-full min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Upload Resume</CardTitle>
              <CardDescription>Drag and drop your master PDF resume here</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-smooth bg-accent/5 hover:bg-accent/15",
                  isDragActive ? "border-primary bg-primary/5 scale-95" : "border-border/40",
                  uploading && "opacity-50 pointer-events-none"
                )}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Spinner size={32} className="text-primary animate-spin" />
                ) : (
                  <FileArrowUp size={32} className="text-muted-foreground mb-3" />
                )}
                <p className="text-xs font-semibold text-foreground">
                  {isDragActive ? "Drop the PDF here" : "Drag PDF here, or click to browse"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">PDF format only (Max 5MB)</p>
              </div>
            </CardContent>
          </Card>

          {/* Resume List */}
          <Card className="glass-card border-border/40 shadow-lg w-full min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">My Resumes</CardTitle>
              <CardDescription>All master and tailored resume variants</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                  <FilePdf size={32} className="text-muted-foreground/30 mb-2" />
                  No resumes uploaded yet.
                </div>
              ) : (
                <div className="divide-y divide-border/20 max-h-[350px] overflow-y-auto">
                  {resumes.map((res) => {
                    const isSelected = selectedResume?.id === res.id;
                    return (
                      <div
                        key={res.id}
                        onClick={() => setSelectedResume(res)}
                        className={cn(
                          "flex items-center justify-between px-6 py-3.5 cursor-pointer transition-smooth hover:bg-accent/10",
                          isSelected && "bg-primary/5 border-l-2 border-primary"
                        )}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{res.name}</p>
                            {res.isMaster && (
                              <Badge className="bg-primary/10 border-primary/20 text-primary text-[9px] py-0 px-1.5 font-medium shrink-0">
                                Master
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(res.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <CaretRight size={14} className="text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Cover Letters */}
          <Card className="glass-card border-border/40 shadow-lg w-full min-w-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Cover Letters
              </CardTitle>
              <CardDescription>Persisted letters from your applications</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {coverLetters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-xs text-muted-foreground px-6 text-center">
                  No generated cover letters. Generate one from an application or tailoring workflow.
                </div>
              ) : (
                <div className="divide-y divide-border/20 max-h-[300px] overflow-y-auto">
                  {coverLetters.map((cl) => (
                    <div
                      key={cl.id}
                      onClick={() => setViewingCL(cl)}
                      className="flex items-center justify-between px-6 py-3 cursor-pointer transition-smooth hover:bg-accent/10"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {cl.company}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {cl.jobTitle}
                        </p>
                      </div>
                      <CaretRight size={12} className="text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Preview & Detail & Tailor */}
        <div className="space-y-6 lg:col-span-2 w-full min-w-0">
          {selectedResume ? (
            <>
              {/* Detail view of the selected resume */}
              <Card className="glass-card border-border/40 shadow-lg w-full min-w-0">
                <CardHeader className="flex flex-col gap-4 pb-4 border-b border-border/20 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1 pr-4 flex-1 min-w-0">
                    {isEditingName ? (
                      <div className="flex items-center gap-2 max-w-md mb-1.5">
                        <Input
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          className="text-lg font-bold text-foreground h-9 py-1 bg-accent/20 border-border"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveName();
                            if (e.key === "Escape") setIsEditingName(false);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveName}
                          disabled={isPending}
                          className="h-8 w-8 text-status-applied hover:bg-status-applied/10"
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEditingName(false)}
                          disabled={isPending}
                          className="h-8 w-8 text-muted-foreground hover:bg-accent"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 group/title mb-1.5">
                        <CardTitle className="text-lg font-bold text-foreground break-words max-w-full">
                          {selectedResume.name}
                        </CardTitle>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditNameValue(selectedResume.name);
                            setIsEditingName(true);
                          }}
                          className="h-7 w-7 opacity-0 group-hover/title:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-accent rounded-md flex items-center justify-center shrink-0"
                        >
                          <PencilSimple size={14} />
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground w-full min-w-0">
                      {selectedResume.parsedContent?.contact?.email && (
                        <span className="flex items-center gap-1 min-w-0 break-all">
                          <Envelope size={14} className="shrink-0" />
                          {selectedResume.parsedContent.contact.email}
                        </span>
                      )}
                      {selectedResume.parsedContent?.contact?.phone && (
                        <span className="flex items-center gap-1 min-w-0 break-all">
                          <Phone size={14} className="shrink-0" />
                          {selectedResume.parsedContent.contact.phone}
                        </span>
                      )}
                      {selectedResume.parsedContent?.contact?.location && (
                        <span className="flex items-center gap-1 min-w-0 break-all">
                          <MapPin size={14} className="shrink-0" />
                          {selectedResume.parsedContent.contact.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={`/resumes/export/${selectedResume.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-xs transition-smooth bg-card gap-1.5"
                      )}
                      title="Export PDF"
                    >
                      <FilePdf size={14} />
                      <span>Export PDF</span>
                    </a>
                    {!selectedResume.isMaster && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSetMaster(selectedResume.id)}
                        className="text-xs transition-smooth bg-card gap-1.5"
                        title="Set as Master"
                      >
                        <CheckCircle size={14} />
                        <span>Set as Master</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => triggerDelete(selectedResume.id)}
                      className="text-xs transition-smooth bg-card gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 hover:border-destructive/30"
                    >
                      <Trash size={14} />
                      <span>Delete</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 max-h-[500px] overflow-y-auto">
                  {/* Summary */}
                  {selectedResume.parsedContent?.summary && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Summary</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {selectedResume.parsedContent.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedResume.parsedContent?.skills && selectedResume.parsedContent.skills.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Technical Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedResume.parsedContent.skills.map((skill: string) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-accent/40 text-muted-foreground border-border/40 text-[10px]"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {selectedResume.parsedContent?.experience && selectedResume.parsedContent.experience.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Work Experience</h3>
                      <div className="space-y-4 divide-y divide-border/20">
                        {selectedResume.parsedContent.experience.map((exp: any, idx: number) => (
                          <div key={idx} className={cn("space-y-1.5 w-full min-w-0", idx > 0 && "pt-3.5")}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full min-w-0">
                              <h4 className="text-xs font-bold text-foreground truncate">{exp.title}</h4>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {exp.startDate} – {exp.endDate || "Present"}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-muted-foreground truncate">
                              {exp.company} {exp.location && `| ${exp.location}`}
                            </p>
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className="list-disc pl-4 space-y-1">
                                {exp.bullets.map((bullet: string, bidx: number) => (
                                  <li key={bidx} className="text-[11px] leading-relaxed text-muted-foreground/80">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {selectedResume.parsedContent?.projects && selectedResume.parsedContent.projects.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Projects</h3>
                      <div className="space-y-4 divide-y divide-border/20">
                        {selectedResume.parsedContent.projects.map((proj: any, idx: number) => (
                          <div key={idx} className={cn("space-y-1.5 w-full min-w-0", idx > 0 && "pt-3.5")}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full min-w-0">
                              <h4 className="text-xs font-bold text-foreground truncate">{proj.name}</h4>
                              {proj.url && (
                                <a href={proj.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline shrink-0">
                                  View Project
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {proj.description}
                            </p>
                            {proj.bullets && proj.bullets.length > 0 && (
                              <ul className="list-disc pl-4 space-y-1 mt-1">
                                {proj.bullets.map((bullet: string, bidx: number) => (
                                  <li key={bidx} className="text-[11px] leading-relaxed text-muted-foreground/80">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {proj.technologies && proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {proj.technologies.map((tech: string) => (
                                  <Badge key={tech} variant="outline" className="text-[9px] border-border/40 py-0 px-1 text-muted-foreground">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Publications */}
                  {selectedResume.parsedContent?.publications && selectedResume.parsedContent.publications.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Publications</h3>
                      <div className="space-y-4 divide-y divide-border/20">
                        {selectedResume.parsedContent.publications.map((pub: any, idx: number) => (
                          <div key={idx} className={cn("space-y-1.5 w-full min-w-0", idx > 0 && "pt-3.5")}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full min-w-0">
                              <h4 className="text-xs font-bold text-foreground truncate">{pub.title}</h4>
                              {pub.date && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {pub.date}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-muted-foreground">
                              {pub.event || "Published Paper"}
                            </p>
                            {pub.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {pub.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedResume.parsedContent?.education && selectedResume.parsedContent.education.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Education</h3>
                      <div className="space-y-4 divide-y divide-border/20">
                        {selectedResume.parsedContent.education.map((edu: any, idx: number) => (
                          <div key={idx} className={cn("space-y-1 w-full min-w-0", idx > 0 && "pt-3.5")}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 w-full min-w-0">
                              <h4 className="text-xs font-bold text-foreground truncate">{edu.degree}</h4>
                              {edu.graduationDate && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {edu.graduationDate}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-muted-foreground mt-0.5 w-full min-w-0">
                              <span className="truncate">
                                {edu.institution} {edu.location && `| ${edu.location}`}
                              </span>
                              {edu.gpa && <span className="shrink-0">GPA: {edu.gpa}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {selectedResume.parsedContent?.certifications && selectedResume.parsedContent.certifications.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">Certifications</h3>
                      <ul className="list-disc pl-4 space-y-1">
                        {selectedResume.parsedContent.certifications.map((cert: string, idx: number) => (
                          <li key={idx} className="text-[11px] text-muted-foreground/80">
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground text-center border rounded-xl border-dashed border-border/40 bg-card p-6 h-[400px]">
              <FilePdf size={48} className="text-muted-foreground/30 mb-4" />
              <p className="font-semibold text-foreground text-base">Select or upload a resume to view details</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                You must have a master resume uploaded so the scraper agent can tailor it and submit applications.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tailor Resume Dialog Modal */}
      <Dialog open={tailorOpen} onOpenChange={setTailorOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border/40 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkle size={20} className="text-primary animate-pulse" />
              Tailor Resume with AI
            </DialogTitle>
            <DialogDescription>
              AI will tailor your resume bullets and skills targeting this job profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTailor} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Job Title
                </label>
                <Input
                  placeholder="e.g. Senior Frontend Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-xs h-9"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Company Name
                </label>
                <Input
                  placeholder="e.g. Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-xs h-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Job Description
              </label>
              <Textarea
                placeholder="Paste job details, key qualifications, and tech stack here..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-xs h-40 resize-none overflow-y-auto"
                required
              />
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={tailoring}
                className="font-semibold"
              >
                {tailoring ? (
                  <>
                    <Spinner size={16} className="animate-spin mr-1" />
                    Tailoring...
                  </>
                ) : (
                  "Tailor Resume"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cover Letter Dialog Modal */}
      <Dialog open={coverLetterOpen} onOpenChange={setCoverLetterOpen}>
        <DialogContent className="sm:max-w-xl bg-card border border-border/40 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Cover Letter
            </DialogTitle>
            <DialogDescription>
              AI will write a personalized cover letter matching your resume to this job profile.
            </DialogDescription>
          </DialogHeader>

          {!generatedCL ? (
            <form onSubmit={handleGenerateCoverLetter} className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Job Title
                  </label>
                  <Input
                    placeholder="e.g. Senior Frontend Developer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-xs h-9"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Company Name
                  </label>
                  <Input
                    placeholder="e.g. Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-xs h-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Job Description
                </label>
                <Textarea
                  placeholder="Paste job details, key qualifications, and tech stack here..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-xs h-40 resize-none overflow-y-auto"
                  required
                />
              </div>
              <DialogFooter className="sm:justify-end gap-2">
                <DialogClose render={<Button variant="outline" size="sm" />}>
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  disabled={generatingCL}
                  className="font-semibold text-xs h-8"
                >
                  {generatingCL ? (
                    <>
                      <Spinner size={16} className="animate-spin mr-1 text-primary" />
                      Generating...
                    </>
                  ) : (
                    "Generate Cover Letter"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Generated Cover Letter
                </label>
                <Textarea
                  value={generatedCL}
                  onChange={(e) => setGeneratedCL(e.target.value)}
                  className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-xs h-80 overflow-y-auto resize-none font-sans leading-relaxed text-foreground"
                />
              </div>
              <DialogFooter className="sm:justify-between gap-2 flex flex-col sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGeneratedCL("")}
                  className="w-full sm:w-auto h-8 text-xs"
                >
                  Back / Reset
                </Button>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCL);
                      setCopied(true);
                      toast.success("Copied to clipboard!");
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="gap-1.5 h-8 text-xs bg-accent/40 border border-border/30 hover:bg-accent/60"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                  <DialogClose render={<Button size="sm" className="h-8 text-xs" />}>
                    Done
                  </DialogClose>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Saved Cover Letter Dialog */}
      <Dialog open={!!viewingCL} onOpenChange={(open) => !open && setViewingCL(null)}>
        <DialogContent className="sm:max-w-xl bg-card border border-border/40 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Sparkles className="w-5 h-5 text-primary" />
              Cover Letter for {viewingCL?.company}
            </DialogTitle>
            <DialogDescription>
              Job Title: {viewingCL?.jobTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Textarea
                readOnly
                value={viewingCL?.coverLetter || ""}
                className="bg-accent/5 border-border/40 text-xs h-80 overflow-y-auto resize-none font-sans leading-relaxed text-foreground"
              />
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (viewingCL) {
                    navigator.clipboard.writeText(viewingCL.coverLetter);
                    toast.success("Copied to clipboard!");
                  }
                }}
                className="gap-1.5 h-8 text-xs bg-accent/40 border border-border/30 hover:bg-accent/60"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
                Copy to Clipboard
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={() => setViewingCL(null)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
