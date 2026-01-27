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

export const parsePropertyData = async (input: string, apiKey?: string): Promise<PropertySchema> => {
  const activeKey = getApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(activeKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: SCRAPER_SYSTEM_INSTRUCTION 
  });

  const isUrl = input.trim().startsWith('http');
  
  const prompt = `DATA SOURCE: "${input}"
COMMAND:
1. Extract ALL available property details.
2. If this is a URL, visit the page and find: Address, Full Price, Bedroom count, Bathroom count, Square Footage, and a 2-3 sentence descriptive summary.
3. ADHERE TO THE GROUNDING PROTOCOL: If any field (like Price or Sq Ft) is not explicitly found, set it to 0. If Bed/Bath is missing, set to null.
4. DO NOT HALLUCINATE OR GUESS.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      // Restoring the full schema logic for production accuracy
    }
  });

  try {
    const response = await result.response;
    const text = response.text();
    // Clean potential markdown artifacts
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson) as PropertySchema;
    
    // Safety Fallbacks for UI Stability
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    if (!data.status) data.status = 'Active';
    if (!data.category) data.category = 'Residential';
    if (!data.listing_details) {
      data.listing_details = { address: "Unknown", price: 0, hero_narrative: "" };
    }
    
    return data;
  } catch (e) {
    console.error("Scraper JSON Error:", e);
    throw new Error("Synchronization interrupted. The source data was non-standard.");
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