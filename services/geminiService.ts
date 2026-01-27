import { GoogleGenerativeAI } from "@google/generative-ai";
import { SCRAPER_SYSTEM_INSTRUCTION, ESTATE_GUARD_SYSTEM_INSTRUCTION } from "../constants";
import { PropertySchema, AgentSettings } from "../types";

// --- DUAL-PREFIX KEY RETRIEVAL ---
// This is the "magic" that allows the browser to find your Vercel keys
const getApiKey = (passedKey?: string) => {
  return passedKey || 
    (import.meta as any).env?.VITE_GOOGLE_API_KEY || 
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 
    '';
};

const hydrateInstruction = (settings: AgentSettings) => {
  return ESTATE_GUARD_SYSTEM_INSTRUCTION
    .replace(/{BUSINESS_NAME}/g, settings.businessName || "our agency")
    .replace(/{BUSINESS_ADDRESS}/g, settings.businessAddress || "our hq")
    .replace(/{SPECIALTIES}/g, settings.specialties?.join(", ") || "Luxury Real Estate");
};





// ADD THIS HELPER at the top of your geminiService.ts file
function extractJson(text: string): any {
  const fencedMatch = text.match(/```json([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
  const jsonCandidate = (fencedMatch ? fencedMatch[1] : text).trim();
  
  const firstBrace = jsonCandidate.indexOf("{");
  const lastBrace = jsonCandidate.lastIndexOf("}");
  
  if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
  
  const sliced = jsonCandidate.slice(firstBrace, lastBrace + 1);
  return JSON.parse(sliced);
}





import { GoogleGenerativeAI } from "@google/generative-ai";

// Standardize key retrieval
const getApiKey = () => (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';

export const parsePropertyData = async (input: string, apiKey?: string): Promise<any> => {
  const activeKey = apiKey || getApiKey();
  const genAI = new GoogleGenerativeAI(activeKey);
  
  // FIX: Explicitly use 'gemini-1.5-flash' with the 'v1' API version
  const model = genAI.getGenerativeModel(
    { model: 'gemini-1.5-flash' }, 
    { apiVersion: 'v1' }
  );

  const prompt = `Extract property data from: "${input}". Return JSON: address, price, bedrooms, bathrooms, sq_ft, hero_narrative.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Resilient JSON parsing
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson);
    
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    return data;
  } catch (e) {
    console.error("[DEBUG] Gemini Execution Error:", e);
    throw new Error("Intelligence sync failed. Please verify the source data and try again.");
  }
};


export const chatWithGuard = async (
  history: any[],
  propertyContext: PropertySchema,
  settings: AgentSettings,
  apiKey?: string
) => {
  const activeKey = getApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(activeKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE:\n${JSON.stringify(propertyContext, null, 2)}`
  });

  const chat = model.startChat({ 
    history: history.map(h => ({ role: h.role === 'model' ? 'model' : 'user', parts: h.parts })) 
  });
  
  const lastUserMsg = history[history.length - 1].parts[0].text;
  const result = await chat.sendMessage(lastUserMsg);
  const response = await result.response;
  return response.text();
};

export const transcribeAudio = async (base64Audio: string, apiKey?: string): Promise<string> => {
  const activeKey = getApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(activeKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
    { text: "STRICT TRANSCRIPTION: Convert this voice note to text without additions." }
  ]);

  const response = await result.response;
  return response.text() || "";
};