import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, action, section } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    let contextDesc = "resume text";
    if (section === "profile") {
      contextDesc = "professional summary/profile entry (focusing on high-level career achievements and core competencies)";
    } else if (section === "experience") {
      contextDesc = "professional work experience description (focusing on impact, key responsibilities, metrics, and actions)";
    }

    let prompt = "";
    if (action === "improve") {
      prompt = `You are a professional resume writer. Improve the following ${contextDesc} to make it sound more professional, impactful, and clear. 
CRITICAL: Keep any HTML tags (especially <a> tags like <a href="...">...</a>, <b>, <i>, <u>, <ul>, <li>, <ol>, etc.) exactly intact. Do not lose, modify, or strip any links or formatting tags. Keep the response as pure HTML formatting compatible with the input. Only output the modified text, do not add any markdown block wrapping like \`\`\`html or conversational filler.
Here is the text:
${text}`;
    } else if (action === "grammar") {
      prompt = `Fix all spelling, punctuation, and grammar errors in the following ${contextDesc}. 
CRITICAL: Keep any HTML tags (especially <a> tags like <a href="...">...</a>, <b>, <i>, <u>, <ul>, <li>, <ol>, etc.) exactly intact. Do not lose, modify, or strip any links or formatting tags. Keep the response as pure HTML formatting compatible with the input. Only output the corrected text, do not add any markdown block wrapping like \`\`\`html or conversational filler.
Here is the text:
${text}`;
    } else if (action === "shorter") {
      prompt = `Make the following ${contextDesc} shorter and more concise while maintaining its professional impact.
CRITICAL: Keep any HTML tags (especially <a> tags like <a href="...">...</a>, <b>, <i>, <u>, <ul>, <li>, <ol>, etc.) exactly intact. Do not lose, modify, or strip any links or formatting tags. Keep the response as pure HTML formatting compatible with the input. Only output the shortened text, do not add any markdown block wrapping like \`\`\`html or conversational filler.
Here is the text:
${text}`;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that improves resume text. Strictly preserve any HTML link tags (<a>) and formatting tags (<b>, <i>, etc.) exactly. Do not wrap output in markdown code blocks. Only return the corrected/improved text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const result = response.choices[0].message?.content || text;
    return NextResponse.json({ result: result.trim() });
  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process text" }, { status: 500 });
  }
}
