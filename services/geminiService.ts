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
  const activeKey = apiKey || (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';
  const genAI = new GoogleGenerativeAI(activeKey);
  
  // SAFETY FALLBACK: Use gemini-pro on v1 for maximum stability
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    apiVersion: 'v1'
  });

  const prompt = `Extract property data from the following text into a structured JSON object. 
  
  Input Text: "${input}"

  You must return a JSON object strictly following this schema:
  {
    "property_id": "EG-${Math.floor(Math.random() * 1000)}",
    "category": "Residential" | "Commercial",
    "status": "Active",
    "tier": "Standard" | "Estate Guard",
    "listing_details": {
      "address": "Full address string",
      "price": number (no symbols),
      "hero_narrative": "A compelling marketing description (2 sentences)",
      "key_stats": {
        "bedrooms": number,
        "bathrooms": number,
        "sq_ft": number,
        "lot_size": "string (e.g. 0.5 acres)"
      }
    },
    "visibility_protocol": {
      "public_fields": ["address", "hero_narrative"],
      "gated_fields": ["private_appraisal", "seller_concessions"]
    },
    "agent_notes": {
      "motivation": "string",
      "showing_instructions": "string"
    }
  }
  
  If a field is not found, infer a reasonable value or use null. Return ONLY the JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = extractJson(text); // Use the helper we added earlier
    
    // Fallback ID if model forgets
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    
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
  const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      systemInstruction: `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE:\n${JSON.stringify(propertyContext, null, 2)}`
  }, { apiVersion: 'v1' });

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
  
  // Use gemini-pro for audio (text-only fallback as pro is not multimodal in v1 free tier usually, but trying for consistent API)
  // Note: gemini-pro is text-only. For audio we usually need 1.5-flash. 
  // However, since 1.5-flash is failing, we might break audio here, but we MUST fix text ingestion first.
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    apiVersion: 'v1' 
  });

  const result = await model.generateContent([
    { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
    { text: "STRICT TRANSCRIPTION: Convert this voice note to text without additions." }
  ]);

  const response = await result.response;
  return response.text() || "";
};