import { GoogleGenerativeAI } from "@google/generative-ai";

const AI_MODEL = "models/gemini-2.5-flash"; // confirmado: funciona com esta API key

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY as string
);

export { genAI, AI_MODEL };
