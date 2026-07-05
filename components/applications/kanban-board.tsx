"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ApplicationStatus } from "@/types";
import { cn } from "@/lib/utils";
import { 
  Building, 
  ArrowSquareOut, 
  Sparkle,
  Calendar
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

interface DetailedApplication {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  platform: string;
  status: ApplicationStatus;
  fitScore: number | null;
  notes: string | null;
  coverLetter?: string | null;
  appliedAt: string | null;
  createdAt: string;
  resume?: {
    id: string;
    name: string;
  } | null;
  emailThreads?: {
    id: string;
    gmailThreadId: string;
    subject: string;
    snippet: string;
    sender: string;
    lastMessageDate: string;
  }[];
}

interface KanbanBoardProps {
  applications: DetailedApplication[];
  onStatusChange: (appId: string, newStatus: ApplicationStatus) => void;
  onSelectApp: (app: DetailedApplication) => void;
}

const COLUMNS: { id: ApplicationStatus; title: string; color: string; border: string; bg: string; accentBg: string }[] = [
  { id: "QUEUED", title: "Queued", color: "text-amber-500", border: "border-amber-500/30", bg: "bg-amber-500/10", accentBg: "bg-amber-500" },
  { id: "APPROVED", title: "Approved", color: "text-sky-500", border: "border-sky-500/30", bg: "bg-sky-500/10", accentBg: "bg-sky-500" },
  { id: "APPLYING", title: "Applying", color: "text-indigo-500", border: "border-indigo-500/30", bg: "bg-indigo-500/10", accentBg: "bg-indigo-500" },
  { id: "APPLIED", title: "Applied", color: "text-emerald-500", border: "border-emerald-500/30", bg: "bg-emerald-500/10", accentBg: "bg-emerald-500" },
  { id: "VIEWED", title: "Viewed", color: "text-violet-500", border: "border-violet-500/30", bg: "bg-violet-500/10", accentBg: "bg-violet-500" },
  { id: "INTERVIEWING", title: "Interviewing", color: "text-purple-500", border: "border-purple-500/30", bg: "bg-purple-500/10", accentBg: "bg-purple-500" },
  { id: "OFFERED", title: "Offered", color: "text-pink-500", border: "border-pink-500/30", bg: "bg-pink-500/10", accentBg: "bg-pink-500" },
  { id: "REJECTED", title: "Rejected", color: "text-rose-500", border: "border-rose-500/30", bg: "bg-rose-500/10", accentBg: "bg-rose-500" },
  { id: "WITHDRAWN", title: "Withdrawn", color: "text-zinc-500", border: "border-zinc-500/30", bg: "bg-zinc-500/10", accentBg: "bg-zinc-500" }
];

export function KanbanBoard({ applications, onStatusChange, onSelectApp }: KanbanBoardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setPortalEl(document.body);
    }
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Loading Kanban Board...
      </div>
    );
  }

  // Group applications by status
  const groupedApps = COLUMNS.reduce((acc, col) => {
    acc[col.id] = applications.filter((app) => app.status === col.id);
    return acc;
  }, {} as Record<ApplicationStatus, DetailedApplication[]>);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same column, nothing changes
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId as ApplicationStatus;
    onStatusChange(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex w-full gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin snap-x scroll-smooth">
        {COLUMNS.map((column) => {
          const columnApps = groupedApps[column.id] || [];

          return (
            <div
              key={column.id}
              className="flex w-80 shrink-0 flex-col rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm snap-start"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-border/20 px-4 py-3 bg-accent/5 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", column.color.replace("text", "bg"))} />
                  <h3 className="font-semibold text-foreground text-sm tracking-tight capitalize">
                    {column.title}
                  </h3>
                </div>
                <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold bg-accent/40 text-muted-foreground">
                  {columnApps.length}
                </Badge>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 space-y-3 p-3 min-h-[450px] transition-colors duration-200",
                      snapshot.isDraggingOver ? "bg-accent/10" : "bg-transparent"
                    )}
                  >
                    {columnApps.length === 0 ? (
                      <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground/60">
                        <Building size={20} className="mb-1.5 opacity-40" />
                        No applications
                      </div>
                    ) : (
                      columnApps.map((app, index) => {
                        // Date formatted
                        let displayDate = app.appliedAt;
                        if (app.emailThreads && app.emailThreads.length > 0) {
                          const latestThread = [...app.emailThreads].sort(
                            (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
                          )[0];
                          displayDate = latestThread.lastMessageDate;
                        }
                        const dateStr = displayDate
                          ? new Date(displayDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : null;

                        return (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided, snapshot) => {
                              const cardContent = (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onSelectApp(app)}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                  className={cn(
                                    "group glass-card relative flex flex-col rounded-xl border border-border/40 p-4 bg-card/60 backdrop-blur-md shadow-sm hover:shadow-md hover:border-primary/30 transition-smooth cursor-pointer active:cursor-grabbing",
                                    snapshot.isDragging && "w-[296px] shadow-lg border-primary/50 ring-2 ring-primary/20 scale-[1.02]"
                                  )}
                                >
                                  {/* Left vertical Accent Line */}
                                  <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-r-md", column.accentBg)} />

                                  <div className="pl-1">
                                    {/* Company & External Link */}
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-bold text-foreground text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                                        {app.company}
                                      </h4>
                                      <a
                                        href={app.jobUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                                        title="Open original job posting"
                                      >
                                        <ArrowSquareOut size={14} />
                                      </a>
                                    </div>

                                    {/* Job Title */}
                                    <p className="text-xs text-muted-foreground font-medium mt-1 line-clamp-1">
                                      {app.jobTitle}
                                    </p>

                                    {/* Metadata Line */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-border/10">
                                      {/* Platform Badge */}
                                      <Badge 
                                        variant="outline" 
                                        className="h-5 px-1.5 py-0 text-[10px] font-semibold text-muted-foreground capitalize border-border/40 bg-accent/20"
                                      >
                                        {app.platform}
                                      </Badge>

                                      {/* Fit Score Badge */}
                                      {app.fitScore !== null && (
                                        <div className="flex items-center gap-0.5 rounded bg-primary/10 border border-primary/20 px-1 py-0.5 text-[10px] font-bold text-primary">
                                          <Sparkle size={10} weight="fill" />
                                          <span>{app.fitScore}%</span>
                                        </div>
                                      )}

                                      {/* Date */}
                                      {dateStr && (
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold ml-auto shrink-0">
                                          <Calendar size={11} className="opacity-80" />
                                          <span>{dateStr}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );

                              if (snapshot.isDragging && portalEl) {
                                return createPortal(cardContent, portalEl);
                              }
                              return cardContent;
                            }}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
