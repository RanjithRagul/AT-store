import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // Safe check for process.env
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;

  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI description unavailable (Missing API Key).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a catchy, short marketing description (max 2 sentences) for a product named "${productName}" in the category "${category}". Focus on benefits.`,
    });
    return response.text?.trim() || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate description at this time.";
  }
};