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
  
  // Use 1.5-flash for speed and standard compatibility
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
  });

  const prompt = `
    SYSTEM: ${SCRAPER_SYSTEM_INSTRUCTION}
    
    USER REQUEST: Extract property data from this source: "${input}"
    
    REQUIREMENTS:
    1. Extract: Address, Price, Bedrooms, Bathrooms, Sq Ft, and a 2-3 sentence Hero Narrative.
    2. If numeric values are missing, return 0.
    3. Return ONLY a valid JSON object matching the PropertySchema.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean markdown and parse
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson) as PropertySchema;
    
    // Final UI data safety check
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    return data;
  } catch (e) {
    console.error("Gemini Execution Error:", e);
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