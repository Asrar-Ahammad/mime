import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, keywords } = body;

    if (!platform || !keywords) {
      return NextResponse.json({ error: "Missing platform or keywords" }, { status: 400 });
    }

    // This URL will be available after deploying to Modal
    const modalUrl = process.env.MODAL_AGENT_URL;
    
    if (!modalUrl) {
      return NextResponse.json({ error: "MODAL_AGENT_URL is not configured in environment variables. Please deploy the agent to Modal first." }, { status: 500 });
    }

    const objective = `Navigate to ${platform} and search for ${keywords} jobs. Extract the top 3 job listings including job title, company name, and a link to the job. Return the results in a clean markdown format.`;

    const response = await fetch(modalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ objective }),
      // The browser automation can take a while, so we increase the timeout if possible
      // In Next.js serverless functions on Vercel, this is usually capped at 10-60s.
      // For a local or custom server, we might need to rely on the defaults.
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `Modal agent error: ${text}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Agent discover error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
