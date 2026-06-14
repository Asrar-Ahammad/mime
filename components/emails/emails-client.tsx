"use client";

import { useState, useTransition, useEffect } from "react";
import {
  ArrowClockwise,
  Link as LinkIcon,
  LinkBreak,
  Building,
  Warning,
  Trash,
  EnvelopeOpen,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailThread {
  id: string;
  gmailThreadId: string;
  subject: string;
  snippet: string;
  sender: string;
  lastMessageDate: string;
  isRead: boolean;
  applicationId: string | null;
  application?: {
    id: string;
    company: string;
    jobTitle: string;
  } | null;
  rawMessages?: any;
}

interface MiniApplication {
  id: string;
  company: string;
  jobTitle: string;
}

interface EmailsClientProps {
  initialEmails: EmailThread[];
  applications: MiniApplication[];
  syncAction: () => Promise<{ success: boolean; count?: number; error?: string }>;
  linkAction: (threadId: string, applicationId: string | null) => Promise<{ success: boolean; error?: string }>;
  deleteAction: (threadId: string) => Promise<{ success: boolean; error?: string }>;
  deleteMultipleAction: (threadIds: string[]) => Promise<{ success: boolean; error?: string }>;
  initialThreadId?: string;
}

export function EmailsClient({
  initialEmails,
  applications,
  syncAction,
  linkAction,
  deleteAction,
  deleteMultipleAction,
  initialThreadId,
}: EmailsClientProps) {
  const [emails, setEmails] = useState<EmailThread[]>(initialEmails);
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [syncing, setSyncing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [sheetWidth, setSheetWidth] = useState(672);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
 
  const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [activeEmailToLink, setActiveEmailToLink] = useState<EmailThread | null>(null);
  const [appSearchQuery, setAppSearchQuery] = useState("");

  const filteredApplications = applications.filter((app) =>
    app.company.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
    app.jobTitle.toLowerCase().includes(appSearchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedThreadIds(new Set());
  }, [filter]);

  const toggleSelectThread = (threadId: string) => {
    setSelectedThreadIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredEmails.length > 0 && selectedThreadIds.size === filteredEmails.length) {
      setSelectedThreadIds(new Set());
    } else {
      setSelectedThreadIds(new Set(filteredEmails.map((e) => e.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedThreadIds.size === 0) return;
    
    startTransition(async () => {
      try {
        const idsArray = Array.from(selectedThreadIds);
        const result = await deleteMultipleAction(idsArray);
        if (result.success) {
          setEmails((prev) => prev.filter((e) => !selectedThreadIds.has(e.id)));
          setSelectedThreadIds(new Set());
          toast.success("Selected email threads deleted");
        } else {
          toast.error(result.error || "Failed to delete selected emails");
        }
      } catch (err) {
        toast.error("Failed to delete selected emails");
      } finally {
        setBatchDeleteConfirmOpen(false);
      }
    });
  };
 
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialThreadId) {
      const email = emails.find((e) => e.id === initialThreadId || e.gmailThreadId === initialThreadId);
      if (email) {
        setSelectedEmail(email);
      }
    }
  }, [initialThreadId, emails]);

  const handleCloseSheet = () => {
    setSelectedEmail(null);
    const params = new URLSearchParams(window.location.search);
    if (params.has("threadId")) {
      params.delete("threadId");
      const newRelativePathQuery = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState(null, "", newRelativePathQuery);
    }
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sheetWidth;

    const doResize = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(380, Math.min(window.innerWidth - 40, startWidth - deltaX));
      setSheetWidth(newWidth);
    };

    const stopResize = () => {
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAction();
      if (result.success) {
        toast.success(`Sync complete! Imported ${result.count || 0} new threads.`);
        // Reload page data by refreshing window (simple & safe next.js reload pattern)
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to sync emails");
      }
    } catch (err) {
      toast.error("Email sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleLinkApplication = async (threadId: string, appId: string | null) => {
    startTransition(async () => {
      const result = await linkAction(threadId, appId);
      if (result.success) {
        setEmails((prev) =>
          prev.map((email) => {
            if (email.id === threadId) {
              const selectedApp = applications.find((a) => a.id === appId);
              return {
                ...email,
                applicationId: appId,
                application: selectedApp ? { id: selectedApp.id, company: selectedApp.company, jobTitle: selectedApp.jobTitle } : null,
              };
            }
            return email;
          })
        );
        toast.success(appId ? "Email thread linked to application" : "Email thread unlinked");
      } else {
        toast.error(result.error || "Failed to update link");
      }
    });
  };

  const handleDeleteEmailClick = (threadId: string) => {
    setEmailToDelete(threadId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEmail = () => {
    if (!emailToDelete) return;
    
    startTransition(async () => {
      try {
        const result = await deleteAction(emailToDelete);
        if (result.success) {
          setEmails((prev) => prev.filter((e) => e.id !== emailToDelete));
          if (selectedEmail?.id === emailToDelete) {
            handleCloseSheet();
          }
          toast.success("Email deleted from database");
        } else {
          toast.error(result.error || "Failed to delete email");
        }
      } catch (err) {
        toast.error("Failed to delete email");
      } finally {
        setDeleteConfirmOpen(false);
        setEmailToDelete(null);
      }
    });
  };

  const filteredEmails = emails.filter((email) => {
    if (filter === "linked") return email.applicationId !== null;
    if (filter === "unlinked") return email.applicationId === null;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Email Updates</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Monitor and link job application update emails synced from your Gmail inbox.
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-2 h-9 text-xs transition-smooth shadow-lg shadow-primary/15"
        >
          <ArrowClockwise size={16} className={cn(syncing && "animate-spin")} />
          <span className="hidden sm:inline">{syncing ? "Syncing Gmail..." : "Sync Gmail Inbox"}</span>
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-4">
        <Button
          variant={filter === "all" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-xs transition-smooth h-8"
        >
          All Threads
        </Button>
        <Button
          variant={filter === "linked" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter("linked")}
          className="text-xs transition-smooth h-8"
        >
          Linked
        </Button>
        <Button
          variant={filter === "unlinked" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter("unlinked")}
          className="text-xs transition-smooth h-8"
        >
          Unlinked
        </Button>
      </div>

      {/* Batch Actions Bar */}
      {selectedThreadIds.size > 0 && (
        <div className="flex items-center justify-between border border-destructive/20 bg-destructive/5 p-3 rounded-lg text-xs animate-in fade-in slide-in-from-top-1">
          <span className="font-semibold text-destructive">
            {selectedThreadIds.size} thread{selectedThreadIds.size > 1 ? "s" : ""} selected for deletion
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBatchDeleteConfirmOpen(true)}
            className="h-8 gap-1.5 px-3 rounded-lg text-xs"
          >
            <Trash size={14} />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
        {filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
            <EnvelopeOpen size={48} className="text-muted-foreground/30 mb-4" />
            No email threads found. Sync your inbox to start tracking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-accent/10">
                  <th className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={filteredEmails.length > 0 && selectedThreadIds.size === filteredEmails.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all emails"
                    />
                  </th>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Subject & Preview</th>
                  <th className="px-6 py-4">Linked Job</th>
                  <th className="px-6 py-4">Received</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredEmails.map((email) => {
                  const isLinked = email.applicationId !== null;
                  return (
                    <tr
                      key={email.id}
                      className="group hover:bg-accent/5 cursor-pointer transition-smooth"
                      onClick={() => setSelectedEmail(email)}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedThreadIds.has(email.id)}
                          onCheckedChange={() => toggleSelectThread(email.id)}
                          aria-label={`Select email from ${email.sender}`}
                        />
                      </td>

                      {/* Sender */}
                      <td className="px-6 py-4 max-w-[200px] truncate">
                        <div className="font-semibold text-foreground truncate">{email.sender}</div>
                      </td>

                      {/* Subject & Snippet */}
                      <td className="px-6 py-4 min-w-[300px] max-w-[500px]">
                        <div className="font-semibold text-foreground truncate flex items-center gap-2">
                          <span className="truncate">{email.subject}</span>
                          {isLinked && (
                            <Badge className="bg-primary/10 border-primary/20 text-primary text-[9px] py-0 px-2 font-semibold shrink-0">
                              Linked
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{email.snippet}</div>
                      </td>

                      {/* Linked Job */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {isLinked && email.application ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setActiveEmailToLink(email);
                                  setLinkModalOpen(true);
                                }}
                                className="text-xs text-left hover:underline select-none"
                              >
                                <div className="font-semibold text-foreground truncate max-w-[150px]">
                                  {email.application.company}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                  {email.application.jobTitle}
                                </div>
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleLinkApplication(email.id, null)}
                                className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 animate-in fade-in"
                                title="Unlink"
                              >
                                <LinkBreak size={14} />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveEmailToLink(email);
                                setLinkModalOpen(true);
                              }}
                              className="h-7 gap-1 px-2.5 rounded-full text-[10px] font-medium transition-smooth bg-accent/5 hover:bg-accent/15 border-border/40 text-muted-foreground"
                            >
                              <LinkIcon size={12} />
                              Link Job
                            </Button>
                          )}
                        </div>
                      </td>

                      {/* Received Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(email.lastMessageDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-smooth">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteEmailClick(email.id)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Detail Sheet */}
      <Sheet open={selectedEmail !== null} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent 
          className="w-full sm:max-w-none overflow-y-auto bg-card border-l border-border/40"
          style={{ width: `${sheetWidth}px`, maxWidth: "100vw" }}
        >
          {/* Resize Handle */}
          <div 
            onMouseDown={startResize}
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-border/10 hover:bg-primary/30 active:bg-primary/50 transition-colors z-50 hidden sm:flex items-center justify-center group"
            title="Drag to resize sheet"
          >
            {/* Monochromatic drag indicator dots */}
            <div className="w-[2px] h-8 flex flex-col justify-between gap-[3px] opacity-30 group-hover:opacity-80 transition-opacity">
              <div className="w-[2px] h-[2px] rounded-full bg-foreground" />
              <div className="w-[2px] h-[2px] rounded-full bg-foreground" />
              <div className="w-[2px] h-[2px] rounded-full bg-foreground" />
              <div className="w-[2px] h-[2px] rounded-full bg-foreground" />
              <div className="w-[2px] h-[2px] rounded-full bg-foreground" />
            </div>
          </div>
          {selectedEmail && (
            <div className="space-y-6 pb-12">
              <SheetHeader className="space-y-3">
                <div className="flex items-center justify-between pr-8">
                  <div className="flex items-center gap-2">
                    {selectedEmail.application && (
                      <Badge variant="secondary" className="bg-primary/10 border-primary/20 text-primary py-0.5">
                        {selectedEmail.application.company}
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn("text-[10px] py-0.5 px-2", selectedEmail.applicationId ? "border-primary/20 text-primary" : "border-border/40 text-muted-foreground")}>
                      {selectedEmail.applicationId ? "Linked" : "Unlinked"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEmailClick(selectedEmail.id)}
                    className="h-8 gap-1.5 px-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-smooth text-xs"
                    title="Delete from database only"
                  >
                    <Trash size={14} />
                    Delete Email
                  </Button>
                </div>
                <SheetTitle className="text-xl font-bold text-foreground leading-snug">
                  {selectedEmail.subject}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-1.5 py-3 border-b border-border/20">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                  <p className="text-xs font-bold text-foreground truncate max-w-[400px]">
                    <span className="text-muted-foreground font-normal">From: </span>
                    {selectedEmail.sender}
                  </p>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(selectedEmail.lastMessageDate).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Message Feed */}
              <div className="space-y-6 mt-4">
                {selectedEmail.rawMessages && selectedEmail.rawMessages.length > 0 ? (
                  (selectedEmail.rawMessages as any[]).map((msg, index) => {
                    const headers = msg.payload?.headers || [];
                    const msgSender = headers.find((h: any) => h.name?.toLowerCase() === "from")?.value || selectedEmail.sender;
                    const msgDateStr = headers.find((h: any) => h.name?.toLowerCase() === "date")?.value;
                    const msgDate = msgDateStr ? new Date(msgDateStr).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "";
                    const decodedBody = decodeGmailBody(msg.payload);

                    return (
                      <div key={msg.id || index} className="space-y-3 rounded-xl border border-border/30 bg-accent/5 p-5 shadow-sm">
                        <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[300px]">{msgSender}</p>
                          <p className="text-[10px] text-muted-foreground">{msgDate}</p>
                        </div>
                        {decodedBody ? (
                          <div 
                            className="text-xs text-muted-foreground leading-relaxed overflow-x-auto select-text prose prose-neutral dark:prose-invert max-w-none break-words [&_a]:text-primary [&_a]:underline"
                            dangerouslySetInnerHTML={{ __html: decodedBody }}
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap select-text">
                            {msg.snippet}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-3 rounded-xl border border-border/30 bg-accent/5 p-5 shadow-sm">
                    <div className="flex justify-between items-baseline border-b border-border/10 pb-2">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[300px]">{selectedEmail.sender}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(selectedEmail.lastMessageDate).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap select-text">
                      {selectedEmail.snippet}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md border border-border/40">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Warning size={24} weight="bold" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Delete Email Thread
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-[320px]">
              Are you sure you want to delete this email thread from the database? This action is irreversible, but it will <strong className="font-semibold text-foreground">not</strong> affect or delete the emails in your Gmail inbox.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setEmailToDelete(null);
              }}
              className="flex-1 h-9 font-semibold text-xs rounded-lg border-border/40 transition-smooth"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDeleteEmail}
              className="flex-1 h-9 font-semibold text-xs rounded-lg gap-1.5 transition-smooth"
              disabled={isPending}
            >
              <Trash size={14} />
              {isPending ? "Deleting..." : "Delete Thread"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={batchDeleteConfirmOpen} onOpenChange={setBatchDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md border border-border/40">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Warning size={24} weight="bold" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Delete Selected Emails
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-[320px]">
              Are you sure you want to delete the <strong className="font-semibold text-foreground">{selectedThreadIds.size} selected</strong> email threads from the database? This action is irreversible, but it will <strong className="font-semibold text-foreground">not</strong> affect or delete the emails in your Gmail inbox.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBatchDeleteConfirmOpen(false);
              }}
              className="flex-1 h-9 font-semibold text-xs rounded-lg border-border/40 transition-smooth"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              className="flex-1 h-9 font-semibold text-xs rounded-lg gap-1.5 transition-smooth"
              disabled={isPending}
            >
              <Trash size={14} />
              {isPending ? "Deleting..." : "Delete Threads"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Application Search Dialog */}
      <Dialog 
        open={linkModalOpen} 
        onOpenChange={(open) => {
          setLinkModalOpen(open);
          if (!open) {
            setActiveEmailToLink(null);
            setAppSearchQuery("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg border border-border/40">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-bold text-foreground">
              Link Email to Job Application
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search and select an application to link with this email thread.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by company or role..."
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-lg bg-accent/5 border-border/40 focus-visible:ring-primary/20"
                autoFocus
              />
            </div>

            {/* Application List */}
            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
              {filteredApplications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching applications found.
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const isCurrentLink = activeEmailToLink?.applicationId === app.id;
                  return (
                    <button
                      key={app.id}
                      onClick={() => {
                        if (activeEmailToLink) {
                          handleLinkApplication(activeEmailToLink.id, app.id);
                          setLinkModalOpen(false);
                        }
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-smooth",
                        isCurrentLink 
                          ? "bg-primary/5 border-primary/25 text-primary font-semibold" 
                          : "border-border/30 hover:bg-accent/10 hover:border-border/60"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{app.company}</p>
                        <p className="text-muted-foreground mt-0.5 truncate">{app.jobTitle}</p>
                      </div>
                      {isCurrentLink && (
                        <Badge className="bg-primary/10 border-primary/20 text-primary text-[9px]">
                          Current Link
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2">
            {activeEmailToLink?.applicationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeEmailToLink) {
                    handleLinkApplication(activeEmailToLink.id, null);
                    setLinkModalOpen(false);
                  }
                }}
                className="flex-1 h-9 font-semibold text-xs rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive border-border/40"
              >
                Unlink Application
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLinkModalOpen(false)}
              className="flex-1 h-9 font-semibold text-xs rounded-lg border border-border/30"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function decodeGmailBody(payload: any): string {
  if (!payload) return "";
  
  const decodeBase64 = (str: string) => {
    try {
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      return decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch (e) {
      try {
        let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
          base64 += "=";
        }
        return atob(base64);
      } catch (err) {
        return "";
      }
    }
  };

  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return decodeBase64(htmlPart.body.data);
    }
    const plainPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plainPart?.body?.data) {
      return decodeBase64(plainPart.body.data);
    }
    for (const part of payload.parts) {
      const decoded = decodeGmailBody(part);
      if (decoded) return decoded;
    }
  }

  return "";
}
