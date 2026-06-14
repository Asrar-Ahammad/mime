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
        return { userId: user.id, email: user.email, success: true, count };
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
