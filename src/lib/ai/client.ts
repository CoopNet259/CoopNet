import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * gemini-2.0-flash → hızlı, ucuz, günlük işlemler için
 * gemini-1.5-pro   → karmaşık akışlar için fallback (complex=true)
 */
export function getModel(complex = false, systemInstruction?: string) {
  const modelName = complex ? "gemini-2.5-pro" : "gemini-2.5-flash";
  return genAI.getGenerativeModel({
    model: modelName,
    ...(systemInstruction && { systemInstruction }),
  });
}
