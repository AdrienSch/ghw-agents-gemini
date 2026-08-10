import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await ai.models.generateContent({
  // "gemini-3.1-flash-lite", "gemini-3.5-flash-lite" --> Works!
  model: "gemini-3.1-flash-lite", // original model: "gemini-2.5-flash"
  contents: "Explain AI agents to a beginner in 3 sentences.",
});

console.log(response.text);