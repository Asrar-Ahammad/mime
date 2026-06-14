"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAgentEngine } from "@/lib/agent/engine";
import { revalidatePath } from "next/cache";

export async function runAgentAction() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const newApps = await runAgentEngine(userId);
    revalidatePath("/agent");
    revalidatePath("/");
    revalidatePath("/applications");
    return { success: true, count: newApps.length };
  } catch (err: any) {
    console.error("Agent execution failed:", err);
    return { success: false, error: err.message || "Engine run failed" };
  }
}

export async function toggleAgentAction(active: boolean) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const config = await db.agentConfig.findFirst({
      where: { userId },
    });

    if (config) {
      await db.agentConfig.update({
        where: { id: config.id },
        data: { isActive: active },
      });
    } else {
      await db.agentConfig.create({
        data: {
          userId,
          isActive: active,
          targetRoles: ["Software Engineer"],
          targetLocations: ["Remote"],
          platforms: ["wellfound"],
        },
      });
    }

    revalidatePath("/agent");
    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to toggle agent active state:", err);
    return { success: false, error: err.message || "Failed to toggle state" };
  }
}
