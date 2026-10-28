import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Robust .env file loader for Node.js
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      if (typeof (process as any).loadEnvFile === 'function') {
        (process as any).loadEnvFile(envPath);
      } else {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
              const k = trimmed.substring(0, idx).trim();
              const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
              if (!process.env[k]) {
                process.env[k] = v;
              }
            }
          }
        });
      }
    } catch (e) {
      console.warn('Note: Could not load .env file:', e);
    }
  }
}
loadEnv();

// Helper to get GoogleGenAI client dynamically
function getAIClient(): GoogleGenAI | null {
  loadEnv();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key_here')) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * AI Status Endpoint to check if real Gemini API key is configured
 * GET /api/ai-status
 */
app.get('/api/ai-status', (_req: Request, res: Response) => {
  const client = getAIClient();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  res.json({
    configured: Boolean(client),
    model,
    provider: 'Google Gemini AI',
  });
});

/**
 * Real AI Water Diagnostic Endpoint
 * POST /api/analyze
 */
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { ph, tds, region, sourceName, season, notes, mode } = req.body;

    const numPh = Number(ph) || 7.0;
    const numTds = Number(tds) || 200;
    const source = sourceName || 'Household Tap';
    const currentSeason = season || 'Monsoon';
    const ai = getAIClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (ai) {
      try {
        const prompt = `Perform a comprehensive, scientifically rigorous water quality analysis for the following sample:
- Water Source: ${source}
- Source Category: ${region || 'general'}
- pH Level: ${numPh}
- Total Dissolved Solids (TDS): ${numTds} ppm
- Season: ${currentSeason}
- Mode context: ${mode === 'tech' ? 'Laboratory Technician (detailed chemical insight)' : 'Local Resident / Family (clear, actionable, 1-word verdicts)'}
- ${userNotes}

Analyze WHO potability standards, mineral balance (Ca, Mg, Na, K, Hardness), scaling vs corrosive tendency, health safety for sensitive groups (infants, elderly), and household appliance impact. Keep local resident wording direct, punchy, and avoid unnecessary jargon while providing accurate scientific data.`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are a senior environmental water quality specialist and public health advisor. You provide precise, trustworthy, and actionable water safety diagnoses with 1-word verdicts for everyday household tasks and practical filtration recommendations.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: {
                  type: Type.STRING,
                  description: 'Short 2-5 word glanceable headline like "Safe & Mineral Balanced" or "High Mineral Hardness"',
                },
                oneWordVerdict: {
                  type: Type.STRING,
                  description: 'Single word summary: "Safe" | "Boil" | "Filter" | "Unsafe"',
                },
                purityScore: {
                  type: Type.INTEGER,
                  description: 'Purity index from 0 to 100',
                },
                drinkingSuitability: {
                  type: Type.STRING,
                  description: 'Single word: "Safe" | "Boil" | "Filter" | "Unsafe"',
                },
                cookingSuitability: {
                  type: Type.STRING,
                  description: 'Single word: "Safe" | "Boil" | "Caution"',
                },
                babyFoodSuitability: {
                  type: Type.STRING,
                  description: 'Single word: "Safe" | "Caution" | "Avoid"',
                },
                skinBathSuitability: {
                  type: Type.STRING,
                  description: 'Single word: "Gentle" | "Hard" | "Drying"',
                },
                plantsSuitability: {
                  type: Type.STRING,
                  description: 'Single word: "Good" | "Moderate" | "Saline"',
                },
                appliancesSuitability: {
                  type: Type.STRING,
                  description: 'Single word: "Clean" | "Scale" | "Corrosive"',
                },
                quickActionAdvice: {
                  type: Type.STRING,
                  description: 'One crisp direct sentence on what the family or user should do right now.',
                },
                filtrationRecommended: {
                  type: Type.STRING,
                  description: 'Specific filter type needed, e.g. "Sediment + Carbon", "RO Purifier", "Boiling Only", or "None Needed"',
                },
                mineralInsight: {
                  type: Type.STRING,
                  description: '1-2 concise sentences on calcium, magnesium, and salt profile.',
                },
                seasonalImpact: {
                  type: Type.STRING,
                  description: '1 concise sentence explaining seasonal contamination or mineral shifts.',
                },
                scientificSummary: {
                  type: Type.STRING,
                  description: 'Technical evaluation of ion balance, LSI/saturation index, and WHO compliance.',
                },
                keyRisks: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 2-3 specific risks if consumed untreated (or "None identified").',
                },
              },
              required: [
                'headline',
                'oneWordVerdict',
                'purityScore',
                'drinkingSuitability',
                'cookingSuitability',
                'babyFoodSuitability',
                'skinBathSuitability',
                'plantsSuitability',
                'appliancesSuitability',
                'quickActionAdvice',
                'filtrationRecommended',
                'mineralInsight',
                'seasonalImpact',
                'scientificSummary',
                'keyRisks',
              ],
            },
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return res.json({
            success: true,
            source: modelName,
            data: parsed,
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini AI temporary error, switching to fallback:', geminiError?.message || geminiError);
      }
    }

    // Fallback algorithmic analysis if Gemini is unreachable or offline
    const isPhSafe = numPh >= 6.5 && numPh <= 8.5;
    const isTdsSafe = numTds < 500;
    const score = Math.max(
      15,
      Math.min(
        100,
        Math.round(100 - (numTds / 500) * 15 - Math.abs(numPh - 7.2) * 8)
      )
    );

    let oneWordVerdict = 'Safe';
    if (!isPhSafe || numTds >= 1000) {
      oneWordVerdict = 'Unsafe';
    } else if (numTds >= 500 || numPh < 6.8 || numPh > 8.2) {
      oneWordVerdict = 'Filter';
    }

    return res.json({
      success: true,
      source: 'algorithmic-fallback',
      data: {
        headline: isPhSafe && isTdsSafe ? 'WHO Compliant Water' : numTds < 1000 ? 'Moderate Minerals - Filter Advised' : 'High Dissolved Solids',
        oneWordVerdict,
        purityScore: score,
        drinkingSuitability: oneWordVerdict,
        cookingSuitability: numTds < 600 ? 'Safe' : 'Boil',
        babyFoodSuitability: numTds <= 200 ? 'Safe' : numTds <= 400 ? 'Caution' : 'Avoid',
        skinBathSuitability: numTds < 300 ? 'Gentle' : 'Hard',
        plantsSuitability: numTds < 700 ? 'Good' : 'Saline',
        appliancesSuitability: numTds < 250 ? 'Clean' : 'Scale',
        quickActionAdvice: numTds > 500 ? 'Use multi-stage or RO filtration before drinking.' : 'Water is within safe drinking limits.',
        filtrationRecommended: numTds > 800 ? 'RO Membrane' : numTds > 300 ? 'Sediment + Activated Carbon' : 'None Needed',
        mineralInsight: `TDS of ${numTds} ppm reflects dissolved carbonates and salts. pH of ${numPh} is ${numPh < 7 ? 'slightly acidic' : 'balanced'}.`,
        seasonalImpact: `${currentSeason} conditions may introduce surface runoff silt or seasonal mineral variations.`,
        scientificSummary: `pH=${numPh}, TDS=${numTds} ppm. Meets standard domestic thresholds, secondary aesthetic parameters monitored.`,
        keyRisks: numTds > 1000 ? ['High mineral load', 'Gastrointestinal discomfort', 'Appliance scaling'] : ['None identified'],
      },
    });
  } catch (error: any) {
    console.error('AI Analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete AI water analysis',
    });
  }
});

/**
 * Real AI Water Advisor Q&A Endpoint
 * POST /api/ai-chat
 */
app.post('/api/ai-chat', async (req: Request, res: Response) => {
  try {
    const { question, currentWater } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const waterContext = currentWater
      ? `Current tested sample: ${currentWater.sourceName || 'Sample'} with TDS=${currentWater.tds} ppm, pH=${currentWater.ph}, Season=${currentWater.season || 'Regular'}`
      : 'No specific water sample attached.';

    const ai = getAIClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Water Sample Context: ${waterContext}
User Question: "${question}"

Please provide a concise, direct, and actionable answer for a household user or local resident.
Keep it friendly, scientifically grounded in WHO standards, and under 3 short paragraphs. Highlight immediate safety tips (e.g., whether boiling helps, what filter is required, or baby safety).`,
          config: {
            systemInstruction:
              'You are AquaAI, the friendly expert water safety advisor for the Smart Water Quality System. You give clear, practical advice about tap water, borewell water, RO purifiers, and water testing.',
          },
        });

        const reply = response.text || 'Unable to generate response at this time.';
        return res.json({
          success: true,
          answer: reply,
        });
      } catch (geminiError: any) {
        console.warn('Gemini AI temporary error in chat, using domain fallback:', geminiError?.message || geminiError);
      }
    }

    // Fallback response if AI is not configured
    return res.json({
      success: true,
      answer: `Based on your water test (${currentWater?.tds || 200} ppm TDS, pH ${currentWater?.ph || 7.2}): Water with TDS under 500 ppm is generally safe for household use. If boiling water, note that boiling kills bacteria and microbes, but does NOT reduce TDS or dissolved mineral salts—an RO filter is required to reduce TDS.`,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI advice',
    });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Water Quality Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
