import { db } from "@/lib/db";
import { fetchGmailThreads, GmailThreadInfo } from "./gmail-client";
import { ApplicationStatus, Application } from "@prisma/client";
import { openai } from "../ai/openai";

export interface ExtractedAppDetails {
  isJobRelated: boolean;
  companyName: string | null;
  jobTitle: string | null;
  status: ApplicationStatus | null;
  isRecommendationOrAlert: boolean;
}

export async function extractApplicationDetailsFromEmail(
  subject: string,
  sender: string,
  snippet: string,
  body: string
): Promise<ExtractedAppDetails> {
  const fallback = getHeuristicDetails(subject, sender, snippet);

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const prompt = `
Analyze the following email metadata and content to determine if it relates to a professional job application the user HAS SUBMITTED (or subsequent stages like interviews, tests, offers, or rejections).

CRITICAL RULE:
You must distinguish between:
1. Direct interactions for a submitted application: The user applied, received a confirmation ("Thank you for applying", "Application received"), invitation to test/interview, status update, offer, or rejection. For these, isRecommendationOrAlert MUST be false, and status must be set.
2. Recommendations or alerts: General digests, weekly newsletters, job recommendations, platform alerts (e.g. LinkedIn Job Alerts, Indeed jobs, Wellfound matches), suggestions to apply, or invitations to apply (e.g., "Apply today", "Jobs matching your profile"). For these, isRecommendationOrAlert MUST be true, and status MUST be null.

Email Details:
Sender: ${sender}
Subject: ${subject}
Snippet: ${snippet}

Email Content:
${body}

Allowed status values: "APPLIED", "INTERVIEWING", "OFFERED", "REJECTED" (or null if not an active application/interaction).

Respond with a JSON object containing:
- isJobRelated: boolean (true if this is job-related, false otherwise)
- companyName: string or null (the company name, e.g. "Google", "Stripe")
- jobTitle: string or null (the job title, e.g. "Software Engineer")
- status: string or null (one of the Allowed status values above, or null if it is just a recommendation/alert or not an active application)
- isRecommendationOrAlert: boolean (true if the email is a recommendation/alert/newsletter/suggestion, false if it is a direct interaction/confirmation for a submitted application)

Do not include any markdown formatting or code blocks in the output.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a precise job application data extractor that outputs JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return fallback;
    }

    const result = JSON.parse(content) as ExtractedAppDetails;
    return {
      isJobRelated: !!result.isJobRelated,
      companyName: result.companyName || fallback.companyName,
      jobTitle: result.jobTitle || fallback.jobTitle,
      status: result.status || fallback.status,
      isRecommendationOrAlert: typeof result.isRecommendationOrAlert === "boolean" ? result.isRecommendationOrAlert : fallback.isRecommendationOrAlert,
    };
  } catch (error) {
    console.error("AI application extraction failed:", error);
    return fallback;
  }
}

function getCleanEmailBody(messages: any[]): string {
  if (!messages || messages.length === 0) return "";
  const lastMsg = messages[messages.length - 1];
  const payload = lastMsg.payload;
  if (!payload) return lastMsg.snippet || "";

  const decodeBase64 = (str: string) => {
    try {
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(base64, "base64").toString("utf-8");
    } catch (e) {
      return "";
    }
  };

  const extractText = (part: any): string => {
    if (part.body?.data) {
      const decoded = decodeBase64(part.body.data);
      // Remove HTML tags to keep it clean and save tokens
      return decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    if (part.parts && part.parts.length > 0) {
      // Prefer text/plain, fallback to text/html
      const plainPart = part.parts.find((p: any) => p.mimeType === "text/plain");
      if (plainPart) return extractText(plainPart);
      const htmlPart = part.parts.find((p: any) => p.mimeType === "text/html");
      if (htmlPart) return extractText(htmlPart);
      for (const p of part.parts) {
        const txt = extractText(p);
        if (txt) return txt;
      }
    }
    return "";
  };

  const bodyText = extractText(payload);
  // Return truncated body to save tokens if it's too long (e.g., max 1500 chars)
  return bodyText ? bodyText.slice(0, 1500) : lastMsg.snippet || "";
}

function getHeuristicDetails(
  subject: string,
  sender: string,
  snippet: string
): ExtractedAppDetails {
  const sub = subject.toLowerCase();
  const snd = sender.toLowerCase();
  const snip = snippet.toLowerCase();

  const isJobRelated = isJobRelatedHeuristic(subject, sender, snippet);
  if (!isJobRelated) {
    return { isJobRelated: false, companyName: null, jobTitle: null, status: null, isRecommendationOrAlert: false };
  }

  // Determine if it is a recommendation/alert
  const recommendationKeywords = [
    "alert", "recommendation", "recommended", "match your search", "matching search",
    "vacancy", "vacancies", "suggested", "suggestion", "jobs near you", "jobs you might have missed",
    "listings are waiting", "hackathons near you", "digest", "newsletter", "weekly", "daily",
    "recommend", "suggestions", "opportunities for you", "matching jobs", "apply today", "apply now",
    "jobs for you", "recommended for you", "new jobs", "we found jobs", "job match", "similar jobs",
    "jobs matching", "jobs like", "interested in", "view job", "job alert"
  ];
  const isRecommendationOrAlert = 
    recommendationKeywords.some(kw => sub.includes(kw) || snip.includes(kw) || snd.includes(kw)) ||
    snd.includes("jobalerts") || snd.includes("alerts") || snd.includes("digest") || snd.includes("newsletter");

  // Basic heuristic company extraction
  let companyName: string | null = null;
  const companies = ["google", "stripe", "razorpay", "wellfound", "indeed", "linkedin", "tcs", "honeywell", "amazon", "supabase", "apna", "leetcode", "philips", "deloitte", "barclays", "genpact"];
  for (const c of companies) {
    if (sub.includes(c) || snd.includes(c) || snip.includes(c)) {
      companyName = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Basic heuristic job title extraction
  let jobTitle: string | null = null;
  const titles = ["software engineer", "frontend engineer", "backend engineer", "full stack engineer", "fullstack engineer", "ui engineer", "data scientist", "data analyst", "developer"];
  for (const t of titles) {
    if (sub.includes(t) || snip.includes(t)) {
      jobTitle = t.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      break;
    }
  }

  // Basic status extraction
  let status: ApplicationStatus | null = null;
  const textToParse = `${sub} ${snip}`;
  
  const appliedKeywords = [
    "thank you for applying", "thanks for applying", "application received", 
    "received your application", "your application", "applied to", "application for",
    "thanks for your interest", "successful submission"
  ];

  if (
    textToParse.includes("offer") ||
    textToParse.includes("contract") ||
    textToParse.includes("hired")
  ) {
    status = "OFFERED";
  } else if (
    textToParse.includes("interview") ||
    textToParse.includes("schedule") ||
    textToParse.includes("call") ||
    textToParse.includes("assessment")
  ) {
    status = "INTERVIEWING";
  } else if (
    textToParse.includes("unfortunately") ||
    textToParse.includes("not move forward") ||
    textToParse.includes("reject") ||
    textToParse.includes("declined")
  ) {
    status = "REJECTED";
  } else if (appliedKeywords.some(kw => textToParse.includes(kw))) {
    status = "APPLIED";
  }

  return {
    isJobRelated: true,
    companyName,
    jobTitle,
    status,
    isRecommendationOrAlert,
  };
}

function isJobRelatedHeuristic(
  subject: string,
  sender: string,
  snippet: string
): boolean {
  const sub = subject.toLowerCase();
  const snd = sender.toLowerCase();
  const snip = snippet.toLowerCase();

  // Primary check: email subject keywords
  const subjectKeywords = [
    "application", "apply", "applied", "interview", "job", "offer", "careers", 
    "resume", "hired", "recruiting", "recruiter", "opportunity", "opportunities", 
    "hiring", "position", "role", "assessment", "calendly", "schedule", "talent", 
    "hr", "onboarding", "workday", "greenhouse", "lever", "ashby", "candidate", 
    "rejection", "propeers", "linkedin", "instahyre", "naukri", "indeed", "wellfound"
  ];

  if (subjectKeywords.some(keyword => sub.includes(keyword))) {
    return true;
  }

  // Secondary checks: sender and snippet keywords
  const senderKeywords = ["recruiting", "careers", "talent", "hr", "noreply", "no-reply", "jobs"];
  const snippetKeywords = [
    "interview", "application", "resume", "schedule a call", "hiring manager", 
    "move forward", "technical round", "position", "careers", "job alert"
  ];

  if (
    senderKeywords.some(keyword => snd.includes(keyword)) &&
    snippetKeywords.some(keyword => snip.includes(keyword))
  ) {
    return true;
  }

  return false;
}

export async function syncUserEmails(userId: string) {
  try {
    // 1. Fetch Gmail threads
    const threads = await fetchGmailThreads(userId);

    // 2. Fetch user's applications
    let applications = await db.application.findMany({
      where: { userId },
    });

    let syncCount = 0;

    for (const thread of threads) {
      // Decode the full text body of the last message in this thread
      const body = getCleanEmailBody(thread.rawMessages as any[]);

      // Look at the email and extract application details with full body context
      const details = await extractApplicationDetailsFromEmail(thread.subject, thread.sender, thread.snippet, body);
      if (!details.isJobRelated) {
        console.log(`[Sync] Skipping non-job email thread: "${thread.subject}"`);
        continue;
      }

      // Check if thread already imported
      const existingThread = await db.emailThread.findUnique({
        where: {
          userId_gmailThreadId: {
            userId,
            gmailThreadId: thread.id,
          },
        },
      });

      let linkedApplicationId: string | null = null;
      let detectedStatus: ApplicationStatus | null = details.status;

      // Scan user's applications for matching company names
      let matchingApp = applications.find((app) => {
        const companyName = app.company.toLowerCase();
        const extractedCompany = details.companyName?.toLowerCase() || "";
        const emailSubject = thread.subject.toLowerCase();
        const emailSender = thread.sender.toLowerCase();
        const emailSnippet = thread.snippet.toLowerCase();

        return (
          (extractedCompany && (companyName.includes(extractedCompany) || extractedCompany.includes(companyName))) ||
          emailSubject.includes(companyName) ||
          emailSender.includes(companyName) ||
          emailSnippet.includes(companyName)
        );
      });

      if (matchingApp) {
        linkedApplicationId = matchingApp.id;
      } else if (details.companyName && details.status && !details.isRecommendationOrAlert) {
        // Automatically create a new application for this company only if we detected status AND it is NOT a recommendation or alert!
        console.log(`[Sync] Creating new application for company: "${details.companyName}"`);
        try {
          const newApp = await db.application.create({
            data: {
              userId,
              company: details.companyName,
              jobTitle: details.jobTitle || "Software Engineer",
              jobUrl: "discovered-from-email",
              jobDescription: thread.snippet,
              platform: "direct",
              status: details.status || "APPLIED",
            },
          });
          linkedApplicationId = newApp.id;
          
          // Add this new application to our local array so future threads for the same company can link to it
          applications.push(newApp);

          // Create notification for auto-creation
          await db.notification.create({
            data: {
              userId,
              applicationId: newApp.id,
              title: "New Application Discovered",
              message: `Automatically created application for ${details.companyName} as ${details.jobTitle || "Software Engineer"}`,
            },
          });
        } catch (err) {
          console.error(`[Sync] Failed to automatically create application for ${details.companyName}:`, err);
        }
      }

      // If we found a linked application and a detected status, update the application
      const isNewOrUpdated = !existingThread || 
        new Date(existingThread.lastMessageDate).getTime() < new Date(thread.lastMessageDate).getTime();

      // Update status only if it represents progress AND the email is NOT a recommendation or alert
      if (isNewOrUpdated && linkedApplicationId && detectedStatus && !details.isRecommendationOrAlert) {
        // Only update if it represents progress (e.g., don't downgrade INTERVIEWING to APPLIED)
        const targetApp = applications.find((a) => a.id === linkedApplicationId);
        if (targetApp) {
          // Fetch current status directly from DB to avoid stale array cache
          const dbApp = await db.application.findUnique({
            where: { id: linkedApplicationId },
            select: { status: true, company: true },
          });

          if (dbApp) {
            const currentStatus = dbApp.status;
            let shouldUpdate = false;

            const statusHierarchy: Record<ApplicationStatus, number> = {
              QUEUED: 0,
              APPROVED: 1,
              APPLYING: 2,
              APPLIED: 3,
              VIEWED: 4,
              INTERVIEWING: 5,
              OFFERED: 6,
              REJECTED: 6,
              WITHDRAWN: 6,
            };

            if (statusHierarchy[detectedStatus] > statusHierarchy[currentStatus]) {
              shouldUpdate = true;
            }

            if (shouldUpdate) {
              await db.application.update({
                where: { id: linkedApplicationId },
                data: { status: detectedStatus },
              });

              // Create status progression notification
              await db.notification.create({
                data: {
                  userId,
                  applicationId: linkedApplicationId,
                  title: "Application Status Updated",
                  message: `${dbApp.company} status updated to ${detectedStatus}`,
                },
              });
            }
          }
        }
      }

      // Upsert EmailThread record
      await db.emailThread.upsert({
        where: {
          userId_gmailThreadId: {
            userId,
            gmailThreadId: thread.id,
          },
        },
        update: {
          snippet: thread.snippet,
          subject: thread.subject,
          sender: thread.sender,
          lastMessageDate: thread.lastMessageDate,
          applicationId: linkedApplicationId,
          rawMessages: thread.rawMessages as any,
        },
        create: {
          userId,
          gmailThreadId: thread.id,
          subject: thread.subject,
          snippet: thread.snippet,
          sender: thread.sender,
          lastMessageDate: thread.lastMessageDate,
          applicationId: linkedApplicationId,
          rawMessages: thread.rawMessages as any,
        },
      });

      if (isNewOrUpdated) {
        syncCount++;
      }
    }

    return syncCount;
  } catch (error) {
    console.error("Error syncing emails:", error);
    throw error;
  }
}
