import { db } from "@/lib/db";
import { getMockEmailThreads } from "@/lib/email/gmail-client";

export async function seedUserDemoData(userId: string) {
  try {
    // 1. Check if user already has data to prevent duplicate seeding
    const appCount = await db.application.count({ where: { userId } });
    
    let createdApps: any[] = [];

    if (appCount === 0) {
      // Create a demo master resume
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      const resume = await db.resume.create({
        data: {
          userId,
          name: "Master_Resume.pdf",
          originalFile: "/resumes/demo-master.pdf",
          isMaster: true,
          parsedContent: {
            contact: {
              name: user?.name || "Candidate",
              email: user?.email || "candidate@example.com",
              phone: "+91 99999 99999",
              location: "Bangalore, India",
              linkedin: "linkedin.com/in/candidate",
              github: "github.com/candidate",
            },
            summary: "Experienced Fullstack Engineer specializing in building premium AI-powered web applications using React, Next.js, Node.js, and Python. Passionate about micro-interactions and visual aesthetics.",
            skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "TailwindCSS", "OpenAI API", "Python", "Docker"],
            education: [
              {
                degree: "Bachelor of Technology in Computer Science",
                institution: "Indian Institute of Technology",
                location: "India",
                graduationDate: "2024",
              }
            ],
            experience: [
              {
                title: "Frontend Engineer Intern",
                company: "Tech Solutions",
                location: "Bangalore",
                startDate: "Jun 2023",
                endDate: "Dec 2023",
                bullets: [
                  "Built and maintained complex React components with optimized performance.",
                  "Collaborated with UI/UX designers to implement pixel-perfect user interfaces.",
                  "Reduced bundle size by 18% through code splitting and tree shaking."
                ]
              }
            ]
          }
        }
      });

      // Create demo applications
      const appsData = [
        {
          company: "Google",
          jobTitle: "Senior Frontend Engineer",
          jobUrl: "https://careers.google.com",
          jobDescription: "Google is looking for a Frontend Engineer to build the next generation of Search layouts. Strong experience with React and CSS animations is required.",
          platform: "direct",
          status: "INTERVIEWING" as const,
          fitScore: 94,
          appliedAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
        },
        {
          company: "Stripe",
          jobTitle: "Software Engineer, Core API",
          jobUrl: "https://stripe.com/jobs",
          jobDescription: "Build robust payment APIs. Experience with database design and developer tools is highly valued.",
          platform: "indeed",
          status: "APPLIED" as const,
          fitScore: 88,
          appliedAt: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
        },
        {
          company: "Instahyre",
          jobTitle: "React Developer",
          jobUrl: "https://www.instahyre.com",
          jobDescription: "Fast-growing startup looking for a core React developer to take charge of our design system.",
          platform: "instahyre",
          status: "QUEUED" as const,
          fitScore: 81,
          appliedAt: null,
        },
        {
          company: "Wellfound Co.",
          jobTitle: "Fullstack AI Engineer",
          jobUrl: "https://wellfound.com",
          jobDescription: "Looking for an engineer to lead our AI search enhancements. Experience with vector databases and LLMs is required.",
          platform: "wellfound",
          status: "OFFERED" as const,
          fitScore: 97,
          appliedAt: new Date(Date.now() - 3600000 * 24 * 4), // 4 days ago
        },
        {
          company: "Razorpay",
          jobTitle: "UI Engineer",
          jobUrl: "https://razorpay.com/jobs",
          jobDescription: "Craft payment gateway checkout experiences. Focus on accessibility and page load speeds.",
          platform: "naukri",
          status: "REJECTED" as const,
          fitScore: 76,
          appliedAt: new Date(Date.now() - 3600000 * 24 * 6), // 6 days ago
        },
      ];

      for (const app of appsData) {
        const createdApp = await db.application.create({
          data: {
            ...app,
            userId,
            resumeId: resume.id,
          }
        });
        createdApps.push(createdApp);
      }

      // Create default agent configuration
      await db.agentConfig.create({
        data: {
          userId,
          targetRoles: ["Software Engineer", "Frontend Developer"],
          targetLocations: ["Remote", "Bangalore"],
          minSalary: 1200000,
          platforms: ["naukri", "instahyre", "wellfound"],
          autoApply: false,
          dailyLimit: 20,
          isActive: false,
        }
      });
    } else {
      // Fetch existing applications
      createdApps = await db.application.findMany({
        where: { userId }
      });
    }

    // Always seed/update mock email threads to ensure they have correct rawMessages
    const stripeApp = createdApps.find(a => a.company === "Stripe");
    const googleApp = createdApps.find(a => a.company === "Google");
    const razorpayApp = createdApps.find(a => a.company === "Razorpay");
    const wellfoundApp = createdApps.find(a => a.company === "Wellfound Co.");

    const mockThreads = getMockEmailThreads();
    const emailsData = mockThreads.map(thread => {
      let applicationId: string | null = null;
      if (thread.id === "thread-google-1") applicationId = googleApp?.id || null;
      else if (thread.id === "thread-wellfound-1") applicationId = wellfoundApp?.id || null;
      else if (thread.id === "thread-razorpay-1") applicationId = razorpayApp?.id || null;
      else if (thread.id === "thread-stripe-1") applicationId = stripeApp?.id || null;

      return {
        gmailThreadId: thread.id,
        subject: thread.subject,
        snippet: thread.snippet,
        sender: thread.sender,
        lastMessageDate: thread.lastMessageDate,
        applicationId,
        rawMessages: thread.rawMessages,
      };
    });

    for (const email of emailsData) {
      // Find if email thread already exists
      const existingThread = await db.emailThread.findUnique({
        where: { gmailThreadId: email.gmailThreadId }
      });

      // Preserve existing applicationId link if it's already set in the database
      const targetAppId = existingThread?.applicationId !== undefined ? existingThread.applicationId : email.applicationId;

      await db.emailThread.upsert({
        where: { gmailThreadId: email.gmailThreadId },
        update: {
          rawMessages: email.rawMessages,
          snippet: email.snippet,
          subject: email.subject,
          sender: email.sender,
          lastMessageDate: email.lastMessageDate,
          applicationId: targetAppId,
        },
        create: {
          ...email,
          applicationId: targetAppId,
        },
      });
    }

    console.log(`Demo data seeded successfully for user: ${userId}`);
  } catch (error) {
    console.error("Failed to seed demo data:", error);
  }
}
