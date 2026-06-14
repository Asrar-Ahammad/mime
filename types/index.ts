import { ApplicationStatus } from "@prisma/client";

// Re-export Prisma enum for use in components
export { ApplicationStatus };

export type Platform =
  | "naukri"
  | "instahyre"
  | "wellfound"
  | "indeed"
  | "direct";

export interface ApplicationRow {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl: string;
  platform: Platform;
  status: ApplicationStatus;
  fitScore: number | null;
  appliedAt: Date | null;
  createdAt: Date;
  resumeName?: string;
}

export interface DashboardStats {
  totalApplied: number;
  interviewing: number;
  offers: number;
  responseRate: number;
  totalQueued: number;
  totalRejected: number;
}

export interface ResumeData {
  id: string;
  name: string;
  isMaster: boolean;
  originalFile: string;
  parsedContent: ParsedResume | null;
  createdAt: Date;
  applicationCount?: number;
}

export interface ParsedResume {
  contact: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  certifications?: string[];
  projects?: ProjectEntry[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  location?: string;
  graduationDate?: string;
  gpa?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  bullets?: string[];
  technologies: string[];
  url?: string;
}

export interface AgentJob {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  platform: Platform;
  fitScore: number;
  fitReasoning?: string;
  missingSkills?: string[];
}

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  sender: string;
  date: Date;
  isRead: boolean;
  linkedApplicationId?: string;
  linkedCompany?: string;
}
