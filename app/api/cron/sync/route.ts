import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncUserEmails } from "@/lib/email/email-parser";

export async function GET(request: Request) {
  try {
    // Vercel Cron Secret Check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Universal sync scopes execution for all users in the system
    const users = await db.user.findMany({ select: { id: true, email: true } });
    console.log(`[Cron Sync] Starting sync for ${users.length} users...`);
    
    let totalSyncCount = 0;
    const results: any[] = [];

    // Parallelize execution with Promise.allSettled to speed up processing
    const syncPromises = users.map(async (user) => {
      try {
        const count = await syncUserEmails(user.id);

        let deletedCount = 0;
        try {
          const config = await db.agentConfig.findFirst({
            where: { userId: user.id },
          });

          // Default to true if config is missing; only explicit false disables auto-deletion
          const autoDelete = config ? config.autoDeleteUnlinkedEmails : true;

          if (autoDelete) {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const deleteResult = await db.emailThread.deleteMany({
              where: {
                userId: user.id,
                applicationId: null,
                createdAt: {
                  lt: twentyFourHoursAgo,
                },
              },
            });
            deletedCount = deleteResult.count;
            if (deletedCount > 0) {
              console.log(`[Cron Sync] Auto-deleted ${deletedCount} unlinked emails for user ${user.id}`);
            }
          }
        } catch (delErr) {
          console.error(`[Cron Sync] Auto-deletion failed for user ${user.id}:`, delErr);
        }

        return { userId: user.id, email: user.email, success: true, count, deletedCount };
      } catch (err: any) {
        console.error(`[Cron Sync] Sync failed for user ${user.id}:`, err);
        return { userId: user.id, email: user.email, success: false, error: err.message };
      }
    });

    const settledResults = await Promise.allSettled(syncPromises);

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        const value = result.value;
        results.push(value);
        if (value.success && value.count) {
          totalSyncCount += value.count;
        }
      }
    }

    return NextResponse.json({ success: true, totalSyncCount, results });
  } catch (error: any) {
    console.error("[Cron Sync] Global cron execution failed:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
