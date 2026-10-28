import React, { useState } from 'react';
import {
  Droplets,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Layers,
  ArrowRight,
  Info,
  Save,
  RotateCcw,
  Sparkles,
  Loader2,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { RegionType, WaterRecord, AIWaterAnalysis } from '../types';
import {
  analyzeWater,
  estimateMinerals,
  REGION_METADATA,
  WHO_LIMITS,
} from '../utils/waterAnalysis';
import { requestAIWaterAnalysis } from '../utils/aiService';

interface AnalyzeViewProps {
  onSaveRecord: (record: Omit<WaterRecord, 'id' | 'dateTime'>) => void;
  initialRegion?: RegionType;
}

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  onSaveRecord,
  initialRegion = 'groundwater',
}) => {
  const [ph, setPh] = useState<number>(7.4);
  const [tds, setTds] = useState<number>(280);
  const [region, setRegion] = useState<RegionType>(initialRegion);
  const [sampleNotes, setSampleNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real Gemini AI State (Loading, Success, Empty, Error)
  const [aiData, setAiData] = useState<AIWaterAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await requestAIWaterAnalysis({
        ph,
        tds,
        region,
        sourceName: `${REGION_METADATA[region].label} Station Sample`,
        notes: sampleNotes,
        mode: 'tech',
      });
      setAiData(result);
    } catch (err: any) {
      setAiError(err.message || 'Failed to complete AI chemical analysis.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Live calculation based on current inputs
  const quality = analyzeWater(ph, tds);
  const minerals = estimateMinerals(tds, region);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRecord({
      ph,
      tds,
      region,
      ca: minerals.ca,
      mg: minerals.mg,
      k: minerals.k,
      na: minerals.na,
      so4: minerals.so4,
      cl: minerals.cl,
      result: quality.headline,
      notes: sampleNotes.trim() || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const loadPreset = (presetPh: number, presetTds: number, presetRegion: RegionType, label: string) => {
    setPh(presetPh);
    setTds(presetTds);
    setRegion(presetRegion);
    setSampleNotes(`Preset: ${label}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Droplets className="w-6 h-6 text-[#1eaedb]" />
            Water Quality Testing & Mineral Analysis Lab
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Input sensor values or simulate water samples to evaluate WHO potability and calculate estimated regional mineral chemistry.
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1">Presets:</span>
          <button
            onClick={() => loadPreset(7.2, 190, 'groundwater', 'Fresh Mountain Spring')}
            className="text-xs bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium transition cursor-pointer"
          >
            Mountain Spring
          </button>
          <button
            onClick={() => loadPreset(7.5, 320, 'urban', 'City Tap Water')}
            className="text-xs bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium transition cursor-pointer"
          >
            Urban Tap
          </button>
          <button
            onClick={() => loadPreset(8.4, 780, 'industrial', 'Industrial Runoff')}
            className="text-xs bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium transition cursor-pointer"
          >
            Industrial Zone
          </button>
          <button
            onClick={() => loadPreset(8.1, 1150, 'coastal', 'Saline Coastal')}
            className="text-xs bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium transition cursor-pointer"
          >
            Coastal Borewell
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs (matching analyze.html) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <form onSubmit={handleSave} className="space-y-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Sample Parameters
            </h2>

            {/* pH Slider and Numeric Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>pH Level</span>
                  <span className="text-[10px] text-slate-400 font-normal">(WHO Safe: 6.5 – 8.5)</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={ph}
                    onChange={(e) => setPh(parseFloat(e.target.value) || 7.0)}
                    className="w-16 text-right px-2 py-1 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1eaedb]"
                  />
                  <span className="text-xs text-slate-500 font-semibold">pH</span>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1eaedb]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Acidic (3.0)</span>
                <span className="text-emerald-600 font-bold">Neutral (7.0)</span>
                <span>Alkaline (12.0)</span>
              </div>
            </div>

            {/* TDS Slider and Numeric Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>TDS Concentration</span>
                  <span className="text-[10px] text-slate-400 font-normal">(&lt; 500 ppm ideal)</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="3000"
                    step="5"
                    value={tds}
                    onChange={(e) => setTds(parseInt(e.target.value) || 0)}
                    className="w-20 text-right px-2 py-1 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#1eaedb]"
                  />
                  <span className="text-xs text-slate-500 font-semibold">ppm</span>
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="10"
                value={tds}
                onChange={(e) => setTds(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1eaedb]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span className="text-emerald-600 font-medium">Safe (&lt; 500)</span>
                <span className="text-amber-600 font-medium">Moderate (500-999)</span>
                <span className="text-rose-600 font-medium">Unsafe (&ge; 1000)</span>
              </div>
            </div>

            {/* Region / Source Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Region / Water Source Type
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionType)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb] cursor-pointer"
              >
                <option value="groundwater">Groundwater / Borewell Source</option>
                <option value="urban">Urban Tap / Municipal Distribution</option>
                <option value="industrial">Industrial Region / Factory Runoff</option>
                <option value="coastal">Coastal Area / Marine Infiltration</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {REGION_METADATA[region].description}
              </p>
            </div>

            {/* Sample Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sample Notes / Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Station 4B Tank Intake"
                value={sampleNotes}
                onChange={(e) => setSampleNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
              />
            </div>

            {/* Submit and reset buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 bg-[#1eaedb] hover:bg-[#189bb5] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save to History Log</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPh(7.0);
                  setTds(250);
                  setSampleNotes('');
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Reset values"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sample successfully recorded in permanent test history!</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Output: Analysis Result & Estimated Mineral Composition (matching result.html) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Quality Banner */}
          <div
            className={`rounded-2xl p-6 shadow-sm border transition-all ${
              quality.status === 'excellent'
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200'
                : quality.status === 'moderate'
                ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200'
                : 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {quality.status === 'excellent' && (
                    <span className="p-1 rounded-full bg-emerald-500 text-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                  {quality.status === 'moderate' && (
                    <span className="p-1 rounded-full bg-amber-500 text-white">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                  )}
                  {quality.status === 'poor' && (
                    <span className="p-1 rounded-full bg-rose-500 text-white">
                      <XCircle className="w-4 h-4" />
                    </span>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Analysis Result
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {quality.headline}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {quality.message}
                </p>
              </div>

              {/* Quality Score Badge */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-slate-200 text-center shrink-0">
                <span className="text-2xl font-black text-slate-800 block">
                  {quality.score}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Purity Index
                </span>
              </div>
            </div>

            {/* Quick parameter pills */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-2 text-xs font-medium">
              <span className="bg-white/80 px-2.5 py-1 rounded-lg text-slate-700">
                pH: <b>{ph}</b>
              </span>
              <span className="bg-white/80 px-2.5 py-1 rounded-lg text-slate-700">
                TDS: <b>{tds} ppm</b>
              </span>
              <span className="bg-white/80 px-2.5 py-1 rounded-lg text-slate-700">
                Region: <b>{REGION_METADATA[region].label}</b>
              </span>
            </div>
          </div>

          {/* Real Gemini AI Diagnostic Suite */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50/60 to-cyan-50 rounded-2xl p-5 border border-purple-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                    Real AI Chemical Diagnosis
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      Google Gemini AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-purple-700">
                    Comprehensive ion equilibrium, Langelier scaling tendency, and WHO guideline risk check
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running AI Analysis...</span>
                  </>
                ) : aiData ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-Run AI Model</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Diagnosis</span>
                  </>
                )}
              </button>
            </div>

            {/* Loading */}
            {isAiLoading && (
              <div className="bg-white/80 backdrop-blur-xs rounded-xl p-3.5 border border-purple-100 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
                <span className="text-xs font-semibold text-purple-900">
                  Gemini 3.8 Flash is modeling electrolyte dissociation, corrosion tendencies, and safe usage margins...
                </span>
              </div>
            )}

            {/* Error */}
            {aiError && !isAiLoading && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs text-rose-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{aiError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRunAiAnalysis}
                  className="font-bold underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Diagnostic Output */}
            {aiData && !isAiLoading && (
              <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    AI Verdict: {aiData.headline} ({aiData.oneWordVerdict})
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                    Purity: {aiData.purityScore}/100
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900 block mb-0.5">Scientific Evaluation:</span>
                    <p className="leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                      {aiData.scientificSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-[10px] font-extrabold uppercase text-emerald-800 block mb-0.5">
                        Recommended Treatment Stage
                      </span>
                      <span className="font-bold text-slate-800">
                        {aiData.filtrationRecommended}
                      </span>
                    </div>

                    <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-100">
                      <span className="text-[10px] font-extrabold uppercase text-amber-800 block mb-0.5">
                        Identified Risks
                      </span>
                      <span className="font-bold text-slate-800">
                        {aiData.keyRisks && aiData.keyRisks.length > 0
                          ? aiData.keyRisks.join(', ')
                          : 'None identified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!aiData && !isAiLoading && !aiError && (
              <div className="bg-white/60 rounded-xl p-3 text-center border border-purple-100/60">
                <span className="text-xs font-medium text-purple-900">
                  Click <b>"Run AI Diagnosis"</b> to evaluate sample against WHO parameters and ion balance using Gemini.
                </span>
              </div>
            )}
          </div>

          {/* Estimated Mineral Composition Cards (matching result.html) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Estimated Mineral Composition ({REGION_METADATA[region].label})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated based on regional chemical factors and total dissolved solids
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#1eaedb] bg-cyan-50 px-2.5 py-1 rounded-lg">
                WHO Standard Modeled
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Calcium */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Calcium (Ca)</span>
                  <span className="text-[10px] text-slate-400">max 200</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {minerals.ca} <span className="text-xs font-normal text-slate-500">mg/L</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#06d6a0] h-full rounded-full"
                    style={{ width: `${Math.min(100, (minerals.ca / 200) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Magnesium */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Magnesium (Mg)</span>
                  <span className="text-[10px] text-slate-400">max 100</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {minerals.mg} <span className="text-xs font-normal text-slate-500">mg/L</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#ffd166] h-full rounded-full"
                    style={{ width: `${Math.min(100, (minerals.mg / 100) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Sodium */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Sodium (Na)</span>
                  <span className="text-[10px] text-slate-400">max 200</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {minerals.na} <span className="text-xs font-normal text-slate-500">mg/L</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#118ab2] h-full rounded-full"
                    style={{ width: `${Math.min(100, (minerals.na / 200) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Potassium */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Potassium (K)</span>
                  <span className="text-[10px] text-slate-400">max 12</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {minerals.k} <span className="text-xs font-normal text-slate-500">mg/L</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#8338ec] h-full rounded-full"
                    style={{ width: `${Math.min(100, (minerals.k / 12) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Sulphate */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Sulphate (SO₄)</span>
                  <span className="text-[10px] text-slate-400">max 250</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {minerals.so4} <span className="text-xs font-normal text-slate-500">mg/L</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#ff6700] h-full rounded-full"
                    style={{ width: `${Math.min(100, (minerals.so4 / 250) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Chloride */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Chloride (Cl)</span>
                  <span className="text-[10px] text-slate-400">max 250</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {minerals.cl} <span className="text-xs font-normal text-slate-500">mg/L</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#073b4c] h-full rounded-full"
                    style={{ width: `${Math.min(100, (minerals.cl / 250) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 italic">
              *Estimates based on regional water chemistry models; actual values may vary depending on local pipe conditions and seasonal rainfall.*
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
