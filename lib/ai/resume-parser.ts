import { openai } from "./openai";
import { ParsedResume } from "@/types";

export async function parseResumeText(text: string): Promise<ParsedResume> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not defined. Using mock parsed resume structure.");
    return getMockParsedResume();
  }

  try {
    const prompt = `
You are an advanced AI resume parser. Extract structured information from the following raw resume text.

Resume Text:
${text}

Provide the extracted data in JSON format matching the following schema:
{
  "contact": {
    "name": "Full name",
    "email": "Email address",
    "phone": "Phone number (optional)",
    "location": "City, Country or City, State (optional)",
    "linkedin": "LinkedIn profile URL (optional)",
    "github": "GitHub profile URL (optional)",
    "portfolio": "Portfolio URL (optional)"
  },
  "summary": "Short professional summary",
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Job location (optional)",
      "startDate": "Start date (e.g. Month Year or Year)",
      "endDate": "End date (or 'Present')",
      "current": true/false if current job,
      "bullets": [
        "Responsibility or accomplishment bullet point 1",
        "Responsibility or accomplishment bullet point 2"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree (e.g. Bachelor of Science in Computer Science)",
      "institution": "University/School name",
      "location": "Location (optional)",
      "graduationDate": "Graduation date (optional)",
      "gpa": "GPA (optional)"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": ["Cert 1", "Cert 2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Short tagline or overview of the project",
      "bullets": [
        "Detailed bullet point describing contribution, technology used, or impact",
        "Detailed bullet point describing contribution, technology used, or impact"
      ],
      "technologies": ["Tech 1", "Tech 2"],
      "url": "Project URL (optional)"
    }
  ]
}

Ensure all fields conform to the schema. Output ONLY valid raw JSON. Do not include markdown code blocks.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional resume parser that outputs JSON.",
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

    return JSON.parse(content) as ParsedResume;
  } catch (error) {
    console.error("OpenAI resume parsing error:", error);
    return getMockParsedResume();
  }
}

function getMockParsedResume(): ParsedResume {
  return {
    contact: {
      name: "John Doe",
      email: "johndoe@example.com",
      phone: "+91 98765 43210",
      location: "Bangalore, India",
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
    },
    summary: "Senior Software Engineer with 5+ years of experience specializing in building highly interactive and performant web applications using React, Next.js, and TypeScript.",
    skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "TailwindCSS", "REST APIs", "Git"],
    experience: [
      {
        title: "Senior Software Engineer",
        company: "Tech Corp",
        location: "Bangalore, India",
        startDate: "Jun 2022",
        endDate: "Present",
        current: true,
        bullets: [
          "Led development of the company's main dashboard app, reducing load time by 30% and improving Core Web Vitals.",
          "Mentored 4 junior engineers and instituted frontend testing practices using Jest and Testing Library.",
          "Designed and shipped a reusable component library integrated with custom styling tokens."
        ]
      },
      {
        title: "Software Engineer",
        company: "Dev Studio",
        location: "Remote",
        startDate: "Jan 2020",
        endDate: "May 2022",
        current: false,
        bullets: [
          "Developed and optimized RESTful APIs in Node.js/Express, increasing throughput by 25%.",
          "Built responsive UI components using React and styled-components, improving mobile conversion by 15%."
        ]
      }
    ],
    education: [
      {
        degree: "Bachelor of Technology in Computer Science",
        institution: "Indian Institute of Technology",
        location: "Mumbai, India",
        graduationDate: "May 2019",
      }
    ],
    projects: [
      {
        name: "Personal Dev Portfolio",
        description: "A fast, fully accessible personal portfolio showcasing projects and blog posts.",
        bullets: [
          "Developed high-performance web pages utilizing Next.js App Router and Framer Motion.",
          "Achieved perfect 100/100 Lighthouse scores across performance, accessibility, best practices, and SEO."
        ],
        technologies: ["Next.js", "TailwindCSS", "Framer Motion"],
        url: "https://johndoe.dev",
      }
    ]
  };
}
