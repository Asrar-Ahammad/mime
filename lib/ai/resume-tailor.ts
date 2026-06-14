import { openai } from "./openai";
import { ParsedResume } from "@/types";

export async function tailorResume(
  resume: ParsedResume,
  jobTitle: string,
  companyName: string,
  jobDescription: string
): Promise<ParsedResume> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not defined. Using mock resume tailoring.");
    return getMockTailoring(resume, jobTitle, companyName);
  }

  try {
    const prompt = `
You are an elite professional CV writer and technical recruiter. Your task is to tailor a candidate's resume (JSON format) to perfectly align with a target job description, optimizing it for ATS and human review.

CRITICAL RULES:
1. Preserve all factual timelines, company names, degrees, and core roles. Do not invent fake jobs, degrees, or certifications.
2. Reword, adapt, and refine the professional summary, experience bullet points, and project descriptions/bullets to emphasize accomplishments, technologies, and methodologies that match the job description.
3. Incorporate relevant technical keywords from the job description into the summary, experience bullets, and skills section (if the candidate possesses background in them).
4. Keep the output structure identical to the input JSON schema.

Target Job details:
- Title: ${jobTitle}
- Company: ${companyName}
- Job Description:
${jobDescription}

Candidate Resume JSON:
${JSON.stringify(resume, null, 2)}

Output ONLY valid raw JSON representing the fully tailored resume. Do not include markdown code block syntax.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional resume tailoring assistant that outputs JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content) as ParsedResume;
  } catch (error) {
    console.error("OpenAI resume tailoring error:", error);
    return getMockTailoring(resume, jobTitle, companyName);
  }
}

// Heuristic fallback for tailoring when API key is missing
function getMockTailoring(
  resume: ParsedResume,
  jobTitle: string,
  companyName: string
): ParsedResume {
  // Deep clone
  const tailored = JSON.parse(JSON.stringify(resume)) as ParsedResume;

  // Tailor contact name or professional summary
  tailored.summary = `Accomplished engineer with focused experience tailoring web architectures, cloud operations, and frontend layouts. Tailored for ${jobTitle} role at ${companyName} to build performant products.`;

  // Prepend a matching skill to skills list if missing
  const matchSkill = jobTitle.includes("Frontend") || jobTitle.includes("React") ? "Next.js" : "System Design";
  if (tailored.skills && !tailored.skills.includes(matchSkill)) {
    tailored.skills = [matchSkill, ...tailored.skills];
  }

  // Add customized notes to the first job experience bullet
  if (tailored.experience && tailored.experience.length > 0) {
    const firstJob = tailored.experience[0];
    firstJob.bullets = [
      `Optimized core application flows aligning with key responsibilities of ${jobTitle} profile at ${companyName}.`,
      ...firstJob.bullets,
    ];
  }

  return tailored;
}
