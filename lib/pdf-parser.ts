import { PDFParse } from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    return result.text;
  } catch (error) {
    console.error("Error parsing PDF buffer:", error);
    throw new Error("Failed to extract text from PDF");
  }
}


