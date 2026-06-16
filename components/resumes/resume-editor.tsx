"use client";

import React, { useState, useRef } from "react";
import { 
  SquaresFour, 
  FileText, 
  Wrench, 
  Sparkle,
  DownloadSimple,
  DotsThreeVertical,
  CaretDown,
  CaretUp,
  PencilSimple,
  Eye,
  EyeSlash,
  Trash,
  Plus,
  TextB,
  TextItalic,
  TextUnderline,
  ListBullets,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  Robot,
  Translate,
  TextAa,
  Lightbulb,
  Check,
  ArrowLeft,
  Link as LinkIcon,
  Envelope,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Globe,
  Certificate,
  Star,
  Folder,
  Books,
  Trophy,
  Buildings,
  Users,
  PenNib,
  PuzzlePiece,
  BookOpen,
  DotsSix,
  IdentificationCard
} from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { saveResumeAction } from "@/app/actions/resume";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

type TabType = "overview" | "content" | "customize" | "ai-tools";
type CustomizeTabType = "document" | "templates" | "layout" | "font-size" | "spacing" | "entries" | "headings" | "font" | "colors" | "header" | "photo" | "links" | "footer" | "sections";

export interface ResumeState {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  profileHeading?: string;
  profileEntries?: Array<{
    id: string;
    text: string;
    isVisible: boolean;
  }>;
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    bullets: string[];
    isVisible: boolean;
  }>;
  education: Array<{
    id: string;
    degree: string;
    institution: string;
    location: string;
    graduationDate: string;
  }>;
  skills: string[];
  projects: Array<{
    id: string;
    name: string;
    url?: string;
    technologies: string[];
    description: string;
    bullets: string[];
  }>;
  publications: Array<{
    id: string;
    title: string;
    date: string;
    event: string;
    description: string;
  }>;
}

export function ResumeEditor() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [activeCustomizeTab, setActiveCustomizeTab] = useState<CustomizeTabType>("layout");
  const [expandedSection, setExpandedSection] = useState<string>("Professional Experience");
  const [isSaving, setIsSaving] = useState(false);
  
  const [resumeData, setResumeData] = useState<ResumeState>({
    contact: {
      name: "Shaik Mohammad Asrar Ahammad",
      email: "asrarahammadshaik@gmail.com",
      phone: "8790344785",
      location: "Bangalore",
      linkedin: "",
      github: "github.com/Asrar-Ahammad",
      portfolio: ""
    },
    summary: "Python backend engineer with production experience in distributed systems, AWS (EC2, ECR), and AI/ML pipelines. Built microservices and automated workflows.",
    profileHeading: "Profile",
    profileEntries: [
      {
        id: "1",
        text: "Software Development Engineer with production experience in React and Python, spanning frontend architecture, backend services, and cloud infrastructure.",
        isVisible: false
      },
      {
        id: "2",
        text: "Python backend engineer with production experience in distributed systems, AWS (EC2, ECR), and AI/ML pipelines. Built microservices and automated workflows.",
        isVisible: true
      }
    ],
    experience: [
      {
        id: "1",
        title: "Systems Engineer",
        company: "Tata Consultancy Services",
        location: "Bangalore",
        startDate: "08/2024",
        endDate: "Present",
        description: "Python Automation Tool - Python, Flet, SQL",
        bullets: [
          "Built a desktop automation tool using Python and Flet that queried SQL databases to fetch commit metadata and file changes, auto-generating structured Word documentation for release cycles.",
          "Reduced documentation turnaround from 2 days to under 1 hour (~95% reduction) across a team of 3, eliminating manual documentation effort during releases."
        ],
        isVisible: true
      }
    ],
    education: [
      {
        id: "1",
        degree: "B.Tech Artificial Intelligence and Data Science - 9.25 CGPA",
        institution: "B.S.A Crescent Institute of Science and Technology",
        location: "Chennai",
        graduationDate: "2020 - 2024",
      }
    ],
    skills: ["Python (Flask, Scikit learn, Tensorflow, Numpy, Pandas)", "Javascript", "Typescript", "React", "NextJS", "HTML", "CSS", "Tailwindcss", "Figma", "NodeJS", "ExpressJS", "Postgres SQL", "pgvector", "AWS (EC2, ECR)", "Redis", "BullMQ", "Docker", "Mongodb", "Machine learning", "Natural Language Processing", "Deep learning", "GenAI"],
    projects: [
      {
        id: "1",
        name: "Momnts",
        technologies: [],
        description: "AI-Powered Event Photo Management Platform",
        bullets: [
          "Architected a 3-tier microservice system (React, Node.js/Express, FastAPI) deployed on AWS EC2 with Docker containers, storing images on Cloudflare R2 and managing container images via AWS ECR.",
          "Built a Python/FastAPI face recognition service using DeepFace embeddings stored in PostgreSQL with pgvector cosine similarity search; offloaded inference to async workers via BullMQ + Redis, decoupling upload latency from AI processing."
        ]
      }
    ],
    publications: []
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveResumeAction(resumeData);
      if (res.success) {
        toast.success("Resume saved successfully!");
        router.push("/resumes");
      } else {
        toast.error("Failed to save resume");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await saveResumeAction(resumeData);
      if (res.success && res.resumeId) {
        toast.success("Preparing download...");
        
        // Remove existing print iframe if any
        const oldIframe = document.getElementById("print-resume-iframe");
        if (oldIframe) oldIframe.remove();

        // Create a hidden iframe
        const iframe = document.createElement("iframe");
        iframe.id = "print-resume-iframe";
        iframe.src = `/resumes/export/${res.resumeId}?download=true`;
        iframe.style.position = "fixed";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        
        document.body.appendChild(iframe);

        iframe.onload = () => {
          setTimeout(() => {
            setIsDownloading(false);
          }, 1000);
        };
      } else {
        toast.error("Failed to save resume for export");
        setIsDownloading(false);
      }
    } catch (e) {
      toast.error("An error occurred");
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-card/50 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/resumes"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted-foreground hover:text-foreground")}
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-1 bg-accent/10 p-1 rounded-lg border border-border/40">
            <TabButton 
              active={activeTab === "overview"} 
              onClick={() => setActiveTab("overview")}
              icon={<SquaresFour size={14} />} 
              label="Overview" 
            />
            <TabButton 
              active={activeTab === "content"} 
              onClick={() => setActiveTab("content")}
              icon={<FileText size={14} />} 
              label="Content" 
            />
            <TabButton 
              active={activeTab === "customize"} 
              onClick={() => setActiveTab("customize")}
              icon={<Wrench size={14} />} 
              label="Customize" 
            />
            <TabButton 
              active={activeTab === "ai-tools"} 
              onClick={() => setActiveTab("ai-tools")}
              icon={<Sparkle size={14} />} 
              label="AI Tools" 
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select defaultValue="sde">
            <SelectTrigger className="w-[120px] h-8 text-xs bg-accent/10 border-border/40 font-medium">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sde">SDE</SelectItem>
              <SelectItem value="pm">Product Manager</SelectItem>
              <SelectItem value="design">Designer</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog>
            <DialogTrigger render={
              <button type="button" className="inline-flex shrink-0 items-center justify-center rounded-md border border-border/40 bg-card h-8 text-xs font-semibold px-3 gap-1.5 hover:bg-accent/10 text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <Eye size={14} />
                <span>Preview</span>
              </button>
            } />
            <DialogContent className="max-w-[850px] sm:max-w-[850px] w-[95vw] max-h-[90vh] overflow-y-auto custom-scrollbar p-6 bg-zinc-950 border-border/40 flex justify-center">
              <div className="scale-[0.95] origin-top">
                <ResumePreview resumeData={resumeData} />
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={handleSave} disabled={isSaving} variant="outline" className="h-8 border-border/40 bg-card text-xs px-3 font-semibold hover:bg-accent/10">
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>

          <Button onClick={handleDownload} disabled={isDownloading} className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 gap-1.5 font-semibold">
            <span>{isDownloading ? "Preparing..." : "Download"}</span>
            {!isDownloading && <DownloadSimple size={14} weight="bold" />}
          </Button>
          
          <Button variant="outline" size="icon" className="h-8 w-8 border-border/40 bg-card">
            <DotsThreeVertical size={16} weight="bold" />
          </Button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar (Dynamic based on Tab) */}
        <aside className="w-[400px] border-r border-border/40 bg-card/30 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-6 h-full">
            {activeTab === "content" && <ContentSidebar expandedSection={expandedSection} setExpandedSection={setExpandedSection} resumeData={resumeData} setResumeData={setResumeData} />}
            {activeTab === "customize" && <CustomizeSidebar activeTab={activeCustomizeTab} setActiveTab={setActiveCustomizeTab} />}
            {activeTab === "ai-tools" && <AiToolsSidebar />}
            {activeTab === "overview" && <div className="text-muted-foreground text-sm">Overview dashboard...</div>}
          </div>
        </aside>

        {/* Right Preview Panel */}
        <main className="flex-1 bg-accent/5 overflow-y-auto p-8 flex justify-center items-start custom-scrollbar">
          <ResumePreview resumeData={resumeData} />
        </main>
        
      </div>
    </div>
  );
}

// --- Sidebar Components ---

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
        active 
          ? "bg-background text-primary shadow-sm border border-border/40" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
      )}
    >
      {active && icon}
      {!active && <span className="opacity-70">{icon}</span>}
      {label}
    </button>
  );
}

interface ProfileEntryEditorProps {
  entry: any;
  onChange: (text: string) => void;
  onAlign: (align: string) => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function ProfileEntryEditor({
  entry,
  onChange,
  onAlign,
  onToggleVisibility,
  onDelete,
  onClose,
}: ProfileEntryEditorProps) {
  const localEditorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const savedRangeRef = useRef<Range | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState<"improve" | "grammar" | "shorter" | null>(null);

  const handleAiCall = async (action: "improve" | "grammar" | "shorter") => {
    setIsAiLoading(true);
    setAiAction(action);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: entry.text, action, section: "profile" })
      });
      const data = await res.json();
      if (data.result) {
        setAiSuggestion(data.result);
      } else {
        toast.error("Failed to generate suggestion");
      }
    } catch (e) {
      console.error(e);
      toast.error("AI service error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLinkClick = () => {
    localEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      setShowLinkDialog(true);
    } else {
      setShowLinkDialog(true);
    }
  };

  const handleInsertLink = () => {
    setShowLinkDialog(false);
    if (!linkUrl) return;

    localEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    document.execCommand("createLink", false, linkUrl);
    setLinkUrl("https://");
    savedRangeRef.current = null;

    if (localEditorRef.current) {
      onChange(localEditorRef.current.innerHTML);
    }
  };

  const applyFormatting = (type: "bold" | "italic" | "underline" | "bullet" | "link") => {
    localEditorRef.current?.focus();
    
    switch (type) {
      case "bold":
        document.execCommand("bold", false);
        break;
      case "italic":
        document.execCommand("italic", false);
        break;
      case "underline":
        document.execCommand("underline", false);
        break;
      case "bullet":
        document.execCommand("insertUnorderedList", false);
        break;
      case "link":
        handleLinkClick();
        return;
    }

    if (localEditorRef.current) {
      onChange(localEditorRef.current.innerHTML);
    }
  };

  const renderedContent = React.useMemo(() => {
    return <span dangerouslySetInnerHTML={{ __html: entry.text || "" }} />;
  }, [entry.id]);

  return (
    <div className="p-5 rounded-xl glass-card bg-card/50 backdrop-blur shadow-lg border-border/40 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="text-sm font-bold text-foreground">Edit Entry</h4>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground font-semibold px-2"
          >
            <Lightbulb size={14} /> Get Tips
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border/40 bg-background/50"
          >
            {entry.isVisible ? <Eye size={14} /> : <EyeSlash size={14} />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40 bg-background/50"
          >
            <Trash size={14} />
          </Button>
        </div>
      </div>

      {/* Text Field Label & Editor Area */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground/80">Professional Summary</label>
        <div className="space-y-3">
          <div className="border border-border/40 rounded-xl overflow-hidden bg-accent/5 focus-within:border-primary/50 transition-colors flex flex-col justify-between">
            <div>
              {/* Toolbar */}
              <div className="flex items-center gap-1 p-1.5 border-b border-border/40 bg-card/60 flex-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyFormatting("bold")}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Bold"
                >
                  <TextB size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyFormatting("italic")}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Italic"
                >
                  <TextItalic size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyFormatting("underline")}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Underline"
                >
                  <TextUnderline size={13} />
                </Button>
                
                <div className="w-px h-3 bg-border mx-1" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyFormatting("bullet")}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Bullet List"
                >
                  <ListBullets size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyFormatting("link")}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  title="Add Link"
                >
                  <LinkIcon size={13} />
                </Button>
                
                <div className="w-px h-3 bg-border mx-1" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onAlign("left")}
                  className={cn(
                    "h-6 w-6 text-muted-foreground hover:text-foreground",
                    (!entry.align || entry.align === "left") && "bg-primary/20 text-primary"
                  )}
                  title="Align Left"
                >
                  <TextAlignLeft size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onAlign("center")}
                  className={cn(
                    "h-6 w-6 text-muted-foreground hover:text-foreground",
                    (entry.align === "center") && "bg-primary/20 text-primary"
                  )}
                  title="Align Center"
                >
                  <TextAlignCenter size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onAlign("right")}
                  className={cn(
                    "h-6 w-6 text-muted-foreground hover:text-foreground",
                    (entry.align === "right") && "bg-primary/20 text-primary"
                  )}
                  title="Align Right"
                >
                  <TextAlignRight size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onAlign("justify")}
                  className={cn(
                    "h-6 w-6 text-muted-foreground hover:text-foreground",
                    (entry.align === "justify") && "bg-primary/20 text-primary"
                  )}
                  title="Justify"
                >
                  <TextAlignJustify size={13} />
                </Button>
              </div>
              {/* Rich Editor contentEditable */}
              <div
                contentEditable
                ref={localEditorRef}
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                suppressContentEditableWarning
                className="border-0 min-h-[110px] text-xs outline-none bg-transparent px-3 py-2 placeholder:text-muted-foreground/60 leading-relaxed text-foreground select-text"
                style={{ textAlign: (entry.align || "left") as any }}
              >
                {renderedContent}
              </div>
            </div>
          </div>

          {/* AI Suggestion Card */}
          {aiSuggestion && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                    <Robot size={14} weight="bold" /> AI SUGGESTION
                  </span>
                  <span className="text-[9px] text-muted-foreground capitalize font-medium">{aiAction}d</span>
                </div>
                <div 
                  className="text-xs leading-relaxed text-foreground bg-background/50 p-3 rounded-lg border border-border/40 max-h-[120px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: aiSuggestion }}
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-2 border-t border-border/10">
                <Button
                  onClick={() => {
                    setAiSuggestion(null);
                    setAiAction(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] hover:bg-accent/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAiCall(aiAction!)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] border-border/40 hover:bg-accent/10"
                >
                  Rewrite
                </Button>
                <Button
                  onClick={() => {
                    onChange(aiSuggestion);
                    if (localEditorRef.current) {
                      localEditorRef.current.innerHTML = aiSuggestion;
                    }
                    setAiSuggestion(null);
                    setAiAction(null);
                  }}
                  size="sm"
                  className="h-7 text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Insert
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI features footer */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <div className="p-1.5 rounded-lg border border-border/40 bg-background/50 text-primary">
          <Robot size={15} weight="bold" />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("improve")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "improve" ? "Improving..." : "Improve Writing"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("grammar")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "grammar" ? "Checking..." : "Grammar Check"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("shorter")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "shorter" ? "Shortening..." : "Shorter"}
        </Button>
      </div>

      {/* Done button container */}
      <div className="pt-3 border-t border-border/20 flex justify-center">
        <Button
          onClick={onClose}
          className="w-full max-w-[280px] h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 rounded-xl transition-all shadow-md shadow-primary/10"
        >
          <Check size={16} weight="bold" /> Done
        </Button>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-950/90 border-border/40 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-9 text-xs bg-accent/10 border-border/40 text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkDialog(false)}
                className="h-8 text-xs hover:bg-accent/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleInsertLink}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ExperienceEntryEditorProps {
  exp: any;
  onChange: (field: string, value: string) => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function ExperienceEntryEditor({
  exp,
  onChange,
  onToggleVisibility,
  onDelete,
  onClose,
}: ExperienceEntryEditorProps) {
  const localEditorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const savedRangeRef = useRef<Range | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState<"improve" | "grammar" | "shorter" | "suggest" | null>(null);

  const handleLinkClick = () => {
    localEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      setShowLinkDialog(true);
    } else {
      setShowLinkDialog(true);
    }
  };

  const handleInsertLink = () => {
    setShowLinkDialog(false);
    if (!linkUrl) return;

    localEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    document.execCommand("createLink", false, linkUrl);
    setLinkUrl("https://");
    savedRangeRef.current = null;

    if (localEditorRef.current) {
      onChange("description", localEditorRef.current.innerHTML);
    }
  };

  const applyFormatting = (type: "bold" | "italic" | "underline" | "bullet" | "link" | "left" | "center" | "right" | "justify") => {
    localEditorRef.current?.focus();
    
    switch (type) {
      case "bold":
        document.execCommand("bold", false);
        break;
      case "italic":
        document.execCommand("italic", false);
        break;
      case "underline":
        document.execCommand("underline", false);
        break;
      case "bullet":
        document.execCommand("insertUnorderedList", false);
        break;
      case "link":
        handleLinkClick();
        return;
      case "left":
        document.execCommand("justifyLeft", false);
        break;
      case "center":
        document.execCommand("justifyCenter", false);
        break;
      case "right":
        document.execCommand("justifyRight", false);
        break;
      case "justify":
        document.execCommand("justifyFull", false);
        break;
    }

    if (localEditorRef.current) {
      onChange("description", localEditorRef.current.innerHTML);
    }
  };

  const handleAiCall = async (action: "improve" | "grammar" | "shorter" | "suggest") => {
    setIsAiLoading(true);
    setAiAction(action);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: exp.description || "", action: action === "suggest" ? "improve" : action, section: "experience" })
      });
      const data = await res.json();
      if (data.result) {
        setAiSuggestion(data.result);
      } else {
        toast.error("Failed to generate suggestion");
      }
    } catch (e) {
      console.error(e);
      toast.error("AI service error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderedContent = React.useMemo(() => {
    return <span dangerouslySetInnerHTML={{ __html: exp.description || "" }} />;
  }, [exp.id]);

  return (
    <div className="mt-4 p-5 rounded-2xl glass-card bg-card/50 backdrop-blur shadow-lg border-border/40 space-y-4 relative text-foreground animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="text-sm font-bold text-foreground">Edit Entry</h4>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground font-semibold px-2"
          >
            <Lightbulb size={14} /> Get Tips
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border/40 bg-background/50"
          >
            {exp.isVisible ? <Eye size={14} /> : <EyeSlash size={14} />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40 bg-background/50"
          >
            <Trash size={14} />
          </Button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-foreground/85">Job Title</label>
          <Input 
            value={exp.title || ""} 
            onChange={(e) => onChange("title", e.target.value)} 
            placeholder="Systems Engineer"
            className="h-10 text-xs bg-accent/5 border-border/40 text-foreground"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-foreground/85">Employer</label>
          <div className="relative flex items-center">
            <Input 
              value={exp.company || ""} 
              onChange={(e) => onChange("company", e.target.value)} 
              placeholder="Tata Consultancy Services"
              className="h-10 text-xs bg-accent/5 border-border/40 text-foreground pr-20"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const url = window.prompt("Enter Employer URL:", "https://");
                if (url) onChange("companyUrl", url);
              }}
              className="absolute right-1.5 h-7 text-[10px] gap-1 px-2 border border-border/40 bg-card hover:bg-accent/10"
            >
              <LinkIcon size={12} /> Link
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/85">Start Date</label>
            <div className="relative flex items-center">
              <Input 
                value={exp.startDate || ""} 
                onChange={(e) => onChange("startDate", e.target.value)} 
                placeholder="08/2024"
                className="h-10 text-xs bg-accent/5 border-border/40 text-foreground pr-8"
              />
              {exp.startDate && (
                <button 
                  type="button"
                  onClick={() => onChange("startDate", "")}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/85">End Date</label>
            <div className="relative flex items-center">
              <Input 
                value={exp.endDate || ""} 
                onChange={(e) => onChange("endDate", e.target.value)} 
                placeholder="present"
                className="h-10 text-xs bg-accent/5 border-border/40 text-foreground pr-8"
              />
              {exp.endDate && (
                <button 
                  type="button"
                  onClick={() => onChange("endDate", "")}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/85">Location</label>
            <Input 
              value={exp.location || ""} 
              onChange={(e) => onChange("location", e.target.value)} 
              placeholder="Bangalore"
              className="h-10 text-xs bg-accent/5 border-border/40 text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground/85">Description</label>
        <div className="space-y-3">
          <div className="border border-border/40 rounded-xl overflow-hidden bg-accent/5 focus-within:border-primary/50 transition-colors flex flex-col justify-between">
            <div>
              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 p-1.5 border-b border-border/40 bg-card/60 flex-wrap">
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("bold")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextB size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("italic")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextItalic size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("underline")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextUnderline size={13} /></Button>
                <div className="w-px h-3 bg-border mx-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("bullet")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><ListBullets size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("link")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><LinkIcon size={13} /></Button>
                <div className="w-px h-3 bg-border mx-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("left")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignLeft size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("center")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignCenter size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("right")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignRight size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("justify")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignJustify size={13} /></Button>
              </div>
              {/* contentEditable Div */}
              <div
                contentEditable
                ref={localEditorRef}
                onInput={(e) => onChange("description", e.currentTarget.innerHTML)}
                suppressContentEditableWarning
                className="border-0 min-h-[120px] text-xs outline-none bg-transparent px-3 py-2 leading-relaxed text-foreground select-text"
              >
                {renderedContent}
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                    <Robot size={14} weight="bold" /> AI SUGGESTION
                  </span>
                  <span className="text-[9px] text-muted-foreground capitalize font-medium">{aiAction}d</span>
                </div>
                <div 
                  className="text-xs leading-relaxed text-foreground bg-background/50 p-3 rounded-lg border border-border/40 max-h-[120px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: aiSuggestion }}
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-2 border-t border-border/10">
                <Button
                  onClick={() => {
                    setAiSuggestion(null);
                    setAiAction(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] hover:bg-accent/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAiCall(aiAction!)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] border-border/40 hover:bg-accent/10"
                >
                  Rewrite
                </Button>
                <Button
                  onClick={() => {
                    onChange("description", aiSuggestion);
                    if (localEditorRef.current) {
                      localEditorRef.current.innerHTML = aiSuggestion;
                    }
                    setAiSuggestion(null);
                    setAiAction(null);
                  }}
                  size="sm"
                  className="h-7 text-[10px] bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                >
                  Insert
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Helper Footer */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <div className="p-1.5 rounded-lg border border-border/40 bg-background/50 text-primary">
          <Robot size={15} weight="bold" />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("improve")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "improve" ? "Improving..." : "Improve Writing"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("suggest")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "suggest" ? "Suggesting..." : "Suggest Content"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("grammar")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "grammar" ? "Checking..." : "Grammar Check"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("shorter")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "shorter" ? "Shortening..." : "Shorter"}
        </Button>
      </div>

      {/* Done button container */}
      <div className="pt-3 border-t border-border/20 flex justify-center">
        <Button
          onClick={onClose}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 rounded-xl transition-all shadow-md shadow-primary/10"
        >
          <Check size={16} weight="bold" /> Done
        </Button>
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-950/90 border-border/40 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-9 text-xs bg-accent/10 border-border/40 text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkDialog(false)}
                className="h-8 text-xs hover:bg-accent/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleInsertLink}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EducationEntryEditorProps {
  edu: any;
  onChange: (field: string, value: string) => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function EducationEntryEditor({
  edu,
  onChange,
  onToggleVisibility,
  onDelete,
  onClose,
}: EducationEntryEditorProps) {
  const localEditorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const savedRangeRef = useRef<Range | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiAction, setAiAction] = useState<"improve" | "grammar" | "shorter" | "suggest" | null>(null);

  const handleLinkClick = () => {
    localEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      setShowLinkDialog(true);
    } else {
      setShowLinkDialog(true);
    }
  };

  const handleInsertLink = () => {
    setShowLinkDialog(false);
    if (!linkUrl) return;

    localEditorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }

    document.execCommand("createLink", false, linkUrl);
    setLinkUrl("https://");
    savedRangeRef.current = null;

    if (localEditorRef.current) {
      onChange("description", localEditorRef.current.innerHTML);
    }
  };

  const applyFormatting = (type: "bold" | "italic" | "underline" | "bullet" | "link" | "left" | "center" | "right" | "justify") => {
    localEditorRef.current?.focus();
    
    switch (type) {
      case "bold":
        document.execCommand("bold", false);
        break;
      case "italic":
        document.execCommand("italic", false);
        break;
      case "underline":
        document.execCommand("underline", false);
        break;
      case "bullet":
        document.execCommand("insertUnorderedList", false);
        break;
      case "link":
        handleLinkClick();
        return;
      case "left":
        document.execCommand("justifyLeft", false);
        break;
      case "center":
        document.execCommand("justifyCenter", false);
        break;
      case "right":
        document.execCommand("justifyRight", false);
        break;
      case "justify":
        document.execCommand("justifyFull", false);
        break;
    }

    if (localEditorRef.current) {
      onChange("description", localEditorRef.current.innerHTML);
    }
  };

  const handleAiCall = async (action: "improve" | "grammar" | "shorter" | "suggest") => {
    setIsAiLoading(true);
    setAiAction(action);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: edu.description || "", action: action === "suggest" ? "improve" : action, section: "education" })
      });
      const data = await res.json();
      if (data.result) {
        setAiSuggestion(data.result);
      } else {
        toast.error("Failed to generate suggestion");
      }
    } catch (e) {
      console.error(e);
      toast.error("AI service error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderedContent = React.useMemo(() => {
    return <span dangerouslySetInnerHTML={{ __html: edu.description || "" }} />;
  }, [edu.id]);

  return (
    <div className="mt-4 p-5 rounded-2xl glass-card bg-card/50 backdrop-blur shadow-lg border-border/40 space-y-4 relative text-foreground animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="text-sm font-bold text-foreground">Edit Entry</h4>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground font-semibold px-2"
          >
            <Lightbulb size={14} /> Get Tips
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border/40 bg-background/50"
          >
            {edu.isVisible !== false ? <Eye size={14} /> : <EyeSlash size={14} />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40 bg-background/50"
          >
            <Trash size={14} />
          </Button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-foreground/85">Degree</label>
          <Input 
            value={edu.degree || ""} 
            onChange={(e) => onChange("degree", e.target.value)} 
            placeholder="Enter Degree / Field Of Study / Exchange Semester"
            className="h-10 text-xs bg-accent/5 border-border/40 text-foreground"
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-foreground/85">School</label>
          <div className="relative flex items-center">
            <Input 
              value={edu.institution || ""} 
              onChange={(e) => onChange("institution", e.target.value)} 
              placeholder="Enter school / university"
              className="h-10 text-xs bg-accent/5 border-border/40 text-foreground pr-20"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const url = window.prompt("Enter School URL:", "https://");
                if (url) onChange("schoolUrl", url);
              }}
              className="absolute right-1.5 h-7 text-[10px] gap-1 px-2 border border-border/40 bg-card hover:bg-accent/10"
            >
              <LinkIcon size={12} /> Link
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/85">Start Date</label>
            <div className="relative flex items-center">
              <Input 
                value={edu.startDate || ""} 
                onChange={(e) => onChange("startDate", e.target.value)} 
                placeholder="MM/YYYY"
                className="h-10 text-xs bg-accent/5 border-border/40 text-foreground pr-8"
              />
              {edu.startDate && (
                <button 
                  type="button"
                  onClick={() => onChange("startDate", "")}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/85">End Date</label>
            <div className="relative flex items-center">
              <Input 
                value={edu.endDate || ""} 
                onChange={(e) => onChange("endDate", e.target.value)} 
                placeholder="MM/YYYY"
                className="h-10 text-xs bg-accent/5 border-border/40 text-foreground pr-8"
              />
              {edu.endDate && (
                <button 
                  type="button"
                  onClick={() => onChange("endDate", "")}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground/85">Location</label>
            <Input 
              value={edu.location || ""} 
              onChange={(e) => onChange("location", e.target.value)} 
              placeholder="City, Country"
              className="h-10 text-xs bg-accent/5 border-border/40 text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-foreground/85">Description</label>
        <div className="space-y-3">
          <div className="border border-border/40 rounded-xl overflow-hidden bg-accent/5 focus-within:border-primary/50 transition-colors flex flex-col justify-between">
            <div>
              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 p-1.5 border-b border-border/40 bg-card/60 flex-wrap">
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("bold")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextB size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("italic")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextItalic size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("underline")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextUnderline size={13} /></Button>
                <div className="w-px h-3 bg-border mx-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("bullet")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><ListBullets size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("link")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><LinkIcon size={13} /></Button>
                <div className="w-px h-3 bg-border mx-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("left")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignLeft size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("center")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignCenter size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("right")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignRight size={13} /></Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => applyFormatting("justify")} className="h-6 w-6 text-muted-foreground hover:text-foreground"><TextAlignJustify size={13} /></Button>
              </div>
              {/* contentEditable Div */}
              <div
                contentEditable
                ref={localEditorRef}
                onInput={(e) => onChange("description", e.currentTarget.innerHTML)}
                suppressContentEditableWarning
                className="border-0 min-h-[120px] text-xs outline-none bg-transparent px-3 py-2 leading-relaxed text-foreground select-text"
              >
                {renderedContent}
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 flex flex-col justify-between animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1.5">
                    <Robot size={14} weight="bold" /> AI SUGGESTION
                  </span>
                  <span className="text-[9px] text-muted-foreground capitalize font-medium">{aiAction}d</span>
                </div>
                <div 
                  className="text-xs leading-relaxed text-foreground bg-background/50 p-3 rounded-lg border border-border/40 max-h-[120px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: aiSuggestion }}
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-2 border-t border-border/10">
                <Button
                  onClick={() => {
                    setAiSuggestion(null);
                    setAiAction(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] hover:bg-accent/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAiCall(aiAction!)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] border-border/40 hover:bg-accent/10"
                >
                  Rewrite
                </Button>
                <Button
                  onClick={() => {
                    onChange("description", aiSuggestion);
                    if (localEditorRef.current) {
                      localEditorRef.current.innerHTML = aiSuggestion;
                    }
                    setAiSuggestion(null);
                    setAiAction(null);
                  }}
                  size="sm"
                  className="h-7 text-[10px] bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                >
                  Insert
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Helper Footer */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <div className="p-1.5 rounded-lg border border-border/40 bg-background/50 text-primary">
          <Robot size={15} weight="bold" />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("improve")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "improve" ? "Improving..." : "Improve Writing"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("suggest")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "suggest" ? "Suggesting..." : "Suggest Content"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("grammar")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "grammar" ? "Checking..." : "Grammar Check"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleAiCall("shorter")}
          disabled={isAiLoading}
          className="h-7 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[10px] transition-colors shadow-none border-0"
        >
          {isAiLoading && aiAction === "shorter" ? "Shortening..." : "Shorter"}
        </Button>
      </div>

      {/* Done button container */}
      <div className="pt-3 border-t border-border/20 flex justify-center">
        <Button
          onClick={onClose}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 rounded-xl transition-all shadow-md shadow-primary/10"
        >
          <Check size={16} weight="bold" /> Done
        </Button>
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-950/90 border-border/40 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-semibold">URL</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-9 text-xs bg-accent/10 border-border/40 text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLinkDialog(false)}
                className="h-8 text-xs hover:bg-accent/10"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleInsertLink}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Insert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContentSidebar({ expandedSection, setExpandedSection, resumeData, setResumeData }: any) {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingProfileEntry, setEditingProfileEntry] = useState<string | null>(null);
  const [editingProfileHeading, setEditingProfileHeading] = useState(false);
  const [editingEduEntry, setEditingEduEntry] = useState<string | null>(null);

  const handleEduChange = (id: string, field: string, value: string) => {
    setResumeData({
      ...resumeData,
      education: (resumeData.education || []).map((e: any) => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const toggleEduVisibility = (id: string) => {
    setResumeData({
      ...resumeData,
      education: (resumeData.education || []).map((e: any) => e.id === id ? { ...e, isVisible: !e.isVisible } : e)
    });
  };

  const handleDeleteEdu = (id: string) => {
    setResumeData({
      ...resumeData,
      education: (resumeData.education || []).filter((e: any) => e.id !== id)
    });
    setEditingEduEntry(null);
  };

  const handleProfileEntryAlign = (id: string, align: string) => {
    const newEntries = profileEntries.map((e: any) => e.id === id ? { ...e, align } : e);
    updateProfileEntries(newEntries);
  };

  const profileEntries = resumeData.profileEntries || [];
  const profileHeading = resumeData.profileHeading || "Profile";

  const updateProfileEntries = (newEntries: any[]) => {
    const joinedSummary = newEntries
      .filter((e: any) => e.isVisible)
      .map((e: any) => e.text)
      .join("\n\n");
    setResumeData({
      ...resumeData,
      profileEntries: newEntries,
      summary: joinedSummary
    });
  };

  const handleProfileEntryChange = (id: string, text: string) => {
    const newEntries = profileEntries.map((e: any) => e.id === id ? { ...e, text } : e);
    updateProfileEntries(newEntries);
  };

  const toggleProfileEntryVisibility = (id: string) => {
    const newEntries = profileEntries.map((e: any) => e.id === id ? { ...e, isVisible: !e.isVisible } : e);
    updateProfileEntries(newEntries);
  };

  const handleAddProfileEntry = () => {
    const newId = Date.now().toString();
    const newEntries = [
      ...profileEntries,
      {
        id: newId,
        text: "",
        isVisible: true
      }
    ];
    updateProfileEntries(newEntries);
    setEditingProfileEntry(newId);
  };

  const handleDeleteProfileEntry = (id: string) => {
    const newEntries = profileEntries.filter((e: any) => e.id !== id);
    updateProfileEntries(newEntries);
    if (editingProfileEntry === id) {
      setEditingProfileEntry(null);
    }
  };

  const handleClearProfileSection = () => {
    updateProfileEntries([]);
    setEditingProfileEntry(null);
  };

  const handleProfileDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const items = [...profileEntries];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    updateProfileEntries(items);
    setDraggedIndex(null);
  };

  const handleExpChange = (id: string, field: string, value: string) => {
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.map((e: any) => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const toggleVisibility = (id: string) => {
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.map((e: any) => e.id === id ? { ...e, isVisible: !e.isVisible } : e)
    });
  };

  const handleDelete = (id: string) => {
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.filter((e: any) => e.id !== id)
    });
    setEditingEntry(null);
  };

  const handleAddExperience = () => {
    const newId = Date.now().toString();
    setResumeData({
      ...resumeData,
      experience: [...resumeData.experience, {
        id: newId,
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        bullets: [],
        isVisible: true
      }]
    });
  };

  const handleAddEducation = () => {
    const newId = Date.now().toString();
    setResumeData({
      ...resumeData,
      education: [...(resumeData.education || []), {
        id: newId,
        degree: "",
        institution: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
        isVisible: true
      }]
    });
    setEditingEduEntry(newId);
  };

  const handleAddSkills = () => {
    setResumeData({
      ...resumeData,
      skills: [...(resumeData.skills || []), "New Skill"]
    });
  };

  const handleAddProject = () => {
    const newId = Date.now().toString();
    setResumeData({
      ...resumeData,
      projects: [...(resumeData.projects || []), {
        id: newId,
        name: "New Project",
        technologies: [],
        description: "",
        bullets: [],
        isVisible: true
      }]
    });
  };

  const handleAddPublication = () => {
    const newId = Date.now().toString();
    setResumeData({
      ...resumeData,
      publications: [...(resumeData.publications || []), {
        id: newId,
        title: "New Publication",
        date: "",
        event: "",
        description: "",
        isVisible: true
      }]
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
      {/* Contact Info Card */}
      <Card className="glass-card p-5 border-border/40 shadow-sm relative group overflow-hidden">
        <Button onClick={() => setEditingContact(!editingContact)} variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full z-10">
          {editingContact ? <Check size={12} weight="bold" /> : <PencilSimple size={12} weight="bold" />}
        </Button>
        <div className="flex gap-4">
          <div className="flex-1 space-y-2.5">
            {editingContact ? (
              <div className="space-y-2 pr-6">
                <Input value={resumeData.contact.name} onChange={(e) => setResumeData({ ...resumeData, contact: { ...resumeData.contact, name: e.target.value } })} className="h-8 text-sm font-bold bg-accent/10" placeholder="Full Name" />
                <Input value={resumeData.contact.email} onChange={(e) => setResumeData({ ...resumeData, contact: { ...resumeData.contact, email: e.target.value } })} className="h-7 text-xs bg-accent/10" placeholder="Email" />
                <Input value={resumeData.contact.phone} onChange={(e) => setResumeData({ ...resumeData, contact: { ...resumeData.contact, phone: e.target.value } })} className="h-7 text-xs bg-accent/10" placeholder="Phone" />
                <Input value={resumeData.contact.location} onChange={(e) => setResumeData({ ...resumeData, contact: { ...resumeData.contact, location: e.target.value } })} className="h-7 text-xs bg-accent/10" placeholder="Location" />
              </div>
            ) : (
              <>
                <h2 className="font-bold text-foreground text-lg">{resumeData.contact.name}</h2>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Envelope size={14} className="opacity-70" /> {resumeData.contact.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="opacity-70" /> {resumeData.contact.phone}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="opacity-70" /> {resumeData.contact.location}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="w-16 h-16 rounded-full bg-accent/20 border border-border/40 flex items-center justify-center text-muted-foreground shrink-0 mt-1">
            <Plus size={20} />
          </div>
        </div>
      </Card>
 
      {/* Sections Accordion List */}
      <div className="space-y-3">
        {/* Profile Section */}
        <div className="border border-border/40 rounded-xl overflow-hidden bg-card/40 transition-all duration-300">
          <button 
            className="w-full flex items-center justify-between p-4 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
            onClick={() => setExpandedSection(expandedSection === "Profile" ? "" : "Profile")}
          >
            <div className="flex items-center gap-3 font-semibold text-sm">
              <FileText size={16} className="text-muted-foreground" />
              {profileHeading}
            </div>
            {expandedSection === "Profile" ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-background">Edit Heading</Badge>
                <CaretUp size={14} className="text-muted-foreground" />
              </div>
            ) : (
              <CaretDown size={14} className="text-muted-foreground" />
            )}
          </button>

        <div className={cn("accordion-panel", expandedSection === "Profile" && "accordion-panel-expanded")}>
          <div className="accordion-inner">
            <div className="p-4 pt-0 space-y-3">
              {/* List of entries */}
              <div className="space-y-2">
                {profileEntries.map((entry: any, index: number) => (
                  <div key={entry.id} className="space-y-2">
                    <div
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleProfileDrop(index)}
                      onClick={() => setEditingProfileEntry(editingProfileEntry === entry.id ? null : entry.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:border-primary/30 transition-colors group cursor-pointer",
                        draggedIndex === index && "opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="cursor-grab text-muted-foreground opacity-50 group-hover:opacity-100 p-0.5">
                          <DotsSix size={16} weight="bold" />
                        </div>
                        <div className={cn("text-xs font-medium truncate flex-1 pr-2", !entry.isVisible && "text-muted-foreground opacity-70")}>
                          {stripHtmlTags(entry.text) || "Empty Profile Entry"}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProfileEntryVisibility(entry.id);
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent/20"
                        >
                          {entry.isVisible ? <Eye size={14} /> : <EyeSlash size={14} />}
                        </Button>
                      </div>
                    </div>

                    {/* Inline edit container for this entry */}
                    {editingProfileEntry === entry.id && (
                      <ProfileEntryEditor
                        entry={entry}
                        onChange={(text) => handleProfileEntryChange(entry.id, text)}
                        onAlign={(align) => handleProfileEntryAlign(entry.id, align)}
                        onToggleVisibility={() => toggleProfileEntryVisibility(entry.id)}
                        onDelete={() => handleDeleteProfileEntry(entry.id)}
                        onClose={() => setEditingProfileEntry(null)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons at the bottom of the section */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  onClick={handleAddProfileEntry}
                  variant="outline"
                  className="flex-1 h-9 bg-background/50 border-dashed border-border/60 hover:bg-accent/10 hover:border-primary/40 text-xs font-semibold gap-1.5"
                >
                  <Plus size={14} weight="bold" />
                  Add Entry
                </Button>
                <Button
                  onClick={handleClearProfileSection}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-border/40 hover:bg-destructive/10 hover:text-destructive shrink-0"
                  title="Clear all entries"
                >
                  <Trash size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Expanded Section Example: Professional Experience */}
        <div className="border border-border/40 rounded-xl overflow-hidden bg-card/40 transition-all duration-300">
          <button 
            className="w-full flex items-center justify-between p-4 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
            onClick={() => setExpandedSection(expandedSection === "Professional Experience" ? "" : "Professional Experience")}
          >
            <div className="flex items-center gap-3 font-semibold text-sm">
              <FileText size={16} className="text-muted-foreground" />
              Professional Experience
            </div>
            {expandedSection === "Professional Experience" ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-background">Edit Heading</Badge>
                <CaretUp size={14} className="text-muted-foreground" />
              </div>
            ) : (
              <CaretDown size={14} className="text-muted-foreground" />
            )}
          </button>
          
        <div className={cn("accordion-panel", expandedSection === "Professional Experience" && "accordion-panel-expanded")}>
          <div className="accordion-inner">
            <div className="p-4 pt-0 space-y-2">
              {resumeData.experience.map((exp: any) => (
                <React.Fragment key={exp.id}>
                  <div onClick={() => setEditingEntry(editingEntry === exp.id ? null : exp.id)} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:border-primary/30 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <DotsThreeVertical size={16} className="text-muted-foreground cursor-grab opacity-50 group-hover:opacity-100" />
                      <div className={cn("text-xs font-medium", !exp.isVisible && "text-muted-foreground")}>{exp.title || "Untitled Role"}{exp.company && `, ${exp.company}`}</div>
                    </div>
                    {exp.isVisible ? (
                      <Eye size={14} className="text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); toggleVisibility(exp.id); }} />
                    ) : (
                      <EyeSlash size={14} className="text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); toggleVisibility(exp.id); }} />
                    )}
                  </div>
                  
                  {editingEntry === exp.id && (
                    <ExperienceEntryEditor
                      exp={exp}
                      onChange={(field, value) => handleExpChange(exp.id, field, value)}
                      onToggleVisibility={() => toggleVisibility(exp.id)}
                      onDelete={() => handleDelete(exp.id)}
                      onClose={() => setEditingEntry(null)}
                    />
                  )}
                </React.Fragment>
              ))}

              <div className="flex items-center gap-2 pt-2">
                <Button onClick={handleAddExperience} variant="outline" className="flex-1 h-9 bg-background/50 border-dashed border-border/60 hover:bg-accent/10 hover:border-primary/40 text-xs font-semibold gap-2">
                  <Plus size={14} weight="bold" />
                  Add Entry
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Education Section */}
        <div className="border border-border/40 rounded-xl overflow-hidden bg-card/40 transition-all duration-300">
          <button 
            className="w-full flex items-center justify-between p-4 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
            onClick={() => setExpandedSection(expandedSection === "Education" ? "" : "Education")}
          >
            <div className="flex items-center gap-3 font-semibold text-sm">
              <FileText size={16} className="text-muted-foreground" />
              Education
            </div>
            {expandedSection === "Education" ? (
              <CaretUp size={14} className="text-muted-foreground" />
            ) : (
              <CaretDown size={14} className="text-muted-foreground" />
            )}
          </button>
          
          <div className={cn("accordion-panel", expandedSection === "Education" && "accordion-panel-expanded")}>
            <div className="accordion-inner">
              <div className="p-4 pt-0 space-y-2">
                {!resumeData.education || resumeData.education.length === 0 ? (
                  <div className="p-4 text-xs text-muted-foreground italic bg-card/10 border border-border/10 rounded-xl flex flex-col items-center">
                    <span>No entries added yet. Click "Add Content" below to add education details.</span>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddEducation();
                      }}
                      variant="outline"
                      className="w-full h-8 mt-3 bg-background/50 border-dashed border-border/60 hover:bg-accent/10 hover:border-primary/40 text-[11px] font-semibold gap-1.5"
                    >
                      <Plus size={13} weight="bold" /> Add Entry
                    </Button>
                  </div>
                ) : (
                  <>
                    {(resumeData.education || []).map((edu: any) => (
                      <React.Fragment key={edu.id}>
                        <div 
                          onClick={() => setEditingEduEntry(editingEduEntry === edu.id ? null : edu.id)} 
                          className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:border-primary/30 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <DotsThreeVertical size={16} className="text-muted-foreground cursor-grab opacity-50 group-hover:opacity-100" />
                            <div className={cn("text-xs font-medium", edu.isVisible === false && "text-muted-foreground")}>
                              {edu.degree || "Untitled Degree"}{edu.institution && `, ${edu.institution}`}
                            </div>
                          </div>
                          {edu.isVisible !== false ? (
                            <Eye 
                              size={14} 
                              className="text-muted-foreground hover:text-foreground" 
                              onClick={(e) => { e.stopPropagation(); toggleEduVisibility(edu.id); }} 
                            />
                          ) : (
                            <EyeSlash 
                              size={14} 
                              className="text-muted-foreground hover:text-foreground" 
                              onClick={(e) => { e.stopPropagation(); toggleEduVisibility(edu.id); }} 
                            />
                          )}
                        </div>
                        
                        {editingEduEntry === edu.id && (
                          <EducationEntryEditor
                            edu={edu}
                            onChange={(field, value) => handleEduChange(edu.id, field, value)}
                            onToggleVisibility={() => toggleEduVisibility(edu.id)}
                            onDelete={() => handleDeleteEdu(edu.id)}
                            onClose={() => setEditingEduEntry(null)}
                          />
                        )}
                      </React.Fragment>
                    ))}
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        onClick={handleAddEducation} 
                        variant="outline" 
                        className="flex-1 h-9 bg-background/50 border-dashed border-border/60 hover:bg-accent/10 hover:border-primary/40 text-xs font-semibold gap-2"
                      >
                        <Plus size={14} weight="bold" />
                        Add Entry
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <AccordionItem title="Skills" icon={<FileText size={16}/>} expandedSection={expandedSection} setExpandedSection={setExpandedSection} onAdd={handleAddSkills} />
        <AccordionItem title="Projects" icon={<FileText size={16}/>} expandedSection={expandedSection} setExpandedSection={setExpandedSection} onAdd={handleAddProject} />
        <AccordionItem title="Publications" icon={<FileText size={16}/>} expandedSection={expandedSection} setExpandedSection={setExpandedSection} onAdd={handleAddPublication} />
      </div>

      <Dialog>
        <DialogTrigger render={
          <button type="button" className="inline-flex shrink-0 items-center justify-center w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 gap-2 mt-4 rounded-xl cursor-pointer transition-all">
            <Plus size={16} weight="bold" />
            Add Content
          </button>
        } />
        <DialogContent className="max-w-[1000px] sm:max-w-[1000px] w-[95vw] p-0 bg-card border-border/40 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-3xl font-bold tracking-tight">Add content</DialogTitle>
          </DialogHeader>
          <div className="p-8 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <AddContentCard icon={<GraduationCap size={16} weight="bold" />} title="Education" desc="Add your degrees and schools. Include your focus, honors, or exchange terms." />
            <AddContentCard icon={<Briefcase size={16} weight="bold" />} title="Professional Experience" desc="Add your professional roles and employer history including internships." />
            <AddContentCard icon={<ShieldCheck size={16} weight="bold" />} title="Skills" desc="Add your hard and soft skills that help you stand out from the crowd today." />
            <AddContentCard icon={<Globe size={16} weight="bold" />} title="Languages" desc="Add your languages and proficiency level to show your communication range." />
            
            <AddContentCard icon={<Certificate size={16} weight="bold" />} title="Certificates" desc="Add your industry certificates or licences. Include issuer and date earned." />
            <AddContentCard icon={<Star size={16} weight="bold" />} title="Interests" desc="Add relevant personal interests that support your career story and cultural fit." />
            <AddContentCard icon={<Folder size={16} weight="bold" />} title="Projects" desc="Add key projects you participated in and highlight your challenges, role, and impact." />
            <AddContentCard icon={<Books size={16} weight="bold" />} title="Courses" desc="Add online or in-person courses and trainings you joined and completed." />
            
            <AddContentCard icon={<Trophy size={16} weight="bold" />} title="Awards" desc="Add your awards and recognitions from industry, competitions, or academia." />
            <AddContentCard icon={<Buildings size={16} weight="bold" />} title="Organisations" desc="Add your memberships or volunteering with organisations including your role." />
            <AddContentCard icon={<BookOpen size={16} weight="bold" />} title="Publications" desc="Add publications, articles, or books you wrote or contributed to." />
            <AddContentCard icon={<Users size={16} weight="bold" />} title="References" desc="Add your references from managers or coworkers, including their contact details." />
            
            <AddContentCard icon={<PenNib size={16} weight="bold" />} title="Declaration" desc="Add your declaration by creating or uploading your personal signature." />
            <AddContentCard icon={<PuzzlePiece size={16} weight="bold" />} title="Custom" desc="Add a custom section for anything else, or combine sections cleanly." isDashed />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddContentCard({ icon, title, desc, isDashed }: { icon: React.ReactNode, title: string, desc: string, isDashed?: boolean }) {
  return (
    <div className={cn("p-5 rounded-xl flex flex-col gap-2 cursor-pointer transition-colors hover:bg-accent/10", isDashed ? "bg-background border border-dashed border-border/60" : "bg-accent/5")}>
      <div className="flex items-center gap-2 font-bold text-sm text-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function AccordionItem({ title, icon, expandedSection, setExpandedSection, onAdd }: { title: string, icon: React.ReactNode, expandedSection: string, setExpandedSection: (s: string) => void, onAdd?: () => void }) {
  const isExpanded = expandedSection === title;
  return (
    <div className="border border-border/40 rounded-xl overflow-hidden bg-card/40 transition-all duration-300">
      <button 
        onClick={() => setExpandedSection(isExpanded ? "" : title)}
        className="w-full flex items-center justify-between p-4 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 font-semibold text-sm">
          <div className="text-muted-foreground">{icon}</div>
          {title}
        </div>
        {isExpanded ? (
          <CaretUp size={14} className="text-muted-foreground" />
        ) : (
          <CaretDown size={14} className="text-muted-foreground" />
        )}
      </button>

      <div className={cn("accordion-panel", isExpanded && "accordion-panel-expanded")}>
        <div className="accordion-inner">
          <div className="p-4 text-xs text-muted-foreground italic bg-card/10 border-t border-border/10 flex flex-col items-center">
            <span>No entries added yet. Click "Add Content" below to add {title.toLowerCase()} details.</span>
            {onAdd && (
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                variant="outline"
                className="w-full h-8 mt-3 bg-background/50 border-dashed border-border/60 hover:bg-accent/10 hover:border-primary/40 text-[11px] font-semibold gap-1.5"
              >
                <Plus size={13} weight="bold" /> Add Entry
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomizeSidebar({ activeTab, setActiveTab }: { activeTab: CustomizeTabType, setActiveTab: (t: CustomizeTabType) => void }) {
  const tabs: {id: CustomizeTabType, label: string}[] = [
    { id: "document", label: "Document" },
    { id: "templates", label: "Templates" },
    { id: "layout", label: "Layout" },
    { id: "font-size", label: "Font Size" },
    { id: "spacing", label: "Spacing" },
    { id: "entries", label: "Entries" },
    { id: "headings", label: "Headings" },
    { id: "font", label: "Font" },
    { id: "colors", label: "Colors" },
    { id: "header", label: "Header" },
    { id: "photo", label: "Photo" },
    { id: "links", label: "Links" },
    { id: "footer", label: "Footer" },
    { id: "sections", label: "Sections" },
  ];

  return (
    <div className="flex h-full animate-in fade-in slide-in-from-left-2">
      {/* Sub-navigation List */}
      <div className="w-24 shrink-0 flex flex-col gap-1 pr-4 border-r border-border/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "text-left px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200",
              activeTab === tab.id 
                ? "text-primary bg-primary/10 border-l-2 border-primary rounded-l-none" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Customize Settings Panel */}
      <div className="flex-1 pl-6 space-y-6 overflow-y-auto custom-scrollbar pb-10">
        {activeTab === "layout" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-bold text-foreground text-sm">Columns</h3>
              <div className="flex gap-2">
                <div className="flex-1 border-2 border-primary bg-primary/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <div className="w-8 h-6 bg-primary rounded-sm opacity-80" />
                  <span className="text-[10px] font-semibold">One</span>
                </div>
                <div className="flex-1 border-2 border-border/40 bg-card rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-border/80">
                  <div className="flex gap-1">
                    <div className="w-4 h-6 bg-muted-foreground rounded-sm opacity-40" />
                    <div className="w-4 h-6 bg-muted-foreground rounded-sm opacity-40" />
                  </div>
                  <span className="text-[10px] font-semibold">Two</span>
                </div>
                <div className="flex-1 border-2 border-border/40 bg-card rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-border/80">
                  <div className="flex flex-col gap-1 w-full items-center">
                    <div className="w-8 h-2 bg-muted-foreground rounded-sm opacity-40" />
                    <div className="flex gap-1">
                      <div className="w-4 h-3 bg-muted-foreground rounded-sm opacity-40" />
                      <div className="w-4 h-3 bg-muted-foreground rounded-sm opacity-40" />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold">Mix</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-foreground text-sm">Change Section Layout</h3>
              <div className="p-3 bg-accent/10 border border-border/40 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                <FileText size={14} /> Personal Details
              </div>
              <div className="space-y-2">
                {["Profile", "Professional Experience", "Education", "Skills", "Projects", "Publications"].map((item) => (
                  <div key={item} className="p-3 bg-card border border-border/40 rounded-lg flex items-center gap-3 text-xs font-semibold hover:border-primary/30 transition-colors cursor-grab">
                    <DotsThreeVertical size={14} className="text-muted-foreground" />
                    <FileText size={14} className="text-muted-foreground" />
                    {item}
                  </div>
                ))}
                <div className="p-3 bg-card border border-dashed border-border/60 rounded-lg flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <DotsThreeVertical size={14} className="opacity-50" />
                  <FileText size={14} className="opacity-50" />
                  Page break
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "font-size" && (
          <div className="space-y-6">
            <h3 className="font-bold text-foreground text-sm">Font Size</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                  <span>Base Font Size</span>
                  <span>10pt</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-8 bg-accent/10 rounded-md flex p-1">
                    <div className="w-1/4 h-full rounded bg-transparent" />
                    <div className="w-1/4 h-full rounded bg-primary" />
                    <div className="w-1/4 h-full rounded bg-transparent" />
                    <div className="w-1/4 h-full rounded bg-transparent" />
                  </div>
                  <div className="flex border border-border/40 rounded-md overflow-hidden">
                    <button className="h-8 w-8 bg-card flex items-center justify-center text-muted-foreground hover:bg-accent">-</button>
                    <div className="w-px bg-border/40" />
                    <button className="h-8 w-8 bg-card flex items-center justify-center text-muted-foreground hover:bg-accent">+</button>
                  </div>
                </div>
              </div>

              {/* Similar sliders for Full Name, Section Headings, Entry Header */}
              {["Full Name", "Section Headings", "Entry Header"].map(item => (
                <div key={item} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>{item}</span>
                    <span>+2pt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-8 bg-accent/10 rounded-md flex p-1">
                      <div className="w-1/4 h-full rounded bg-transparent" />
                      <div className="w-1/4 h-full rounded bg-primary" />
                      <div className="w-1/4 h-full rounded bg-transparent" />
                      <div className="w-1/4 h-full rounded bg-transparent" />
                    </div>
                    <div className="flex border border-border/40 rounded-md overflow-hidden">
                      <button className="h-8 w-8 bg-card flex items-center justify-center text-muted-foreground hover:bg-accent">-</button>
                      <div className="w-px bg-border/40" />
                      <button className="h-8 w-8 bg-card flex items-center justify-center text-muted-foreground hover:bg-accent">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {["document", "templates", "spacing", "entries", "headings", "font", "colors", "header", "photo", "links", "footer", "sections"].includes(activeTab) && (
          <div className="text-sm text-muted-foreground italic p-4 bg-accent/5 rounded-xl border border-dashed border-border/40 text-center">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings panel UI. <br/><br/>(Matches the design from reference screenshots).
          </div>
        )}
      </div>
    </div>
  );
}

function AiToolsSidebar() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
      <Card className="glass-card p-5 border-border/40 bg-gradient-to-br from-primary/10 to-transparent">
        <h3 className="font-bold text-foreground mb-1">Our AI features are available on our Pro plan.</h3>
        <Button className="mt-3 bg-primary text-primary-foreground font-semibold h-8 text-xs">Upgrade to Pro</Button>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">What would you like to do?</h2>

        <Card className="glass-card p-5 border-border/40 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                <Translate size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-foreground">Translate resume</h3>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] py-0 px-1.5 h-4">Beta</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Instantly create a translated copy of your resume in the language of your choice. Your layout stays intact.
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs font-semibold group-hover:bg-accent">Translate now</Button>
          </div>
        </Card>

        <Card className="glass-card p-5 border-border/40 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                <TextAa size={18} className="text-primary" />
                <h3 className="font-bold text-sm text-foreground">Check spelling & grammar</h3>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] py-0 px-1.5 h-4">Beta</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Scan your resume for spelling and grammar issues. We'll provide suggestions on how to fix all of them.
              </p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs font-semibold group-hover:bg-accent">Check now</Button>
          </div>
        </Card>

        <Card className="bg-accent/5 p-4 border border-dashed border-border/40 rounded-xl hover:bg-accent/10 transition-colors cursor-pointer flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-foreground">Got an idea for a new AI tool?</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">We are currently working on new features</p>
          </div>
          <span className="text-[10px] font-semibold text-primary underline">Let us know</span>
        </Card>
      </div>
    </div>
  );
}

function stripHtmlTags(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

function renderFormattedText(text: string) {
  if (!text) return "";
  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}

function ResumePreview({ resumeData }: { resumeData: any }) {
  // A4 aspect ratio 1:1.414. Static HTML layout matching the screenshot closely
  return (
    <div className="w-[800px] bg-white text-black min-h-[1131px] rounded-sm shadow-2xl overflow-hidden shrink-0 animate-in fade-in zoom-in-95 duration-500 transform origin-top resume-content" style={{ padding: '60px 80px' }}>
      {/* Header */}
      <div className="text-center mb-8 border-b pb-4 border-gray-300">
        <h1 className="text-3xl font-bold mb-3">{resumeData.contact.name}</h1>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-700">
          {resumeData.contact.email && <span className="flex items-center gap-1.5"><Envelope size={12}/> {resumeData.contact.email}</span>}
          {resumeData.contact.phone && <span className="flex items-center gap-1.5"><Phone size={12}/> {resumeData.contact.phone}</span>}
          {resumeData.contact.location && <span className="flex items-center gap-1.5"><MapPin size={12}/> {resumeData.contact.location}</span>}
          {resumeData.contact.linkedin && <span className="flex items-center gap-1.5">{resumeData.contact.linkedin}</span>}
          {resumeData.contact.github && <span className="flex items-center gap-1.5">{resumeData.contact.github}</span>}
        </div>
      </div>

      {/* Profile */}
      {(resumeData.summary || (resumeData.profileEntries && resumeData.profileEntries.filter((e: any) => e.isVisible).length > 0)) && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-2">{resumeData.profileHeading || "Profile"}</h2>
          <div className="space-y-2">
            {resumeData.profileEntries && resumeData.profileEntries.filter((e: any) => e.isVisible).length > 0 ? (
              resumeData.profileEntries.filter((e: any) => e.isVisible).map((entry: any) => (
                <p 
                  key={entry.id} 
                  style={{ textAlign: (entry.align || "left") as any }} 
                  className="text-xs leading-relaxed text-gray-800 whitespace-pre-wrap font-sans text-justify"
                >
                  {renderFormattedText(entry.text)}
                </p>
              ))
            ) : (
              <p className="text-xs leading-relaxed text-gray-800 whitespace-pre-wrap font-sans text-justify">
                {renderFormattedText(resumeData.summary)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.filter((e: any) => e.isVisible).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-2">Professional Experience</h2>
          
          {resumeData.experience.filter((e: any) => e.isVisible).map((exp: any) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-bold text-sm">{exp.title}</h3>
                <span className="text-xs text-gray-600">{exp.startDate} - {exp.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs italic text-gray-700">{exp.company}</span>
                <span className="text-xs text-gray-600">{exp.location}</span>
              </div>
              {exp.description && (
                <div 
                  className="text-xs text-gray-800 space-y-1"
                  dangerouslySetInnerHTML={{ __html: exp.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.filter((e: any) => e.isVisible !== false && (e.degree || e.institution)).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-2">Education</h2>
          {resumeData.education.filter((e: any) => e.isVisible !== false && (e.degree || e.institution)).map((edu: any) => (
            <div key={edu.id} className="mb-3">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-bold text-sm">{edu.degree}</h3>
                <span className="text-xs text-gray-600">
                  {edu.startDate || edu.endDate ? `${edu.startDate || ""} - ${edu.endDate || ""}` : edu.graduationDate}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs italic text-gray-700">{edu.institution}</span>
                <span className="text-xs text-gray-600">{edu.location}</span>
              </div>
              {edu.description && (
                <div 
                  className="text-xs text-gray-800 space-y-1 mt-1"
                  dangerouslySetInnerHTML={{ __html: edu.description }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resumeData.skills && resumeData.skills.filter((s: string) => s.trim().length > 0).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-2">Skills</h2>
          <div className="text-xs leading-relaxed font-semibold text-gray-900">
            {resumeData.skills.filter((s: string) => s.trim().length > 0).join(" | ")}
          </div>
        </div>
      )}

      {/* Projects */}
      {resumeData.projects && resumeData.projects.filter((e: any) => e.isVisible !== false && (e.name || e.description)).length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-black pb-1 mb-2">Projects</h2>
          
          {resumeData.projects.filter((e: any) => e.isVisible !== false && (e.name || e.description)).map((proj: any) => (
            <div key={proj.id} className="mb-4">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-bold text-sm">{proj.name}</h3>
                {proj.url && <span className="text-xs text-gray-600">{proj.url}</span>}
              </div>
              {proj.description && <p className="text-xs italic text-gray-700 mb-1">{proj.description}</p>}
              {proj.bullets && proj.bullets.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-gray-800 space-y-1">
                  {proj.bullets.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
