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

// --- FALLBACK LOGIC ---
const KNOWN_MODELS = [
  { name: 'gemini-1.5-flash', apiVersion: undefined },       // Try default SDK routing first
  { name: 'gemini-1.5-flash-latest', apiVersion: 'v1beta' }, // Explicit beta latest
  { name: 'gemini-1.5-flash-001', apiVersion: 'v1beta' },    // Explicit beta 001
  { name: 'gemini-pro', apiVersion: 'v1' },                  // Stable v1 fallback
  { name: 'gemini-1.0-pro', apiVersion: 'v1' },              // Legacy stable
];

async function executeWithFallback<T>(
  action: (model: any) => Promise<T>, 
  getApiKey: () => string,
  systemInstruction?: string
): Promise<T> {
  const activeKey = getApiKey();
  const genAI = new GoogleGenerativeAI(activeKey);
  let lastError: any;

  for (const config of KNOWN_MODELS) {
    try {
      // console.log(`[DEBUG] Trying model: ${config.name} (${config.apiVersion || 'default'})`);
      const modelParams: any = { model: config.name };
      if (systemInstruction) modelParams.systemInstruction = systemInstruction;
      
      const requestOptions: any = {};
      if (config.apiVersion) requestOptions.apiVersion = config.apiVersion;

      const model = genAI.getGenerativeModel(modelParams, requestOptions);
      return await action(model);
    } catch (e: any) {
      // If 404 (Not Found) or 400 (Bad Request - invalid model), try next
      if (e.message?.includes('404') || e.message?.includes('400') || e.message?.includes('not found')) {
        console.warn(`[Gemini] Model ${config.name} failed: ${e.message}. Retrying...`);
        lastError = e;
        continue;
      }
      throw e; // Use the first critical error if it's not a model availability issue
    }
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown'}`);
}

// --- PROPERTY DATA SCRAPER ---

export const parsePropertyData = async (input: string, apiKey?: string): Promise<any> => {
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

  return executeWithFallback(async (model) => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = extractJson(text);
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    return data;
  }, () => apiKey || (import.meta as any).env?.VITE_GOOGLE_API_KEY || '');
};

// --- AI CONCIERGE CHAT ---
export const chatWithGuard = async (
  history: any[],
  propertyContext: PropertySchema,
  settings: AgentSettings,
  apiKey?: string
) => {
  const systemInstruction = `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE:\n${JSON.stringify(propertyContext, null, 2)}`;
  const lastUserMsg = history[history.length - 1].parts[0].text;

  return executeWithFallback(async (model) => {
    const chat = model.startChat({ 
      history: history.slice(0, -1).map(h => ({ 
        role: h.role === 'model' ? 'model' : 'user', 
        parts: h.parts 
      })) 
    });
    const result = await chat.sendMessage(lastUserMsg);
    const response = await result.response;
    return response.text();
  }, () => getApiKey(apiKey), systemInstruction);
};

// --- AUDIO TRANSCRIPTION ---
export const transcribeAudio = async (base64Audio: string, apiKey?: string): Promise<string> => {
  return executeWithFallback(async (model) => {
    const result = await model.generateContent([
      { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
      { text: "STRICT TRANSCRIPTION: Convert this voice note to text without additions." }
    ]);
    const response = await result.response;
    return response.text() || "";
  }, () => getApiKey(apiKey));
};