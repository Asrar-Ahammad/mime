export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Prevent duplicate intervals in development hot reloading
    const g = globalThis as any;
    if (g.gmailSyncIntervalInitialized) {
      return;
    }
    g.gmailSyncIntervalInitialized = true;

    console.log("[Scheduler] Initializing daily Gmail synchronization scheduler...");

    const checkAndSync = async () => {
      try {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const { db } = await import("@/lib/db");
        const { syncUserEmails } = await import("@/lib/email/email-parser");

        // Find users with explicit matching sync config
        const configs = await db.agentConfig.findMany({
          where: {
            syncHour: hours,
            syncMinute: minutes,
          },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                email: true,
              }
            }
          }
        });

        const usersToSync = configs.map(c => c.user);

        // If current time is 6:00 AM, also sync users who don't have an AgentConfig record (default sync time)
        if (hours === 6 && minutes === 0) {
          const defaultUsers = await db.user.findMany({
            where: {
              agentConfigs: {
                none: {}
              }
            },
            select: {
              id: true,
              email: true,
            }
          });
          usersToSync.push(...defaultUsers);
        }

        if (usersToSync.length > 0) {
          console.log(`[Scheduler] ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} reached. Triggering Gmail sync for ${usersToSync.length} users...`);
          for (const user of usersToSync) {
            try {
              const count = await syncUserEmails(user.id);
              console.log(`[Scheduler] Synced ${count} new email threads for ${user.email}`);
            } catch (err) {
              console.error(`[Scheduler] Sync failed for user ${user.id}:`, err);
            }
          }
        }
      } catch (error) {
        console.error("[Scheduler] Error running background sync check:", error);
      }
    };

    // Check time every 60 seconds (60000 ms)
    g.gmailSyncInterval = setInterval(checkAndSync, 60000);
  }
}
