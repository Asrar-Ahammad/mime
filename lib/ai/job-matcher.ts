import { openai } from "./openai";
import { ParsedResume } from "@/types";

export interface MatchResult {
  fitScore: number;
  fitReasoning: string;
  missingSkills: string[];
  matchingSkills: string[];
}

export async function matchJob(
  resume: ParsedResume,
  jobDescription: string
): Promise<MatchResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not defined. Using mock matching heuristic.");
    return getMockMatch(resume, jobDescription);
  }

  try {
    const prompt = `
You are an expert technical recruiter and ATS parser. Compare the candidate's resume against the job description.
Assess the match score (0 to 100), identify key matching skills, and list critical missing skills.

Candidate Resume JSON:
${JSON.stringify(resume, null, 2)}

Job Description:
${jobDescription}

Provide your analysis in JSON format with the following keys:
- fitScore: integer between 0 and 100
- fitReasoning: a concise explanation (2-3 sentences) detailing the strength of match, key matches, and key gaps
- missingSkills: array of strings of critical technical skills or tools missing from the resume but required by the job
- matchingSkills: array of strings of matching technical skills or tools present in both

Output ONLY valid raw JSON. Do not include markdown code block syntax.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional ATS matching engine that outputs JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content) as MatchResult;
    return {
      fitScore: typeof result.fitScore === "number" ? result.fitScore : 70,
      fitReasoning: result.fitReasoning || "Matches core technical requirements.",
      missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
      matchingSkills: Array.isArray(result.matchingSkills) ? result.matchingSkills : [],
    };
  } catch (error) {
    console.error("OpenAI matching error:", error);
    return getMockMatch(resume, jobDescription);
  }
}

// Simple heuristic mock for local development when API key is missing or calls fail
function getMockMatch(resume: ParsedResume, jobDesc: string): MatchResult {
  const jdLower = jobDesc.toLowerCase();
  const allSkills = resume.skills || [];
  
  const matching: string[] = [];
  const missing: string[] = [];

  // Look for skill mentions in job desc
  allSkills.forEach((skill) => {
    if (jdLower.includes(skill.toLowerCase())) {
      matching.push(skill);
    }
  });

  // Basic mock list of common missing skills if match is low
  const commonTech = [
    "AWS", "Docker", "Kubernetes", "GraphQL", "Redis", 
    "System Design", "CI/CD", "Next.js", "TailwindCSS", 
    "TypeScript", "Python", "Node.js", "PostgreSQL", "MongoDB"
  ];
  
  commonTech.forEach((tech) => {
    if (jdLower.includes(tech.toLowerCase()) && !allSkills.some(s => s.toLowerCase() === tech.toLowerCase())) {
      missing.push(tech);
    }
  });

  // Calculate crude match percentage
  const matchRatio = matching.length / Math.max(matching.length + missing.length, 1);
  const fitScore = Math.min(Math.round(60 + (matchRatio * 40)), 98); // ranges between 60 and 98

  return {
    fitScore,
    fitReasoning: `Heuristic scan: Found ${matching.length} matching skills (${matching.slice(0, 3).join(", ")}) and detected ${missing.length} missing skill requirements. Suitable match profile.`,
    missingSkills: missing.slice(0, 5),
    matchingSkills: matching,
  };
}
