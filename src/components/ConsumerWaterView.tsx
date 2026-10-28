import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  RotateCcw,
  Sparkles,
  Share2,
  Copy,
  Check,
  CloudRain,
  Sun,
  Snowflake,
  BellRing,
  Bot,
  Loader2,
  MessageSquare,
  Send,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { ConsumerWaterAnalysis, WaterRecord, AIWaterAnalysis, AIChatMessage } from '../types';
import { evaluateConsumerWater } from '../utils/userUsageAdvisor';
import { requestAIWaterAnalysis, askAquaAI } from '../utils/aiService';

interface ConsumerWaterViewProps {
  onSaveRecord: (record: Omit<WaterRecord, 'id' | 'dateTime'>) => void;
  onOpenTechPortal?: () => void;
  onReportDirtyWater?: (source: string, tds: number) => void;
}

const QUICK_SOURCES = [
  { id: 'tap', name: 'Kitchen Tap', icon: '🚰', tds: 180, ph: 7.4, tag: 'Municipal' },
  { id: 'ro', name: 'Home RO Filter', icon: '💧', tds: 45, ph: 6.8, tag: 'Purified' },
  { id: 'well', name: 'Borewell / Well', icon: '🏡', tds: 680, ph: 7.9, tag: 'Ground' },
  { id: 'bottle', name: '20L Water Can', icon: '🛢️', tds: 120, ph: 7.1, tag: 'Bottled' },
];

const SEASONS = [
  { id: 'monsoon', label: 'Monsoon', icon: '🌦️', advice: 'Boil', tip: 'Runoff silt' },
  { id: 'summer', label: 'Summer', icon: '☀️', advice: 'Filter', tip: 'Hard salts' },
  { id: 'winter', label: 'Winter', icon: '❄️', advice: 'Safe', tip: 'Stable water' },
];

export const ConsumerWaterView: React.FC<ConsumerWaterViewProps> = ({
  onSaveRecord,
  onOpenTechPortal,
  onReportDirtyWater,
}) => {
  const [tds, setTds] = useState<number>(180);
  const [ph, setPh] = useState<number>(7.4);
  const [activeSourceId, setActiveSourceId] = useState<string>('tap');
  const [sourceName, setSourceName] = useState<string>('Kitchen Tap');
  const [selectedSeason, setSelectedSeason] = useState<string>('monsoon');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [reported, setReported] = useState<boolean>(false);

  // Real AI Analysis State (Loading, Success, Empty, Error)
  const [aiData, setAiData] = useState<AIWaterAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI Q&A Drawer State
  const [showAiChat, setShowAiChat] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your AI Water Safety Assistant. Ask me anything about your water test results!',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isChatSending, setIsChatSending] = useState<boolean>(false);

  const analysis: ConsumerWaterAnalysis = evaluateConsumerWater(ph, tds);

  const handleSelectSource = (src: typeof QUICK_SOURCES[0]) => {
    setActiveSourceId(src.id);
    setTds(src.tds);
    setPh(src.ph);
    setSourceName(src.name);
    // Clear previous AI result so user can run fresh analysis
    setAiData(null);
    setAiError(null);
  };

  const handleRunAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await requestAIWaterAnalysis({
        ph,
        tds,
        region: tds < 250 ? 'urban' : tds < 700 ? 'groundwater' : 'industrial',
        sourceName,
        season: selectedSeason,
        mode: 'resident',
      });
      setAiData(result);
    } catch (err: any) {
      setAiError(err.message || 'Unable to connect to AI service. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || inputQuery.trim();
    if (!textToSend || isChatSending) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Now',
    };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setInputQuery('');
    setIsChatSending(true);

    try {
      const answer = await askAquaAI(textToSend, {
        tds,
        ph,
        sourceName,
        season: selectedSeason,
      });

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answer,
        timestamp: 'Now',
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: AIChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I had trouble answering that question. Please try again in a moment.',
        timestamp: 'Now',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleSave = () => {
    onSaveRecord({
      ph,
      tds,
      region: tds < 250 ? 'urban' : tds < 700 ? 'groundwater' : 'industrial',
      ca: Number((tds * 0.20).toFixed(2)),
      mg: Number((tds * 0.07).toFixed(2)),
      k: Number((tds * 0.03).toFixed(2)),
      na: Number((tds * 0.15).toFixed(2)),
      so4: Number((tds * 0.20).toFixed(2)),
      cl: Number((tds * 0.18).toFixed(2)),
      result: analysis.headline,
      notes: `Home: ${sourceName} (${analysis.overallScore}% Safe)`,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isSafe = analysis.overallSuitability === 'excellent' || analysis.overallSuitability === 'acceptable';
  const isCaution = analysis.overallSuitability === 'requires_treatment';
  const isDanger = analysis.overallSuitability === 'hazardous';

  const handleShare = () => {
    const text = `WaterSafe: ${sourceName} is ${isSafe ? 'SAFE' : isCaution ? 'BOIL FIRST' : 'UNSAFE'} (${tds} ppm TDS, pH ${ph}).`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = () => {
    if (onReportDirtyWater) {
      onReportDirtyWater(sourceName, tds);
    }
    setReported(true);
    setTimeout(() => setReported(false), 3000);
  };

  // Determine active display values (AI takes precedence if analyzed, else algorithmic)
  const displayScore = aiData ? aiData.purityScore : analysis.overallScore;
  const displayHeadline = aiData ? aiData.headline : isSafe ? 'Clean & Healthy' : isCaution ? 'Boil Before Drinking' : 'Filtration Needed';
  const displayVerdict = aiData ? aiData.oneWordVerdict : isSafe ? 'Safe' : isCaution ? 'Boil' : 'Unsafe';
  const displayFilter = aiData ? aiData.filtrationRecommended : analysis.purifierAdvice.recommendedTech;

  // 1-Word verdicts for the 6 everyday activities (using AI if available)
  const oneWordVerdicts = [
    {
      id: 'drinking',
      name: 'Drinking',
      icon: '🥛',
      word: aiData ? aiData.drinkingSuitability : isSafe ? 'Safe' : isCaution ? 'Boil' : 'Unsafe',
      color:
        (aiData?.drinkingSuitability === 'Safe' || (!aiData && isSafe))
          ? 'text-emerald-700 bg-emerald-50'
          : (aiData?.drinkingSuitability === 'Boil' || (!aiData && isCaution))
          ? 'text-amber-700 bg-amber-50'
          : 'text-rose-700 bg-rose-50',
    },
    {
      id: 'cooking',
      name: 'Cooking',
      icon: '🍲',
      word: aiData ? aiData.cookingSuitability : tds < 500 && ph >= 6.5 ? 'Safe' : 'Boil',
      color:
        (aiData?.cookingSuitability === 'Safe' || (!aiData && tds < 500))
          ? 'text-emerald-700 bg-emerald-50'
          : 'text-amber-700 bg-amber-50',
    },
    {
      id: 'baby',
      name: 'Baby Food',
      icon: '👶',
      word: aiData ? aiData.babyFoodSuitability : tds <= 200 ? 'Safe' : tds <= 350 ? 'Caution' : 'Avoid',
      color:
        (aiData?.babyFoodSuitability === 'Safe' || (!aiData && tds <= 200))
          ? 'text-emerald-700 bg-emerald-50'
          : (aiData?.babyFoodSuitability === 'Caution' || (!aiData && tds <= 350))
          ? 'text-amber-700 bg-amber-50'
          : 'text-rose-700 bg-rose-50',
    },
    {
      id: 'bathing',
      name: 'Skin & Hair',
      icon: '🚿',
      word: aiData ? aiData.skinBathSuitability : tds <= 350 ? 'Gentle' : tds <= 700 ? 'Hard' : 'Dry',
      color:
        (aiData?.skinBathSuitability === 'Gentle' || (!aiData && tds <= 350))
          ? 'text-emerald-700 bg-emerald-50'
          : 'text-amber-700 bg-amber-50',
    },
    {
      id: 'plants',
      name: 'Plants',
      icon: '🌿',
      word: aiData ? aiData.plantsSuitability : tds <= 350 ? 'Good' : tds <= 650 ? 'Fair' : 'Saline',
      color:
        (aiData?.plantsSuitability === 'Good' || (!aiData && tds <= 350))
          ? 'text-emerald-700 bg-emerald-50'
          : 'text-amber-700 bg-amber-50',
    },
    {
      id: 'appliances',
      name: 'Kettles & Irons',
      icon: '⚡',
      word: aiData ? aiData.appliancesSuitability : tds <= 250 ? 'Clean' : tds <= 500 ? 'Scale' : 'Hard',
      color:
        (aiData?.appliancesSuitability === 'Clean' || (!aiData && tds <= 250))
          ? 'text-emerald-700 bg-emerald-50'
          : 'text-amber-700 bg-amber-50',
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-8">
      {/* Top Header: Clean & Simple */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>💧</span>
            <span>Check My Water</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Instant check for your home and family.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiChat(!showAiChat)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              showAiChat
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask AquaAI</span>
          </button>

          {onOpenTechPortal && (
            <button
              onClick={onOpenTechPortal}
              className="text-xs text-slate-500 hover:text-[#1eaedb] font-bold bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              🔬 Lab Mode →
            </button>
          )}
        </div>
      </div>

      {/* 1. Quick Source Pick (1 Tap) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {QUICK_SOURCES.map((src) => {
          const isSelected = activeSourceId === src.id;
          return (
            <button
              key={src.id}
              onClick={() => handleSelectSource(src)}
              className={`p-3 rounded-2xl text-left transition-all border cursor-pointer flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-cyan-50 border-[#1eaedb] shadow-2xs ring-2 ring-[#1eaedb]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200/80'
              }`}
            >
              <span className="text-2xl">{src.icon}</span>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">{src.name}</span>
                <span className="text-[10px] text-slate-400 font-medium block">{src.tag}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Big Visual Verdict Card */}
      <div
        className={`rounded-3xl p-6 shadow-sm border transition-all ${
          displayVerdict === 'Safe'
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200'
            : displayVerdict === 'Boil' || displayVerdict === 'Filter'
            ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-200'
            : 'bg-gradient-to-br from-rose-50 to-red-50/50 border-rose-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  displayVerdict === 'Safe'
                    ? 'bg-emerald-600 text-white'
                    : displayVerdict === 'Boil' || displayVerdict === 'Filter'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {displayVerdict === 'Safe'
                  ? '✓ SAFE TO DRINK'
                  : displayVerdict === 'Boil'
                  ? '⚠️ BOIL BEFORE DRINKING'
                  : displayVerdict === 'Filter'
                  ? '⚠️ FILTER RECOMMENDED'
                  : '✕ DO NOT DRINK'}
              </span>

              {aiData && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>AI VERIFIED</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {displayHeadline}
            </h2>

            <p className="text-xs text-slate-600 font-semibold">
              Filter: <b className="text-cyan-800">{displayFilter}</b>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/95 rounded-2xl p-3.5 border border-slate-200 shadow-2xs text-center min-w-[90px]">
              <span className="text-3xl font-black text-slate-900 block leading-none">
                {displayScore}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">
                Purity
              </span>
            </div>

            <div className="bg-white/95 rounded-2xl p-3.5 border border-slate-200 shadow-2xs text-center min-w-[90px]">
              <span className="text-2xl font-black text-cyan-600 block leading-none">
                {tds}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">
                ppm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real AI Analysis Action Card (Module with Loading, Success, Error States) */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50 rounded-2xl p-4 sm:p-5 border border-purple-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                Real Gemini AI Analysis
                <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2 py-0.2 rounded-full font-bold">
                  Google Gemini AI
                </span>
              </h3>
              <p className="text-[11px] text-purple-700 font-medium">
                Deep health & household risk assessment directly from the AI model
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAiAnalysis}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Water...</span>
              </>
            ) : aiData ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Analyze with AI</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>

        {/* AI Loading State */}
        {isAiLoading && (
          <div className="bg-white/80 backdrop-blur-xs rounded-xl p-4 border border-purple-100 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
            <div>
              <span className="text-xs font-bold text-purple-950 block">
                Evaluating water chemistry with Gemini 3.8 Flash...
              </span>
              <span className="text-[11px] text-purple-700">
                Checking WHO drinking standards, infant formula suitability, scale risk, and seasonal runoff.
              </span>
            </div>
          </div>
        )}

        {/* AI Error State */}
        {aiError && !isAiLoading && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{aiError}</span>
            </div>
            <button
              onClick={handleRunAiAnalysis}
              className="text-xs font-bold text-rose-700 hover:underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* AI Success Result Box */}
        {aiData && !isAiLoading && (
          <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-purple-50/60 rounded-lg p-2.5 border border-purple-100/80">
                <span className="text-[10px] font-black uppercase text-purple-600 block mb-0.5">
                  Direct Action Advice
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {aiData.quickActionAdvice}
                </p>
              </div>

              <div className="bg-indigo-50/60 rounded-lg p-2.5 border border-indigo-100/80">
                <span className="text-[10px] font-black uppercase text-indigo-600 block mb-0.5">
                  Recommended Purifier
                </span>
                <p className="text-xs font-bold text-slate-800">
                  {aiData.filtrationRecommended}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <b className="text-slate-800">Minerals & Hardness:</b> {aiData.mineralInsight}
              </p>
              <p>
                <b className="text-slate-800">Seasonal Factor ({selectedSeason}):</b> {aiData.seasonalImpact}
              </p>
            </div>
          </div>
        )}

        {/* AI Empty State prompt */}
        {!aiData && !isAiLoading && !aiError && (
          <div className="bg-white/60 rounded-xl p-3 text-center border border-purple-100/60">
            <span className="text-xs font-medium text-purple-900">
              💡 Tap <b>"Analyze with AI"</b> above to get instant Gemini verification on this water sample.
            </span>
          </div>
        )}
      </div>

      {/* Interactive AI Chat Drawer */}
      {showAiChat && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                AquaAI Water Safety Chat
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">
              Sample: {sourceName} ({tds} ppm, pH {ph})
            </span>
          </div>

          {/* Quick preset questions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400">Quick Questions:</span>
            <button
              onClick={() => handleSendChatMessage('Is boiling this water enough to make it safe?')}
              className="text-[11px] bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
            >
              Is boiling enough?
            </button>
            <button
              onClick={() => handleSendChatMessage('Is this water safe for preparing baby formula?')}
              className="text-[11px] bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
            >
              Safe for baby?
            </button>
            <button
              onClick={() => handleSendChatMessage('Will this TDS level cause scale in my kettle or geyser?')}
              className="text-[11px] bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
            >
              Kettle scale risk?
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="max-h-56 overflow-y-auto space-y-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl max-w-[85%] ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-purple-600 text-white font-medium rounded-br-2xs'
                    : 'mr-auto bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-bl-2xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <span
                  className={`text-[9px] block text-right mt-1 ${
                    msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isChatSending && (
              <div className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl max-w-[85%] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                <span className="text-xs">AquaAI is typing...</span>
              </div>
            )}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your water quality..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isChatSending}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 3. Season Check Feature */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>🌦️</span>
          <span>Current Season Mode:</span>
        </span>

        <div className="flex items-center gap-2">
          {SEASONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeason(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedSeason === s.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  selectedSeason === s.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {s.advice}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. One-Word Everyday Checklist (Clean, Zero Long Text) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {oneWordVerdicts.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 text-center shadow-2xs hover:shadow-xs transition flex flex-col justify-between items-center"
          >
            <span className="text-2xl mb-1">{v.icon}</span>
            <span className="text-xs font-bold text-slate-800 block truncate">{v.name}</span>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full mt-2 block ${v.color}`}>
              {v.word}
            </span>
          </div>
        ))}
      </div>

      {/* 5. Sliders (Minimal, Easy) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-slate-700">TDS (Dissolved Salts): {tds} ppm</span>
          <span className="text-slate-400 font-medium">Safe: &lt; 300</span>
        </div>
        <input
          type="range"
          min="20"
          max="1200"
          step="10"
          value={tds}
          onChange={(e) => {
            setTds(parseInt(e.target.value) || 0);
            if (aiData) setAiData(null);
          }}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1eaedb]"
        />

        <div className="flex justify-between items-center text-xs font-bold pt-2">
          <span className="text-slate-700">pH Level: {ph.toFixed(1)} pH</span>
          <span className="text-slate-400 font-medium">Safe: 6.5 – 8.5</span>
        </div>
        <input
          type="range"
          min="4.5"
          max="10.0"
          step="0.1"
          value={ph}
          onChange={(e) => {
            setPh(parseFloat(e.target.value) || 7.0);
            if (aiData) setAiData(null);
          }}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1eaedb]"
        />
      </div>

      {/* 6. Action Buttons: Save, Share, Alert Neighbors */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Share Status'}</span>
          </button>

          <button
            onClick={handleReport}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>{reported ? 'Reported!' : 'Report Dirty Water'}</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-[#1eaedb] hover:bg-[#189bb5] text-white px-5 py-2 rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
        >
          {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? 'Saved to Cloud DB!' : 'Save Water Test'}</span>
        </button>
      </div>
    </div>
  );
};

