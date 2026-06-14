import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AgentClient } from "@/components/agent/agent-client";
import { runAgentAction, toggleAgentAction } from "./actions";

export default async function AgentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  if (!userId) {
    redirect("/login");
  }

  // Fetch agent config
  let config = await db.agentConfig.findFirst({
    where: { userId },
  });

  // Create default config if none exists so user doesn't hit a blank state
  if (!config) {
    config = await db.agentConfig.create({
      data: {
        userId,
        targetRoles: ["Software Engineer", "Frontend Developer"],
        targetLocations: ["Remote", "Bangalore"],
        platforms: ["instahyre", "wellfound"],
        isActive: false,
        autoApply: false,
        dailyLimit: 15,
      },
    });
  }

  // Check if master resume exists
  const masterResumesCount = await db.resume.count({
    where: { userId, isMaster: true },
  });
  const hasMasterResume = masterResumesCount > 0;

  const formattedConfig = {
    isActive: config.isActive,
    autoApply: config.autoApply,
    targetRoles: config.targetRoles,
    targetLocations: config.targetLocations,
    platforms: config.platforms,
    dailyLimit: config.dailyLimit,
  };

  return (
    <AgentClient
      config={formattedConfig}
      hasMasterResume={hasMasterResume}
      runAgentAction={runAgentAction}
      toggleAgentAction={toggleAgentAction}
    />
  );
}
