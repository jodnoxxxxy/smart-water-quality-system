import { AIWaterAnalysis, AIChatMessage, RegionType } from '../types';

export interface AnalyzeRequestParams {
  ph: number;
  tds: number;
  region?: RegionType | string;
  sourceName?: string;
  season?: string;
  notes?: string;
  mode?: 'resident' | 'tech';
}

export interface AnalyzeResponse {
  success: boolean;
  source: string;
  data: AIWaterAnalysis;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  error?: string;
}

export interface AIStatusResponse {
  configured: boolean;
  provider: string;
  model: string;
}

/**
 * Checks if the backend AI engine has a valid GEMINI_API_KEY configured.
 * Respects Rule 11 (does not expose API keys, only status).
 */
export async function getAIStatus(): Promise<AIStatusResponse> {
  try {
    const res = await fetch('/api/ai-status');
    if (!res.ok) throw new Error('Status endpoint unavailable');
    return await res.json();
  } catch {
    return { configured: false, provider: 'Expert Rule Engine', model: 'fallback' };
  }
}

/**
 * Calls backend server endpoint POST /api/analyze to perform real Gemini AI water quality diagnosis.
 * Respects Rule 8 (loading, success, error) and Rule 11 (API keys kept server-side).
 */
export async function requestAIWaterAnalysis(params: AnalyzeRequestParams): Promise<AIWaterAnalysis> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${res.status}`);
    }

    const json: AnalyzeResponse = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to retrieve AI analysis data');
    }

    return json.data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI analysis timed out. Please check your network connection and try again.');
    }
    throw err;
  }
}

/**
 * Ask AquaAI a specific household or technical water question via POST /api/ai-chat
 */
export async function askAquaAI(
  question: string,
  currentWater?: { tds: number; ph: number; sourceName?: string; season?: string }
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, currentWater }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error ${res.status}`);
    }

    const json: ChatResponse = await res.json();
    return json.answer;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AI query timed out. Please try asking again.');
    }
    throw err;
  }
}
