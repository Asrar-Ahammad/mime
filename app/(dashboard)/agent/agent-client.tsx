"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AgentClient() {
  const [platform, setPlatform] = useState("https://news.ycombinator.com/jobs");
  const [keywords, setKeywords] = useState("Software Engineer");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedResults = localStorage.getItem("mime_agent_results");
    if (savedResults) {
      setResults(savedResults);
    }
  }, []);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);
    localStorage.removeItem("mime_agent_results");

    try {
      const res = await fetch("/api/agent/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, keywords }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to run agent");
      }

      setResults(data.data);
      localStorage.setItem("mime_agent_results", data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          AI Job Agent
        </h1>
        <p className="text-muted-foreground">
          Deploy an autonomous browser agent to discover and extract jobs directly from platforms.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-border/40 bg-card/50 backdrop-blur shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Discovery Settings</CardTitle>
            <CardDescription>Configure where the agent should look.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDiscover} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="platform">Target Platform URL</label>
                <Input 
                  id="platform" 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="e.g. https://news.ycombinator.com/jobs"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="keywords">Keywords / Role</label>
                <Input 
                  id="keywords" 
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. Frontend Developer"
                  required
                />
              </div>
              <Button type="submit" className="w-full shadow-md" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agent is browsing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Run Discovery Agent
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border/40 bg-card/50 backdrop-blur min-h-[400px] shadow-lg relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <CardHeader>
            <CardTitle className="text-lg">Agent Results</CardTitle>
            <CardDescription>
              {isLoading ? "The agent is navigating the web. This may take up to 30 seconds." : "Results will appear here once the agent completes its run."}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {error && (
              <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm shadow-sm">
                <p className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Error
                </p>
                <p className="mt-1">{error}</p>
              </div>
            )}
            
            {isLoading && !results && !error && (
              <div className="flex flex-col items-center justify-center min-h-[350px] w-full py-4">
                <TerminalLoading />
              </div>
            )}

            {results && (
              <div className="p-5 rounded-xl border border-border/40 bg-accent/10 shadow-inner overflow-x-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{results}</ReactMarkdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TerminalLoading() {
  const steps = [
    "[SYSTEM] Booting secure agent container...",
    "[PLAYWRIGHT] Initializing headless chromium...",
    "[STEALTH] Applying Cloudflare & bot evasions...",
    "[AGENT] Navigating to target URL...",
    "[NETWORK] Intercepting DOM payload...",
    "[PARSER] Resolving relative links & stripping scripts...",
    "[LLM] Formulating extraction strategy...",
    "[LLM] Parsing job listings from DOM...",
    "[SYSTEM] Structuring markdown response...",
  ];
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  
  useEffect(() => {
    if (currentStepIndex >= steps.length) return;
    
    const delay = Math.random() * 1000 + 800; // 800ms - 1800ms
    const timeout = setTimeout(() => {
      setDisplayedLines(prev => [...prev, steps[currentStepIndex]]);
      setCurrentStepIndex(prev => prev + 1);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [currentStepIndex]);

  return (
    <div className="w-full max-w-2xl bg-black/95 rounded-lg p-5 font-mono text-xs text-white border border-white/20 shadow-2xl overflow-hidden relative">
      <div className="flex gap-2 mb-4 border-b border-white/10 pb-3">
        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
      </div>
      <div className="space-y-2 h-[200px] flex flex-col justify-end overflow-hidden relative">
        {displayedLines.map((line, i) => (
          <div key={i} className="animate-fade-in flex">
            <span className="text-gray-500 mr-3">{'>'}</span>
            <span>{line}</span>
          </div>
        ))}
        {currentStepIndex < steps.length && (
          <div className="flex animate-pulse">
            <span className="text-gray-500 mr-3">{'>'}</span>
            <span className="w-2.5 h-4 bg-white mt-0.5"></span>
          </div>
        )}
        {currentStepIndex >= steps.length && (
          <div className="flex animate-pulse">
            <span className="text-gray-500 mr-3">{'>'}</span>
            <span className="text-yellow-400">Awaiting final payload...</span>
            <span className="w-2.5 h-4 bg-white ml-2 mt-0.5"></span>
          </div>
        )}
      </div>
    </div>
  );
}
