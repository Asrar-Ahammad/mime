import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AgentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <Card className="glass-card border-border/40 shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -left-16 -top-16 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-status-applied/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="flex flex-col items-center space-y-4 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary glow animate-pulse">
            <svg className="h-9 w-9" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,112H206.8a80.17,80.17,0,0,0-70.8-71.6V24a8,8,0,0,0-16,0V40.4a80.17,80.17,0,0,0-70.8,71.6H32a8,8,0,0,0,0,16H48v56a32,32,0,0,0,32,32H176a32,32,0,0,0,32-32V128h16a8,8,0,0,0,0-16ZM192,184a16,16,0,0,1-16,16H80a16,16,0,0,1-16-16V128H192Zm-24-40a12,12,0,1,1-12-12A12,12,0,0,1,168,144Zm-56,0a12,12,0,1,1-12-12A12,12,0,0,1,112,144Z" />
            </svg>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
              AI Job Agent
              <svg className="h-5 w-5 text-primary animate-pulse shrink-0" viewBox="0 0 256 256" fill="currentColor">
                <path d="M128,24a8,8,0,0,0-8,8c0,48.6-39.4,88-88,88a8,8,0,0,0,0,16c48.6,0,88,39.4,88,88a8,8,0,0,0,16,0c0-48.6,39.4-88,88-88a8,8,0,0,0,0-16c-48.6,0-88-39.4-88-88A8,8,0,0,0,128,24Z"/>
              </svg>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground uppercase tracking-widest font-semibold pt-1">
              Coming Soon
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our autonomous job search agent is currently undergoing fine-tuning to comply with target platforms and cloud environments.
          </p>
          <div className="rounded-xl border border-border/20 bg-accent/5 p-4 text-left space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">What's in development:</h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Autonomous job searching and tailored AI matching.
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Auto-apply with tailored cover letters and optimized resumes.
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                Cross-platform integrations with direct status synchronization.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
