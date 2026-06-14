import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full p-4 space-y-6">
      <div className="flex items-center justify-center">
        {/* Spinner */}
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
      
      <div className="space-y-2 text-center">
        <h3 className="text-sm font-semibold tracking-wide text-foreground">
          Loading
        </h3>
        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
          Please wait while we retrieve your data.
        </p>
      </div>
    </div>
  );
}
