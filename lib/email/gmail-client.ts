import { google } from "googleapis";
import { db } from "@/lib/db";

export interface GmailThreadInfo {
  id: string;
  subject: string;
  snippet: string;
  sender: string;
  lastMessageDate: Date;
  rawMessages: any;
}

export async function fetchGmailThreads(userId: string): Promise<GmailThreadInfo[]> {
  try {
    // 1. Fetch user's Google Account tokens
    const account = await db.account.findFirst({
      where: { userId, provider: "google" },
    });

    if (!account || !account.access_token) {
      console.warn("No Google access token found for user. Returning mock email threads.");
      return getMockEmailThreads();
    }

    // 2. Initialize Google OAuth Client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token || undefined,
    });

    // Automatically update refreshed credentials in the database
    oauth2Client.on("tokens", async (tokens) => {
      try {
        const updateData: any = {};
        if (tokens.access_token) updateData.access_token = tokens.access_token;
        if (tokens.refresh_token) updateData.refresh_token = tokens.refresh_token;
        if (tokens.expiry_date) updateData.expires_at = Math.floor(tokens.expiry_date / 1000);

        if (Object.keys(updateData).length > 0) {
          await db.account.update({
            where: {
              provider_providerAccountId: {
                provider: "google",
                providerAccountId: account.providerAccountId,
              },
            },
            data: updateData,
          });
          console.log("[Gmail] Credentials refreshed and updated in database.");
        }
      } catch (dbErr) {
        console.error("[Gmail] Failed to update refreshed tokens in database:", dbErr);
      }
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // 3. Determine if this is the user's first sync
    const existingCount = await db.emailThread.count({
      where: { userId },
    });
    const isFirstSync = existingCount === 0;

    // List messages with broader queries matching job application updates
    let query = "application OR interview OR job OR offer OR careers OR resume OR hiring OR recruit OR update";
    if (isFirstSync) {
      query += " newer_than:7d";
    }

    const listRes = await gmail.users.threads.list({
      userId: "me",
      q: query,
      maxResults: 200,
    });

    const threads = listRes.data.threads || [];
    
    // Fetch details of all threads in parallel
    const threadPromises = threads.map(async (thread) => {
      if (!thread.id) return null;
      try {
        const threadRes = await gmail.users.threads.get({
          userId: "me",
          id: thread.id,
        });

        const messages = threadRes.data.messages || [];
        if (messages.length === 0) return null;

        // Extract details from the last message in the thread
        const lastMsg = messages[messages.length - 1];
        const headers = lastMsg.payload?.headers || [];
        
        const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "No Subject";
        const sender = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "Unknown Sender";
        const snippet = lastMsg.snippet || "";
        
        const internalDate = lastMsg.internalDate;
        const lastMessageDate = internalDate ? new Date(parseInt(internalDate)) : new Date();

        return {
          id: thread.id,
          subject,
          snippet,
          sender,
          lastMessageDate,
          rawMessages: messages,
        };
      } catch (err) {
        console.error(`Failed to fetch details for thread ${thread.id}:`, err);
        return null;
      }
    });

    const results = await Promise.all(threadPromises);
    return results.filter((t): t is GmailThreadInfo => t !== null);
  } catch (error) {
    console.error("Failed to fetch Gmail threads:", error);
    return getMockEmailThreads();
  }
}

const encodeBase64Url = (str: string): string => {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export function getMockEmailThreads(): GmailThreadInfo[] {
  return [
    {
      id: "thread-google-1",
      subject: "Update regarding your application at Google",
      snippet: "Hi there, thank you for taking the time to speak with us. We would love to move you forward to the next stage of our technical interview loop. Let's schedule a 45 min slot...",
      sender: "Google Recruiting <careers@google.com>",
      lastMessageDate: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      rawMessages: [
        {
          id: "msg-google-1",
          snippet: "Hi there, thank you for taking the time to speak with us...",
          payload: {
            headers: [
              { name: "From", value: "Google Recruiting <careers@google.com>" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 2).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Dear Candidate,</p>
                <p>Thank you for taking the time to speak with us. We would love to move you forward to the next stage of our technical interview loop.</p>
                <p>Let's schedule a 45-minute virtual technical interview. Please click the link below to select your preferred date and time:</p>
                <p style="margin: 20px 0;"><a href="https://calendly.com/google-recruiting" style="color:#6366f1;text-decoration:underline;font-weight:bold;">Schedule Technical Interview</a></p>
                <p>Best regards,<br/>Google Recruiting Team</p>
              `)
            }
          }
        }
      ],
    },
    {
      id: "thread-wellfound-1",
      subject: "Offer details: Fullstack AI Engineer",
      snippet: "We are thrilled to extend an offer for the Fullstack AI Engineer position! Attached are the details of the offer, stock options, and benefits package. Let's sync up...",
      sender: "Jane Doe <jane@wellfoundco.com>",
      lastMessageDate: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
      rawMessages: [
        {
          id: "msg-wellfound-1",
          snippet: "We are thrilled to extend an offer...",
          payload: {
            headers: [
              { name: "From", value: "Jane Doe <jane@wellfoundco.com>" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 24 * 3).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Hi there,</p>
                <p>We are thrilled to extend an offer for the Fullstack AI Engineer position! We were incredibly impressed by your technical assessment and interview performance.</p>
                <p>Attached are the details of the offer, stock options, and benefits package. Let's sync up tomorrow at 11:00 AM to go over the details and answer any questions you might have.</p>
                <p>Welcome to the team!</p>
                <p>Best,<br/>Jane Doe<br/>Co-founder, Wellfound Co.</p>
              `)
            }
          }
        }
      ],
    },
    {
      id: "thread-razorpay-1",
      subject: "Razorpay UI Engineer Application Status",
      snippet: "Thank you for your interest in Razorpay. While your profile is impressive, we decided to proceed with other candidates whose experience more closely matches...",
      sender: "Razorpay HR <no-reply@razorpay.com>",
      lastMessageDate: new Date(Date.now() - 3600000 * 24 * 6), // 6 days ago
      rawMessages: [
        {
          id: "msg-razorpay-1",
          snippet: "Thank you for your interest in Razorpay...",
          payload: {
            headers: [
              { name: "From", value: "Razorpay HR <no-reply@razorpay.com>" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 24 * 6).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Dear Candidate,</p>
                <p>Thank you for your interest in the UI Engineer position at Razorpay and for taking the time to apply. We appreciate the opportunity to review your profile.</p>
                <p>While your profile is impressive, we decided to proceed with other candidates whose experience more closely matches our current business requirements.</p>
                <p>We will keep your resume on file for future opportunities that align with your background. We wish you the best of luck in your job search.</p>
                <p>Sincerely,<br/>Razorpay Careers Team</p>
              `)
            }
          }
        }
      ],
    },
    {
      id: "thread-stripe-1",
      subject: "Stripe Software Engineer Application Received",
      snippet: "Thanks for applying to Stripe! We have received your application for the Software Engineer, Core API role and our recruiting team is currently reviewing it...",
      sender: "Stripe Careers <recruiting@stripe.com>",
      lastMessageDate: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
      rawMessages: [
        {
          id: "msg-stripe-1",
          snippet: "Thanks for applying to Stripe!...",
          payload: {
            headers: [
              { name: "From", value: "Stripe Careers <recruiting@stripe.com>" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 24 * 1).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Hi there,</p>
                <p>Thanks for applying to Stripe! We have received your application for the Software Engineer, Core API role.</p>
                <p>Our recruiting team is currently reviewing your application. If there is a fit with our current openings, a recruiter will reach out to schedule a brief introductory call.</p>
                <p>You can track the status of your application in your candidate portal at any time.</p>
                <p>Best regards,<br/>Stripe Recruiting Team</p>
              `)
            }
          }
        }
      ],
    },
    {
      id: "thread-unlinked-google-careers",
      subject: "New job(s) match your search on Google Careers",
      snippet: "For your search No keywords View more Product Lead, YouTube Ecosystem YouTube - Bengaluru Yesterday Bachelor's degree or equivalent practical experience. 3 years of experience translating user and...",
      sender: "careers-noreply@google.com",
      lastMessageDate: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      rawMessages: [
        {
          id: "msg-unlinked-google-careers",
          snippet: "For your search No keywords View more...",
          payload: {
            headers: [
              { name: "From", value: "careers-noreply@google.com" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 4).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Google Careers Job Alert</p>
                <p>Based on your search preferences, we found new matches for you:</p>
                <hr style="border:0;border-top:1px solid #ccc;margin:10px 0;"/>
                <p><strong>Product Lead, YouTube Ecosystem</strong><br/>
                YouTube - Bengaluru, Karnataka, India (Hybrid)<br/>
                Qualifications: Bachelor's degree or equivalent practical experience. 3 years of experience translating user needs into product designs and technical specifications.</p>
                <hr style="border:0;border-top:1px solid #ccc;margin:10px 0;"/>
                <p><strong>Frontend Software Engineer, Cloud</strong><br/>
                Google Cloud - Bengaluru, Karnataka, India<br/>
                Qualifications: 2 years of experience with React, Angular, or Vue. Passionate about cloud developer interfaces.</p>
                <p style="margin-top: 15px;"><a href="https://careers.google.com" style="color:#6366f1;text-decoration:underline;">View all matching jobs on Google Careers</a></p>
              `)
            }
          }
        }
      ],
    },
    {
      id: "thread-unlinked-linkedin-alerts",
      subject: "SHAIK MOHAMMAD ASRAR, want to continue receiving job alerts for Data Specialist in Mumbai, Maharashtra, India?",
      snippet: "We noticed you haven't checked this job alert in over 90 days.",
      sender: "LinkedIn <jobalerts-noreply@linkedin.com>",
      lastMessageDate: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
      rawMessages: [
        {
          id: "msg-unlinked-linkedin-alerts",
          snippet: "We noticed you haven't checked this job alert...",
          payload: {
            headers: [
              { name: "From", value: "LinkedIn <jobalerts-noreply@linkedin.com>" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 24 * 3).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Hi SHAIK MOHAMMAD ASRAR,</p>
                <p>We noticed you haven't checked this job alert in over 90 days. We wanted to confirm if you want to continue receiving alerts for <strong>Data Specialist</strong> positions in Mumbai, Maharashtra, India.</p>
                <p style="margin: 15px 0;"><a href="https://linkedin.com/jobs" style="color:#6366f1;text-decoration:underline;font-weight:bold;">Keep receiving job alerts</a> | <a href="https://linkedin.com/jobs" style="color:#6366f1;text-decoration:underline;margin-left: 10px;">Turn off alerts</a></p>
              `)
            }
          }
        }
      ],
    },
    {
      id: "thread-microsoft-1",
      subject: "Thank you for your application!",
      snippet: "Hi Shaik, Thank you for taking the time to submit your application for Software Engineer 2 (Job number: 200038919). We're glad you're interested in a career at Microsoft...",
      sender: "Microsoft Careers <donotreply@email.careers.microsoft.com>",
      lastMessageDate: new Date(Date.now() - 3600000 * 24 * 1),
      rawMessages: [
        {
          id: "msg-microsoft-1",
          snippet: "Hi Shaik, Thank you for taking the time to submit your application for Software Engineer 2 (Job number: 200038919)...",
          payload: {
            headers: [
              { name: "From", value: "Microsoft Careers <donotreply@email.careers.microsoft.com>" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 24 * 1).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Hi Shaik,</p>
                <p>Thank you for taking the time to submit your application for Software Engineer 2 (Job number: 200038919). We're glad you're interested in a career at Microsoft.</p>
              `)
            }
          }
        }
      ]
    },
    {
      id: "thread-microsoft-2",
      subject: "Thank you for your application!",
      snippet: "Hi Shaik, Thank you for taking the time to submit your application for Software Engineer 2 (Job number: 200038920). We're glad you're interested in a career at Microsoft...",
      sender: "Microsoft Careers <donotreply@email.careers.microsoft.com>",
      lastMessageDate: new Date(Date.now() - 3600000 * 24 * 1),
      rawMessages: [
        {
          id: "msg-microsoft-2",
          snippet: "Hi Shaik, Thank you for taking the time to submit your application for Software Engineer 2 (Job number: 200038920)...",
          payload: {
            headers: [
              { name: "From", value: "Microsoft Careers <donotreply@email.careers.microsoft.com>" },
              { name: "Date", value: new Date(Date.now() - 3600000 * 24 * 1).toUTCString() }
            ],
            body: {
              data: encodeBase64Url(`
                <p>Hi Shaik,</p>
                <p>Thank you for taking the time to submit your application for Software Engineer 2 (Job number: 200038920). We're glad you're interested in a career at Microsoft.</p>
              `)
            }
          }
        }
      ]
    }
  ];
}
