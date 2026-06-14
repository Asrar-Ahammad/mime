import pdf from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const result = await pdf(buffer);
    return result.text;
  } catch (error) {
    console.error("Error parsing PDF buffer:", error);
    throw new Error("Failed to extract text from PDF");
  }
}


