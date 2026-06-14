import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ applications: [], resumes: [], emails: [] });
    }

    const [applications, resumes, emails] = await Promise.all([
      db.application.findMany({
        where: {
          userId,
          OR: [
            { company: { contains: query, mode: "insensitive" } },
            { jobTitle: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          company: true,
          jobTitle: true,
          status: true,
        },
        take: 5,
      }),
      db.resume.findMany({
        where: {
          userId,
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          isMaster: true,
        },
        take: 5,
      }),
      db.emailThread.findMany({
        where: {
          OR: [
            { applicationId: null },
            { application: { userId } },
          ],
          AND: [
            {
              OR: [
                { subject: { contains: query, mode: "insensitive" } },
                { sender: { contains: query, mode: "insensitive" } },
                { snippet: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          subject: true,
          sender: true,
          snippet: true,
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({ applications, resumes, emails });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
