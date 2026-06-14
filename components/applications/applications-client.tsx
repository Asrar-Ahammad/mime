"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Funnel,
  PencilSimple,
  Trash,
  ArrowSquareOut,
  Sparkle,
  Calendar,
  Building,
  Note,
  Envelope,
  Check,
  X,
  FileText,
  Plus,
} from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/responsive-sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApplicationStatus } from "@/types";
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

interface ApplicationsClientProps {
  initialApplications: DetailedApplication[];
  updateAction: (id: string, data: { status?: ApplicationStatus; notes?: string }) => Promise<{ success: boolean; error?: string }>;
  deleteAction: (id: string) => Promise<{ success: boolean; error?: string }>;
  bulkDeleteAction: (ids: string[]) => Promise<{ success: boolean; error?: string; count?: number }>;
  createAction: (data: {
    company: string;
    jobTitle: string;
    jobUrl: string;
    jobDescription: string;
    platform: string;
    status: ApplicationStatus;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; application?: any }>;
  initialAppId?: string;
}

export function ApplicationsClient({
  initialApplications,
  updateAction,
  deleteAction,
  bulkDeleteAction,
  createAction,
  initialAppId,
}: ApplicationsClientProps) {
  const [applications, setApplications] = useState<DetailedApplication[]>(initialApplications);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedApp, setSelectedApp] = useState<DetailedApplication | null>(null);
  const [notesEdit, setNotesEdit] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    company: "",
    jobTitle: "",
    jobUrl: "",
    jobDescription: "",
    platform: "direct",
    customPlatform: "",
    status: "APPLIED" as ApplicationStatus,
    notes: "",
  });

  const uniquePlatforms = useMemo(() => {
    const basePlatforms = ["direct", "linkedin", "naukri", "instahyre", "wellfound", "indeed"];
    const allPlatforms = new Set(basePlatforms);
    applications.forEach(app => {
      if (app.platform) allPlatforms.add(app.platform.toLowerCase());
    });
    return Array.from(allPlatforms).sort();
  }, [applications]);

  const [careersSearchOpen, setCareersSearchOpen] = useState(false);
  const [careersSearchQuery, setCareersSearchQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, platformFilter]);

  useEffect(() => {
    if (initialAppId) {
      const app = applications.find((a) => a.id === initialAppId);
      if (app) {
        setSelectedApp(app);
        setNotesEdit(app.notes || "");
        setIsEditingNotes(false);
      }
    }
  }, [initialAppId, applications]);

  const statusColors: Record<ApplicationStatus, string> = {
    QUEUED: "bg-status-queued/10 text-status-queued border-status-queued/20",
    APPROVED: "bg-status-queued/10 text-status-queued border-status-queued/20",
    APPLYING: "bg-status-applied/10 text-status-applied border-status-applied/20",
    APPLIED: "bg-status-applied/10 text-status-applied border-status-applied/20",
    VIEWED: "bg-status-applied/20 text-status-applied border-status-applied/30",
    INTERVIEWING: "bg-status-interviewing/10 text-status-interviewing border-status-interviewing/20",
    OFFERED: "bg-status-offered/10 text-status-offered border-status-offered/20",
    REJECTED: "bg-status-rejected/10 text-status-rejected border-status-rejected/20",
    WITHDRAWN: "bg-muted text-muted-foreground border-border",
  };

  const availableStatuses: ApplicationStatus[] = [
    "QUEUED",
    "APPROVED",
    "APPLYING",
    "APPLIED",
    "VIEWED",
    "INTERVIEWING",
    "OFFERED",
    "REJECTED",
    "WITHDRAWN",
  ];

  // Filtering
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || (app.platform || "direct").toLowerCase() === platformFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / itemsPerPage));
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    const previousApp = applications.find(a => a.id === appId);
    const previousStatus = previousApp?.status;

    // Optimistic UI Update
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    );
    if (selectedApp?.id === appId) {
      setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    startTransition(async () => {
      const result = await updateAction(appId, { status: newStatus });
      if (result.success) {
        toast.success(`Status updated to ${newStatus.toLowerCase()}`);
      } else {
        toast.error(result.error || "Failed to update status");
        // Revert on failure
        if (previousStatus) {
          setApplications((prev) =>
            prev.map((app) => (app.id === appId ? { ...app, status: previousStatus } : app))
          );
          if (selectedApp?.id === appId) {
            setSelectedApp((prev) => (prev ? { ...prev, status: previousStatus } : null));
          }
        }
      }
    });
  };

  const handleNotesSave = async () => {
    if (!selectedApp) return;
    startTransition(async () => {
      const result = await updateAction(selectedApp.id, { notes: notesEdit });
      if (result.success) {
        setApplications((prev) =>
          prev.map((app) => (app.id === selectedApp.id ? { ...app, notes: notesEdit } : app))
        );
        setSelectedApp((prev) => (prev ? { ...prev, notes: notesEdit } : null));
        setIsEditingNotes(false);
        toast.success("Notes updated");
      } else {
        toast.error(result.error || "Failed to update notes");
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
        setApplications((prev) => prev.filter((app) => app.id !== id));
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        if (selectedApp?.id === id) {
          setSelectedApp(null);
        }
        toast.success("Application deleted");
      } else {
        toast.error(result.error || "Failed to delete application");
      }
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedApps.map((a) => a.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedIds);
    setBulkDeleteConfirmOpen(false);
    startTransition(async () => {
      const result = await bulkDeleteAction(ids);
      if (result.success) {
        setApplications((prev) => prev.filter((app) => !selectedIds.has(app.id)));
        if (selectedApp && selectedIds.has(selectedApp.id)) {
          setSelectedApp(null);
        }
        toast.success(`${result.count || ids.length} application(s) deleted`);
        setSelectedIds(new Set());
      } else {
        toast.error(result.error || "Failed to delete applications");
      }
    });
  };

  const pageIds = paginatedApps.map((a) => a.id);
  const allFilteredSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = pageIds.some((id) => selectedIds.has(id));

  const resetAddForm = () => {
    setAddForm({
      company: "",
      jobTitle: "",
      jobUrl: "",
      jobDescription: "",
      platform: "direct",
      customPlatform: "",
      status: "APPLIED" as ApplicationStatus,
      notes: "",
    });
  };

  const handleAddSubmit = () => {
    if (!addForm.company.trim() || !addForm.jobTitle.trim() || !addForm.jobUrl.trim()) {
      toast.error("Company, Job Title, and Job URL are required");
      return;
    }
    
    const finalPlatform = addForm.platform === "__custom__" 
      ? (addForm.customPlatform.trim() || "direct").toLowerCase() 
      : addForm.platform;

    startTransition(async () => {
      const result = await createAction({ ...addForm, platform: finalPlatform });
      if (result.success && result.application) {
        setApplications((prev) => [result.application, ...prev]);
        setAddOpen(false);
        resetAddForm();
        toast.success("Application added");
      } else {
        toast.error(result.error || "Failed to add application");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            View and manage job applications tracked by Mime or submitted by you.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5 sm:gap-2 shrink-0">
          <Plus size={16} weight="bold" />
          <span>Add Application</span>
        </Button>
      </div>

      {/* Hiring Platforms Quick Links */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs rounded-xl bg-accent/5 border border-border/20 p-3">
        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mr-1">
          Hiring Platforms:
        </span>
        {[
          { name: "Wellfound", url: "https://wellfound.com/jobs" },
          { name: "Instahyre", url: "https://www.instahyre.com" },
          { name: "Naukri", url: "https://www.naukri.com" },
          { name: "Indeed", url: "https://www.indeed.com" },
          { name: "LinkedIn", url: "https://www.linkedin.com/jobs" },
        ].map((platform) => (
          <a
            key={platform.name}
            href={platform.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground border border-border/40 hover:text-foreground hover:border-primary/50 hover:bg-accent/20 transition-all duration-200"
          >
            {platform.name}
            <ArrowSquareOut size={12} className="opacity-70" />
          </a>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search by company or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-accent/20 transition-smooth focus-visible:bg-accent/40 w-full"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (searchTerm.trim()) {
                window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerm.trim() + " careers")}`, "_blank");
              } else {
                setCareersSearchOpen(true);
              }
            }}
            className="h-10 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/30 gap-1.5 shrink-0 px-3 transition-all duration-200"
            title="Search any company's career page on Google"
          >
            <ArrowSquareOut size={14} className="text-primary/70" />
            <span>Search Careers</span>
          </Button>
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
          <SelectTrigger className="w-full sm:w-[180px] bg-accent/20 h-10 border-border capitalize">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {availableStatuses.map((st) => (
              <SelectItem key={st} value={st} className="capitalize">
                {st.toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Platform Filter */}
        <Select value={platformFilter} onValueChange={(val) => setPlatformFilter(val || "all")}>
          <SelectTrigger className="w-full sm:w-[180px] bg-accent/20 h-10 border-border capitalize">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {uniquePlatforms.map((plat) => (
              <SelectItem key={plat} value={plat} className="capitalize">
                {plat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={handleBulkDelete}
            disabled={isPending}
          >
            <Trash size={14} />
            Delete Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
            <Building size={48} className="text-muted-foreground/30 mb-4" />
            No applications match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-accent/10">
                  <th className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={allFilteredSelected}
                      indeterminate={someFilteredSelected && !allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all applications"
                    />
                  </th>
                  <th className="px-6 py-4">Company & Role</th>
                  <th className="px-6 py-4">Platform</th>
                  <th className="px-6 py-4">AI Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Applied</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedApps.map((app) => (
                  <tr
                    key={app.id}
                    className="group hover:bg-accent/10 cursor-pointer transition-smooth"
                    onClick={() => {
                      setSelectedApp(app);
                      setNotesEdit(app.notes || "");
                      setIsEditingNotes(false);
                    }}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(app.id)}
                        onCheckedChange={() => toggleSelectOne(app.id)}
                        aria-label={`Select ${app.company}`}
                      />
                    </td>

                    {/* Company and Role */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{app.company}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{app.jobTitle}</div>
                    </td>

                    {/* Platform */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded bg-accent/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize border border-border/40">
                        {app.platform}
                      </span>
                    </td>

                    {/* AI Score */}
                    <td className="px-6 py-4">
                      {app.fitScore ? (
                        <div className="flex items-center gap-1">
                          <Sparkle
                            size={12}
                            weight="fill"
                            className={cn(
                              app.fitScore >= 90
                                ? "text-status-offered"
                                : app.fitScore >= 80
                                ? "text-primary"
                                : "text-status-queued"
                            )}
                          />
                          <span
                            className={cn(
                              "font-bold text-xs",
                              app.fitScore >= 90
                                ? "text-status-offered"
                                : app.fitScore >= 80
                                ? "text-primary"
                                : "text-status-queued"
                            )}
                          >
                            {app.fitScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Status Select inside Table */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={app.status}
                        onValueChange={(val) => {
                          if (val) handleStatusChange(app.id, val as ApplicationStatus);
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-[130px] rounded-full border px-2.5 text-xs font-medium py-0 transition-smooth capitalize",
                            statusColors[app.status]
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStatuses.map((st) => (
                            <SelectItem key={st} value={st} className="text-xs capitalize">
                              {st.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Applied Date */}
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Not applied"}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5 transition-smooth">
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center"
                          )}
                        >
                          <ArrowSquareOut size={16} />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => triggerDelete(app.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {filteredApps.length > 0 && (
          <div className="flex items-center justify-between border-t border-border/50 px-6 py-3 bg-accent/5">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredApps.length)}</span> of <span className="font-medium text-foreground">{filteredApps.length}</span> entries
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn("h-8 w-8 p-0 text-xs", currentPage === pageNum ? "pointer-events-none" : "")}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Sheet */}
      <Sheet open={selectedApp !== null} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-card border-l border-border/40">
          {selectedApp && (
            <div className="space-y-6 pb-4">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded bg-accent/60 px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize border border-border/40"
                    )}
                  >
                    {selectedApp.platform}
                  </span>
                  {selectedApp.fitScore && (
                    <Badge variant="secondary" className="gap-1 bg-primary/10 border-primary/20 text-primary py-0.5">
                      <Sparkle size={12} weight="fill" />
                      {selectedApp.fitScore}% Fit
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <SheetTitle className="text-xl font-bold text-foreground">
                    {selectedApp.jobTitle}
                  </SheetTitle>
                  <SheetDescription className="text-sm font-semibold text-primary/80 flex items-center gap-1">
                    <Building size={14} />
                    {selectedApp.company}
                  </SheetDescription>
                </div>
              </SheetHeader>

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-accent/10 p-4 border border-border/30">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Application Status
                  </p>
                  <Select
                    value={selectedApp.status}
                    onValueChange={(val) => {
                      if (val) handleStatusChange(selectedApp.id, val as ApplicationStatus);
                    }}
                  >
                    <SelectTrigger className={cn("h-8 w-[140px] text-xs font-semibold rounded-md border capitalize", statusColors[selectedApp.status])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((st) => (
                        <SelectItem key={st} value={st} className="text-xs capitalize">
                          {st.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Link to Original Job
                  </p>
                  <a
                    href={selectedApp.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 gap-1.5 text-xs bg-card hover:bg-accent flex items-center justify-center"
                    )}
                  >
                    Open Job Board
                    <ArrowSquareOut size={12} />
                  </a>
                </div>
              </div>

              {/* Linked Resume */}
              {selectedApp.resume && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <FileText size={14} /> Tailored Resume Variant
                  </h3>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-accent/5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-foreground truncate">{selectedApp.resume.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Linked and tailored for this application</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Note size={14} /> My Notes
                  </h3>
                  {!isEditingNotes ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNotes(true)}
                      className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1.5 transition-smooth"
                    >
                      <PencilSimple size={12} /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingNotes(false)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:bg-accent"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleNotesSave}
                        disabled={isPending}
                        className="h-7 px-2.5 text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
                      >
                        <Check size={12} /> Save
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingNotes ? (
                  <Textarea
                    value={notesEdit}
                    onChange={(e) => setNotesEdit(e.target.value)}
                    placeholder="Add interviews dates, phone screening questions, or notes..."
                    rows={4}
                    className="w-full bg-accent/10 border border-border/40 text-sm"
                  />
                ) : (
                  <div className="rounded-xl border border-border/30 bg-accent/5 p-4 text-sm whitespace-pre-wrap leading-relaxed text-foreground min-h-[80px]">
                    {selectedApp.notes ? (
                      selectedApp.notes
                    ) : (
                      <span className="text-muted-foreground/60 italic">No notes added. Click edit to write notes.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  Job Description
                </h3>
                <div className="rounded-xl border border-border/30 bg-accent/5 p-4 text-xs whitespace-pre-wrap leading-relaxed text-muted-foreground max-h-[200px] overflow-y-auto">
                  {selectedApp.jobDescription || "No job description available."}
                </div>
              </div>

              {/* Email Threads */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Envelope size={14} /> Linked Email Threads
                </h3>
                {!selectedApp.emailThreads || selectedApp.emailThreads.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic p-3 bg-accent/5 border border-border/20 rounded-xl">
                    No matching email threads discovered from your Gmail inbox yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedApp.emailThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="flex flex-col gap-2 rounded-xl border border-border/40 bg-accent/5 p-4 transition-smooth hover:bg-accent/10 cursor-pointer"
                        onClick={() => router.push(`/emails?threadId=${thread.gmailThreadId || thread.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                            {thread.sender}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(thread.lastMessageDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-primary/80 truncate">{thread.subject}</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {thread.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog (Single) */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash size={18} className="text-destructive" />
              Delete Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
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
              <Trash size={14} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash size={18} className="text-destructive" />
              Delete {selectedIds.size} Application{selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.size} selected application{selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmBulkDelete}
            >
              <Trash size={14} />
              Delete {selectedIds.size} Application{selectedIds.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Careers Dialog */}
      <Dialog open={careersSearchOpen} onOpenChange={setCareersSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowSquareOut size={20} className="text-primary" />
              Find Company Careers Page
            </DialogTitle>
            <DialogDescription>
              Enter a company name to find and open their official careers page.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!careersSearchQuery.trim()) return;
            window.open(`https://www.google.com/search?q=${encodeURIComponent(careersSearchQuery.trim() + " careers")}`, "_blank");
            setCareersSearchOpen(false);
            setCareersSearchQuery("");
          }} className="space-y-4 pt-2">
            <Input
              placeholder="e.g. Stripe, OpenAI, Google..."
              value={careersSearchQuery}
              onChange={(e) => setCareersSearchQuery(e.target.value)}
              className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 text-sm h-10"
              autoFocus
            />
            <DialogFooter className="sm:justify-end gap-2">
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={!careersSearchQuery.trim()} className="font-semibold">
                Search & Open
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Application Sheet Modal */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-l border-border/40">
          <SheetHeader className="pb-4 border-b border-border/40 mb-4">
            <SheetTitle className="text-xl font-bold text-foreground">Add Application</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Manually add a job application to keep track of its status.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company *</label>
              <Input
                placeholder="e.g. Google"
                value={addForm.company}
                onChange={(e) => setAddForm(prev => ({ ...prev, company: e.target.value }))}
                className="bg-accent/10 border-border/40 focus-visible:bg-accent/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Title *</label>
              <Input
                placeholder="e.g. Software Engineer"
                value={addForm.jobTitle}
                onChange={(e) => setAddForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                className="bg-accent/10 border-border/40 focus-visible:bg-accent/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job URL *</label>
              <Input
                placeholder="e.g. https://careers.google.com/..."
                value={addForm.jobUrl}
                onChange={(e) => setAddForm(prev => ({ ...prev, jobUrl: e.target.value }))}
                className="bg-accent/10 border-border/40 focus-visible:bg-accent/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform *</label>
              <Select
                value={addForm.platform}
                onValueChange={(val) => setAddForm(prev => ({ ...prev, platform: val || "direct" }))}
              >
                <SelectTrigger className="bg-accent/10 border-border/40 capitalize">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {uniquePlatforms.map((plat) => (
                    <SelectItem key={plat} value={plat} className="capitalize">
                      {plat}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="capitalize text-primary font-medium">
                    + Add Custom Platform
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addForm.platform === "__custom__" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Platform Name *</label>
                <Input
                  placeholder="e.g. Glassdoor, ZipRecruiter"
                  value={addForm.customPlatform}
                  onChange={(e) => setAddForm(prev => ({ ...prev, customPlatform: e.target.value }))}
                  className="bg-accent/10 border-border/40 focus-visible:bg-accent/20"
                  autoFocus
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status *</label>
              <Select
                value={addForm.status}
                onValueChange={(val) => setAddForm(prev => ({ ...prev, status: (val || "APPLIED") as ApplicationStatus }))}
              >
                <SelectTrigger className="bg-accent/10 border-border/40 capitalize">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((st) => (
                    <SelectItem key={st} value={st} className="text-xs capitalize">
                      {st.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Description</label>
              <Textarea
                placeholder="Paste the job description here..."
                value={addForm.jobDescription}
                onChange={(e) => setAddForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 min-h-[100px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
              <Textarea
                placeholder="Personal notes, referrals, contacts..."
                value={addForm.notes}
                onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-accent/10 border-border/40 focus-visible:bg-accent/20 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => {
                  setAddOpen(false);
                  resetAddForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSubmit}
                disabled={isPending}
                className="font-semibold"
              >
                Create
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
