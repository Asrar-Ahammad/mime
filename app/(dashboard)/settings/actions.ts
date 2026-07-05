"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveSettings(data: {
  targetRoles: string[];
  targetLocations: string[];
  minSalary: number | null;
  platforms: string[];
  autoApply: boolean;
  dailyLimit: number;
  isActive: boolean;
  syncHour: number;
  syncMinute: number;
  autoDeleteUnlinkedEmails: boolean;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const existingConfig = await db.agentConfig.findFirst({
      where: { userId },
    });

    const payload = {
      targetRoles: data.targetRoles,
      targetLocations: data.targetLocations,
      minSalary: data.minSalary,
      platforms: data.platforms,
      autoApply: data.autoApply,
      dailyLimit: data.dailyLimit,
      isActive: data.isActive,
      syncHour: data.syncHour,
      syncMinute: data.syncMinute,
      autoDeleteUnlinkedEmails: data.autoDeleteUnlinkedEmails,
    };

    if (existingConfig) {
      await db.agentConfig.update({
        where: { id: existingConfig.id },
        data: payload,
      });
    } else {
      await db.agentConfig.create({
        data: { userId, ...payload },
      });
    }

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Failed to save settings:", err);
    return { success: false, error: err.message || "Database update failed" };
  }
}

