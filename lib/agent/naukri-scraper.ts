import { chromium, type Browser, type Page } from "playwright";
import { ScrapedJob } from "./types";

// ── Stealth Configuration ──────────────────────────────────────────────────────

const STEALTH_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const STEALTH_VIEWPORT = { width: 1366, height: 768 };

const EXTRA_HEADERS = {
  "accept-language": "en-US,en;q=0.9",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "sec-ch-ua": '"Chromium";v="125", "Not(A:Brand";v="24", "Google Chrome";v="125"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};

// ── Selector Map (update if Naukri changes their DOM) ──────────────────────────

const SELECTORS = {
  // Primary selectors (2024-2025 DOM)
  jobCard: "div.srp-jobtuple-wrapper",
  jobTitle: "a.title",
  companyName: "a.comp-name",
  experience: "span.expwrap span span",
  salary: "span.ni-job-tuple-icon.ni-job-tuple-icon-srp-rupee + span",
  location: "span.locWrap span",
  description: "div.job-desc, span.job-desc, div.row3",
  // Fallback selectors (broader)
  jobCardFallback: "[class*='jobTuple'], [class*='job-tuple'], article.jobTuple",
  jobTitleFallback: "[class*='title'] a, [class*='jobTitle'] a",
  companyNameFallback: "[class*='comp-name'], [class*='company'] a",
  locationFallback: "[class*='loc'], [class*='location']",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildSearchUrl(role: string, location: string, page: number = 1): string {
  const roleSlug = role.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const locationSlug = location.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const keyword = encodeURIComponent(role);
  const loc = encodeURIComponent(location);

  if (page > 1) {
    return `https://www.naukri.com/${roleSlug}-jobs-in-${locationSlug}-${page}?k=${keyword}&l=${loc}`;
  }
  return `https://www.naukri.com/${roleSlug}-jobs-in-${locationSlug}?k=${keyword}&l=${loc}`;
}

function randomDelay(min: number = 2000, max: number = 5000): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

// ── Core Scraper ───────────────────────────────────────────────────────────────

async function extractJobsFromPage(page: Page): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = [];

  // Wait for job cards to appear
  try {
    await page.waitForSelector(SELECTORS.jobCard, { timeout: 12000 });
  } catch {
    // Try fallback selector
    try {
      await page.waitForSelector(SELECTORS.jobCardFallback, { timeout: 5000 });
    } catch {
      console.warn("[Naukri] No job cards found on page.");
      return [];
    }
  }

  // Extra wait for full render
  await randomDelay(1000, 2000);

  const jobCards = await page.$$(SELECTORS.jobCard);
  const cards = jobCards.length > 0 ? jobCards : await page.$$(SELECTORS.jobCardFallback);

  for (const card of cards) {
    try {
      // ── Title + URL ──
      let titleEl = await card.$(SELECTORS.jobTitle);
      if (!titleEl) titleEl = await card.$(SELECTORS.jobTitleFallback);

      const jobTitle = titleEl
        ? cleanText(await titleEl.evaluate((el) => el.textContent))
        : "";
      const jobUrl = titleEl
        ? (await titleEl.evaluate((el) => (el as HTMLAnchorElement).href)) || ""
        : "";

      if (!jobTitle || !jobUrl) continue;

      // ── Company ──
      let companyEl = await card.$(SELECTORS.companyName);
      if (!companyEl) companyEl = await card.$(SELECTORS.companyNameFallback);
      const company = companyEl
        ? cleanText(await companyEl.evaluate((el) => el.textContent))
        : "Unknown Company";

      // ── Experience ──
      const expEl = await card.$(SELECTORS.experience);
      const experience = expEl
        ? cleanText(await expEl.evaluate((el) => el.textContent))
        : "";

      // ── Salary ──
      const salaryEl = await card.$(SELECTORS.salary);
      const salary = salaryEl
        ? cleanText(await salaryEl.evaluate((el) => el.textContent))
        : "";

      // ── Location ──
      let locEl = await card.$(SELECTORS.location);
      if (!locEl) locEl = await card.$(SELECTORS.locationFallback);
      const location = locEl
        ? cleanText(await locEl.evaluate((el) => el.textContent))
        : "";

      // ── Description snippet ──
      const descEl = await card.$(SELECTORS.description);
      const descSnippet = descEl
        ? cleanText(await descEl.evaluate((el) => el.textContent))
        : "";

      // Build full description from extracted metadata
      const descParts = [
        `Role: ${jobTitle} at ${company}.`,
        experience ? `Experience: ${experience}.` : "",
        salary ? `Salary: ${salary}.` : "",
        location ? `Location: ${location}.` : "",
        descSnippet ? `\n${descSnippet}` : "",
      ].filter(Boolean);

      jobs.push({
        company,
        jobTitle,
        jobUrl,
        jobDescription: descParts.join(" "),
        platform: "naukri",
      });
    } catch (err) {
      // Skip individual card extraction failures
      console.warn("[Naukri] Failed to extract a job card:", err);
    }
  }

  return jobs;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export class NaukriScraper {
  platformName = "naukri";
  private maxPages: number;

  constructor(maxPages: number = 2) {
    this.maxPages = maxPages;
  }

  async scrapeJobs(role: string, location: string): Promise<ScrapedJob[]> {
    let browser: Browser | null = null;
    const allJobs: ScrapedJob[] = [];

    try {
      console.log(`[Naukri] Launching stealth browser for "${role}" in "${location}"...`);

      browser = await chromium.launch({
        headless: false,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-infobars",
        ],
      });

      const context = await browser.newContext({
        userAgent: STEALTH_USER_AGENT,
        viewport: STEALTH_VIEWPORT,
        locale: "en-US",
        extraHTTPHeaders: EXTRA_HEADERS,
      });

      const page = await context.newPage();

      // Stealth patches — hide automation signals
      await page.addInitScript(() => {
        // Remove webdriver flag
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });

        // Override plugins to appear normal
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });

        // Override languages
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });

        // Override permissions query
        const originalQuery = window.navigator.permissions.query;
        // @ts-ignore
        window.navigator.permissions.query = (parameters: any) =>
          parameters.name === "notifications"
            ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
            : originalQuery(parameters);

        // Chrome runtime mock
        // @ts-ignore
        window.chrome = { runtime: {} };
      });

      // Scrape pages
      for (let pageNum = 1; pageNum <= this.maxPages; pageNum++) {
        const url = buildSearchUrl(role, location, pageNum);
        console.log(`[Naukri] Loading page ${pageNum}: ${url}`);

        try {
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });

          // Check for blocking/CAPTCHA
          const pageTitle = await page.title();
          if (
            pageTitle.toLowerCase().includes("security") ||
            pageTitle.toLowerCase().includes("captcha") ||
            pageTitle.toLowerCase().includes("blocked")
          ) {
            console.warn(`[Naukri] Possible block detected on page ${pageNum}. Stopping.`);
            break;
          }

          const jobs = await extractJobsFromPage(page);
          console.log(`[Naukri] Page ${pageNum}: Found ${jobs.length} jobs.`);
          allJobs.push(...jobs);

          if (jobs.length === 0) {
            console.log(`[Naukri] No more jobs on page ${pageNum}. Stopping pagination.`);
            break;
          }

          // Delay between pages to avoid rate limiting
          if (pageNum < this.maxPages) {
            await randomDelay(3000, 6000);
          }
        } catch (err) {
          console.error(`[Naukri] Failed to load page ${pageNum}:`, err);
          break;
        }
      }

      console.log(`[Naukri] Total scraped: ${allJobs.length} real jobs for "${role}" in "${location}".`);
    } catch (err) {
      console.error("[Naukri] Scraper error:", err);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return allJobs;
  }
}
