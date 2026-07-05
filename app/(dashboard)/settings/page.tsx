import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";
import { saveSettings } from "./actions";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  if (!userId) {
    redirect("/login");
  }

  // Fetch agent config
  const existingConfig = await db.agentConfig.findFirst({
    where: { userId },
  });

  const formattedConfig = existingConfig
    ? {
        id: existingConfig.id,
        targetRoles: existingConfig.targetRoles,
        targetLocations: existingConfig.targetLocations,
        minSalary: existingConfig.minSalary,
        platforms: existingConfig.platforms,
        autoApply: existingConfig.autoApply,
        dailyLimit: existingConfig.dailyLimit,
        isActive: existingConfig.isActive,
        syncHour: existingConfig.syncHour,
        syncMinute: existingConfig.syncMinute,
        autoDeleteUnlinkedEmails: existingConfig.autoDeleteUnlinkedEmails,
      }
    : null;

  return (
    <SettingsClient
      initialConfig={formattedConfig}
      saveAction={saveSettings}
    />
  );
}
