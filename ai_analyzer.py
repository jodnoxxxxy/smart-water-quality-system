"""
AI Water Diagnostic & Environmental Intelligence Engine
Decoupled service for real AI water potability analysis using Google Gemini.
Adheres to AI_CODING_RULES.md (Rule 5, 8, 9, 11, 15).
"""
import os
import json
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()

def get_gemini_client():
    """Initializes and returns the Google GenAI client if GEMINI_API_KEY is configured."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or "your_gemini_api_key_here" in api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"[AI Analyzer] Warning: Could not initialize Google GenAI client: {e}")
        return None


def algorithmic_fallback(ph: float, tds: float, region: str, season: str = "Normal") -> dict:
    """
    Deterministic WHO-standard fallback if Gemini API is offline or key is not provided.
    Maintains schema parity with real Gemini output.
    """
    is_ph_safe = 6.5 <= ph <= 8.5
    is_tds_safe = tds < 500

    # Calculate purity score (0 - 100)
    score = max(15, min(100, round(100 - (tds / 500.0) * 15 - abs(ph - 7.2) * 8)))

    if not is_ph_safe or tds >= 1000:
        verdict = "Unsafe"
        headline = "High Contaminant / Mineral Load"
    elif tds >= 500 or ph < 6.8 or ph > 8.2:
        verdict = "Filter"
        headline = "Moderate Minerals - Filtration Advised"
    else:
        verdict = "Safe"
        headline = "WHO Compliant Water"

    # Suitability ratings
    drinking = verdict
    cooking = "Safe" if tds < 600 and is_ph_safe else "Boil"
    baby_food = "Safe" if tds <= 200 and is_ph_safe else ("Caution" if tds <= 400 else "Avoid")
    bathing = "Gentle" if tds < 300 else ("Hard" if tds < 800 else "Drying")
    appliances = "Clean" if tds < 250 else ("Scale Risk" if tds > 500 else "Moderate Scale")

    if tds > 800:
        filtration = "RO Purifier (Reverse Osmosis)"
        advice = "Water contains elevated mineral salts. Use multi-stage RO filtration before direct consumption."
        risks = ["High mineral load", "Potential gastrointestinal sensitivity", "Heavy plumbing scaling"]
    elif tds > 400 or not is_ph_safe:
        filtration = "Activated Carbon + Sediment Filter"
        advice = "Filtration recommended to soften mineral hardness and balance pH."
        risks = ["Moderate hardness", "Mineral scale in kettles/heaters"]
    else:
        filtration = "None Needed (Direct Tap Safe)"
        advice = "Water conforms to standard drinking baselines. Safe for daily household consumption."
        risks = ["None identified under standard parameters"]

    ph_desc = "neutral" if 6.9 <= ph <= 7.5 else ("slightly acidic" if ph < 6.9 else "alkaline")

    return {
        "headline": headline,
        "verdict": verdict,
        "purity_score": score,
        "suitability": {
            "drinking": drinking,
            "cooking": cooking,
            "baby_food": baby_food,
            "bathing": bathing,
            "appliances": appliances,
        },
        "health_advice": advice,
        "filtration_recommended": filtration,
        "mineral_insight": f"TDS of {tds} ppm indicates dissolved ions and carbonates. pH is {ph} ({ph_desc}).",
        "scientific_summary": f"Sample evaluated against WHO domestic standards: pH={ph}, TDS={tds} ppm in {region} context.",
        "key_risks": risks,
        "source_engine": "Algorithmic Expert System (Add GEMINI_API_KEY in .env to enable Gemini AI)",
        "is_ai": False,
    }


def analyze_water_with_ai(
    ph: float,
    tds: float,
    region: str = "groundwater",
    source_name: str = "Household Water",
    season: str = "Normal",
    notes: str = ""
) -> dict:
    """
    Performs real AI water quality analysis using Google Gemini.
    Falls back gracefully if the API key is not configured or network error occurs.
    """
    client = get_gemini_client()
    if not client:
        return algorithmic_fallback(ph, tds, region, season)

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    prompt = f"""Perform an expert, scientifically rigorous water quality analysis for the following sample:
- Water Source: {source_name}
- Region / Category: {region}
- pH Level: {ph}
- Total Dissolved Solids (TDS): {tds} ppm
- Season: {season}
{f"- User Notes: {notes}" if notes else ""}

Evaluate compliance with World Health Organization (WHO) potability guidelines, estimated mineral balance (calcium, magnesium, sodium, potassium), scaling vs corrosiveness, and safety for household uses (drinking, cooking, infant formula, bathing, appliances).

Respond with ONLY valid JSON adhering strictly to this schema:
{{
  "headline": "Short 2-5 word summary headline",
  "verdict": "Safe" | "Boil" | "Filter" | "Unsafe",
  "purity_score": integer between 0 and 100,
  "suitability": {{
    "drinking": "Safe" | "Boil" | "Filter" | "Unsafe",
    "cooking": "Safe" | "Boil" | "Caution",
    "baby_food": "Safe" | "Caution" | "Avoid",
    "bathing": "Gentle" | "Hard" | "Drying",
    "appliances": "Clean" | "Scale Risk" | "Corrosive"
  }},
  "health_advice": "One clear, direct sentence on immediate user safety and action.",
  "filtration_recommended": "Specific recommended filter (e.g. RO Purifier, Activated Carbon, Boiling Only, or None Needed)",
  "mineral_insight": "1-2 concise sentences on mineral hardness, salts, and ion balance.",
  "scientific_summary": "1-2 sentences with technical evaluation against WHO limits.",
  "key_risks": ["Risk 1", "Risk 2"]
}}"""

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "system_instruction": (
                    "You are a senior environmental water quality specialist and public health advisor. "
                    "You provide precise, scientifically grounded, and actionable water safety diagnoses with 1-word verdicts for everyday household tasks."
                ),
            },
        )

        raw_text = response.text
        if raw_text:
            data = json.loads(raw_text)
            data["source_engine"] = f"Google Gemini AI ({model_name})"
            data["is_ai"] = True
            return data
    except Exception as e:
        print(f"[AI Analyzer] Gemini API error ({e}), falling back to expert algorithmic diagnostic.")

    # Graceful fallback if Gemini encountered an error
    return algorithmic_fallback(ph, tds, region, season)
