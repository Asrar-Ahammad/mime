import { db } from "@/lib/db";
import { NaukriScraper } from "./naukri-scraper";
import { ScrapedJob } from "./types";
import { matchJob } from "@/lib/ai/job-matcher";

export async function runAgentEngine(userId: string) {
  // 1. Fetch user's AgentConfig
  const config = await db.agentConfig.findFirst({
    where: { userId },
  });

  if (!config || !config.isActive) {
    throw new Error("Agent configuration is inactive or not set up.");
  }

  // 2. Fetch user's Master Resume
  const masterResume = await db.resume.findFirst({
    where: { userId, isMaster: true },
  });

  if (!masterResume || !masterResume.parsedContent) {
    throw new Error("A parsed Master Resume is required to compute AI match scores.");
  }

  const parsedResume = masterResume.parsedContent as any;

  // 3. Initialize Naukri scraper
  const scraper = new NaukriScraper(2); // max 2 pages per search
  const discoveredJobs: ScrapedJob[] = [];

  // 4. Scrape jobs for all target roles and locations
  for (const role of config.targetRoles) {
    for (const location of config.targetLocations) {
      try {
        console.log(`[Engine] Searching Naukri for "${role}" in "${location}"...`);
        const jobs = await scraper.scrapeJobs(role, location);
        discoveredJobs.push(...jobs);
      } catch (err) {
        console.error(`[Engine] Scraping failed for ${role}/${location}:`, err);
      }
    }
  }

  if (discoveredJobs.length === 0) {
    console.warn("[Engine] No jobs discovered from Naukri. The scraper may have been blocked.");
    return [];
  }

  console.log(`[Engine] Total discovered: ${discoveredJobs.length} jobs. Processing...`);

  // Limit processing count to save AI API tokens
  const processingLimit = Math.min(discoveredJobs.length, config.dailyLimit || 10);
  const jobsToProcess = discoveredJobs.slice(0, processingLimit);
  const newApplicationsCount = [];

  // 5. Match and insert into DB
  for (const job of jobsToProcess) {
    // Check if already in DB
    const existing = await db.application.findFirst({
      where: {
        userId,
        OR: [
          { jobUrl: job.jobUrl },
          { AND: [{ company: job.company }, { jobTitle: job.jobTitle }] },
        ],
      },
    });

    if (existing) {
      continue; // Skip already matched jobs
    }

    try {
      // Run AI matcher
      const matchResult = await matchJob(parsedResume, job.jobDescription);

      // Create queued application
      const newApp = await db.application.create({
        data: {
          userId,
          company: job.company,
          jobTitle: job.jobTitle,
          jobUrl: job.jobUrl,
          jobDescription: job.jobDescription,
          platform: job.platform,
          status: "QUEUED",
          fitScore: matchResult.fitScore,
          notes: `AI Fit score: ${matchResult.fitScore}%.\nReasoning: ${matchResult.fitReasoning}\nMissing skills: ${matchResult.missingSkills.join(", ") || "None"}\nMatching skills: ${matchResult.matchingSkills.join(", ") || "None"}`,
          resumeId: masterResume.id,
        },
      });

      newApplicationsCount.push(newApp);
    } catch (err) {
      console.error(`Matching failed for job at ${job.company}:`, err);
    }
  }

  console.log(`[Engine] Created ${newApplicationsCount.length} new applications.`);
  return newApplicationsCount;
}
