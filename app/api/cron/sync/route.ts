import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncUserEmails } from "@/lib/email/email-parser";

export async function GET(request: Request) {
  try {
    // Universal sync scopes execution for all users in the system
    const users = await db.user.findMany({ select: { id: true, email: true } });
    console.log(`[Cron Sync] Starting sync for ${users.length} users...`);
    
    let totalSyncCount = 0;
    const results = [];

    for (const user of users) {
      try {
        const count = await syncUserEmails(user.id);
        totalSyncCount += count;
        results.push({ userId: user.id, email: user.email, success: true, count });
      } catch (err: any) {
        console.error(`[Cron Sync] Sync failed for user ${user.id}:`, err);
        results.push({ userId: user.id, email: user.email, success: false, error: err.message });
      }
    }

    return NextResponse.json({ success: true, totalSyncCount, results });
  } catch (error: any) {
    console.error("[Cron Sync] Global cron execution failed:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
