import { GoogleGenerativeAI } from "@google/generative-ai";
import { SCRAPER_SYSTEM_INSTRUCTION, ESTATE_GUARD_SYSTEM_INSTRUCTION } from "../constants";
import { PropertySchema, AgentSettings } from "../types";

// --- API KEY RETRIEVAL ---
// Unified helper to handle Vite environment variables and passed keys
const getApiKey = (passedKey?: string) => {
  return passedKey || 
    (import.meta as any).env?.VITE_GOOGLE_API_KEY || 
    '';
};

// --- SYSTEM INSTRUCTION HYDRATION ---
const hydrateInstruction = (settings: AgentSettings) => {
  return ESTATE_GUARD_SYSTEM_INSTRUCTION
    .replace(/{BUSINESS_NAME}/g, settings.businessName || "our agency")
    .replace(/{BUSINESS_ADDRESS}/g, settings.businessAddress || "our hq")
    .replace(/{SPECIALTIES}/g, settings.specialties?.join(", ") || "Luxury Real Estate");
};

// --- RESILIENT JSON EXTRACTION ---
// Strips markdown fences (```json) and extracts valid JSON objects
function extractJson(text: string): any {
  const fencedMatch = text.match(/```json([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
  const jsonCandidate = (fencedMatch ? fencedMatch[1] : text).trim();
  
  const firstBrace = jsonCandidate.indexOf("{");
  const lastBrace = jsonCandidate.lastIndexOf("}");
  
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
  
  const sliced = jsonCandidate.slice(firstBrace, lastBrace + 1);
  return JSON.parse(sliced);
}

// --- PROPERTY DATA SCRAPER ---
export const parsePropertyData = async (input: string, apiKey?: string): Promise<any> => {
  const activeKey = getApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(activeKey);
  
  // FIX: Force 'v1' API version to resolve the 404 "model not found" error
  const model = genAI.getGenerativeModel(
    { model: 'gemini-1.5-flash-latest' }, 
    { apiVersion: 'v1' }
  );

  const prompt = `
    SYSTEM: ${SCRAPER_SYSTEM_INSTRUCTION}
    USER REQUEST: Extract property data from: "${input}". 
    REQUIREMENTS: Return ONLY a valid JSON object with: address, price, bedrooms, bathrooms, sq_ft, hero_narrative.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Use resilient extractor to handle markdown formatting
    const data = extractJson(text);
    
    if (!data.property_id) {
      data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    }
    return data;
  } catch (e) {
    console.error("[DEBUG] Gemini Execution Error:", e);
    throw new Error("Intelligence sync failed. Please verify the source data and try again.");
  }
};

// --- AI CONCIERGE CHAT ---
export const chatWithGuard = async (
  history: any[],
  propertyContext: PropertySchema,
  settings: AgentSettings,
  apiKey?: string
) => {
  const activeKey = getApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(activeKey);
  
  // Force v1 for stability in chat deployment
  const model = genAI.getGenerativeModel(
    { 
      model: 'gemini-1.5-flash',
      systemInstruction: `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE:\n${JSON.stringify(propertyContext, null, 2)}`
    },
    { apiVersion: 'v1' }
  );

  const chat = model.startChat({ 
    history: history.map(h => ({ 
      role: h.role === 'model' ? 'model' : 'user', 
      parts: h.parts 
    })) 
  });
  
  const lastUserMsg = history[history.length - 1].parts[0].text;
  const result = await chat.sendMessage(lastUserMsg);
  const response = await result.response;
  return response.text();
};

// --- AUDIO TRANSCRIPTION ---
export const transcribeAudio = async (base64Audio: string, apiKey?: string): Promise<string> => {
  const activeKey = getApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(activeKey);
  
  // Force v1 for multimodal processing
  const model = genAI.getGenerativeModel(
    { model: 'gemini-1.5-flash' },
    { apiVersion: 'v1' }
  );

  const result = await model.generateContent([
    { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
    { text: "STRICT TRANSCRIPTION: Convert this voice note to text without additions." }
  ]);

  const response = await result.response;
  return response.text() || "";
};