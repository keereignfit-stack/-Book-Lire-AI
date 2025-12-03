import React, { useState } from 'react';
import { 
  Search, Globe, ShoppingCart, Video, BookOpen, Target, Crosshair, 
  MapPin, Loader2, ArrowRight, TrendingUp, Mic, Calendar, User, Zap, Store, ShoppingBag, PenTool
} from 'lucide-react';
import { ResearchAgentType, ResearchResult, CompetitorReport, BioTimelineEvent, InterviewGuide } from '../types';
import { runAgentResearch, generateCompetitorAnalysis, generateBiographyTimeline, generateInterviewQuestions, generateBiographyNarrative } from '../services/geminiService';

export const ResearchCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agents' | 'warroom' | 'biographer'>('agents');

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">
      {/* Sidebar Menu */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10">
         <div className="p-6 pb-2">
            <h2 className="text-xl font-serif font-bold text-slate-900">Research Hub</h2>
            <p className="text-xs text-gray-500 mt-1">Data-driven strategy center</p>
         </div>
         <nav className="flex-1 p-4 space-y-1">
           <button 
             onClick={() => setActiveTab('agents')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
               activeTab === 'agents' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
             }`}
           >
             <Globe size={18} />
             <span>Market Agents</span>
           </button>
           <button 
             onClick={() => setActiveTab('warroom')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
               activeTab === 'warroom' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'
             }`}
           >
             <Target size={18} />
             <span>War Room</span>
           </button>
           <button 
             onClick={() => setActiveTab('biographer')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
               activeTab === 'biographer' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50'
             }`}
           >
             <User size={18} />
             <span>Biographer's Studio</span>
           </button>
         </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'agents' && <AgentResearchPanel />}
        {activeTab === 'warroom' && <WarRoomPanel />}
        {activeTab === 'biographer' && <BiographerPanel />}
      </div>
    </div>
  );
};

// --- AGENTS PANEL ---

const AgentResearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<ResearchAgentType>(ResearchAgentType.GOOGLE);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const agents = [
    { type: ResearchAgentType.GOOGLE, icon: Search, color: 'bg-blue-100 text-blue-700' },
    { type: ResearchAgentType.AMAZON, icon: ShoppingCart, color: 'bg-orange-100 text-orange-700' },
    { type: ResearchAgentType.PERPLEXITY, icon: BookOpen, color: 'bg-teal-100 text-teal-700' },
    { type: ResearchAgentType.YOUTUBE, icon: Video, color: 'bg-red-100 text-red-700' },
    { type: ResearchAgentType.GOOGLE_NEWS, icon: Globe, color: 'bg-indigo-100 text-indigo-700' },
    { type: ResearchAgentType.WALMART, icon: Store, color: 'bg-yellow-100 text-yellow-700' },
    { type: ResearchAgentType.SHOPIFY, icon: ShoppingBag, color: 'bg-green-100 text-green-700' },
  ];

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await runAgentResearch(query, selectedAgent);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
       <div className="mb-8 text-center">
         <h1 className="text-3xl font-bold text-slate-800 mb-2">Multi-Source Intelligence</h1>
         <p className="text-gray-500">Deploy specialized agents to gather market data from specific ecosystems.</p>
       </div>

       {/* Agent Selection Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
         {agents.map((agent) => (
           <button
             key={agent.type}
             onClick={() => setSelectedAgent(agent.type)}
             className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border-2 ${
               selectedAgent === agent.type 
                 ? `border-slate-800 shadow-md transform scale-105` 
                 : 'border-transparent bg-white hover:bg-white/80'
             }`}
           >
             <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${agent.color}`}>
               <agent.icon size={18} />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600 text-center">{agent.type.split(' ')[0]}</span>
           </button>
         ))}
       </div>

       {/* Search Bar */}
       <form onSubmit={handleResearch} className="relative max-w-2xl mx-auto mb-12">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask ${selectedAgent} a question...`}
            className="w-full pl-6 pr-14 py-4 rounded-full shadow-lg border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 text-lg"
          />
          <button 
            type="submit" 
            disabled={loading || !query}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          </button>
       </form>

       {/* Results */}
       {result && (
         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase">{result.agent}</span>
              <h2 className="text-xl font-bold text-slate-800">Intelligence Report</h2>
            </div>
            
            <div className="prose prose-slate max-w-none mb-8">
              <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{result.summary}</p>
            </div>

            {result.sources.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Sources & References</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.sources.map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 text-xs text-indigo-600 hover:underline hover:border-indigo-300 truncate"
                    >
                      <Globe size={12} className="flex-shrink-0" />
                      <span className="truncate">{s.title || s.uri}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
         </div>
       )}
    </div>
  );
};

// --- WAR ROOM PANEL ---

const WarRoomPanel: React.FC = () => {
  const [target, setTarget] = useState('');
  const [genre, setGenre] = useState('');
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!target || !genre) return;
    setAnalyzing(true);
    setReport(null);
    try {
      const data = await generateCompetitorAnalysis(target, genre);
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-200 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-600 rounded-lg text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            <Crosshair size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">The War Room</h1>
            <p className="text-red-200 text-sm">Competitor Intelligence & Strategy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="md:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
             <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Rival (Book or Author)</label>
             <input 
               type="text" 
               value={target}
               onChange={(e) => setTarget(e.target.value)}
               placeholder="e.g. Stephen King, 'Atomic Habits'..."
               className="w-full bg-slate-900 border-slate-700 rounded-lg text-white focus:ring-red-500 focus:border-red-500"
             />
           </div>
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
             <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Market / Genre</label>
             <input 
               type="text" 
               value={genre}
               onChange={(e) => setGenre(e.target.value)}
               placeholder="e.g. Horror, Self-Help"
               className="w-full bg-slate-900 border-slate-700 rounded-lg text-white focus:ring-red-500 focus:border-red-500"
             />
           </div>
        </div>

        <button 
           onClick={handleAnalyze}
           disabled={analyzing || !target}
           className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl shadow-lg hover:shadow-red-900/50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest mb-12"
        >
           {analyzing ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
           Execute Tactical Analysis
        </button>

        {report && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                   <h3 className="text-red-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><TrendingUp size={16} /> Weaknesses Identified</h3>
                   <ul className="space-y-3">
                     {report.weaknesses.map((w, i) => (
                       <li key={i} className="flex gap-3 text-sm text-slate-300">
                         <span className="text-red-500 font-mono">0{i+1}.</span>
                         {w}
                       </li>
                     ))}
                   </ul>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                   <h3 className="text-green-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Target size={16} /> Market Gaps</h3>
                   <ul className="space-y-3">
                     {report.marketGaps.map((g, i) => (
                       <li key={i} className="flex gap-3 text-sm text-slate-300">
                         <span className="text-green-500 font-mono">0{i+1}.</span>
                         {g}
                       </li>
                     ))}
                   </ul>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 rounded-xl">
                 <h3 className="text-white font-bold text-xl mb-4">Strategic Override</h3>
                 <p className="text-slate-300 leading-relaxed mb-6">{report.strategy}</p>
                 
                 <div className="bg-black/30 rounded-lg p-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Tactical Maneuvers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {report.outmaneuverTactics.map((t, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-white">
                             <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                             {t}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Intelligence Sources */}
              {report.sources && report.sources.length > 0 && (
                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Intelligence Sources</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {report.sources.map((s, i) => (
                            <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 truncate">
                                <Globe size={12} /> {s.title}
                            </a>
                        ))}
                    </div>
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};

// --- BIOGRAPHER PANEL ---

const BiographerPanel: React.FC = () => {
  const [mode, setMode] = useState<'timeline' | 'interview' | 'narrative'>('timeline');
  const [subject, setSubject] = useState('');
  const [angle, setAngle] = useState('');
  
  // States for outputs
  const [timeline, setTimeline] = useState<BioTimelineEvent[]>([]);
  const [interview, setInterview] = useState<InterviewGuide | null>(null);
  
  // States for Narrative
  const [facts, setFacts] = useState('');
  const [narrative, setNarrative] = useState('');

  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === 'timeline') {
        if (!subject) return;
        const res = await generateBiographyTimeline(subject);
        setTimeline(res);
      } else if (mode === 'interview') {
        if (!subject) return;
        const res = await generateInterviewQuestions(subject, angle || 'General Life Story');
        setInterview(res);
      } else if (mode === 'narrative') {
        if (!facts) return;
        const res = await generateBiographyNarrative(facts, angle || 'Engaging and emotive');
        setNarrative(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
       <div className="text-center mb-10">
         <h1 className="text-3xl font-serif font-bold text-amber-900 mb-2">Biographer's Studio</h1>
         <p className="text-amber-700/60">Tools for preserving history and capturing voices.</p>
       </div>

       <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 mb-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            {mode !== 'narrative' && (
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Subject Name</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border-amber-200 rounded-lg bg-white focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g. Elon Musk, My Grandmother..."
                />
              </div>
            )}
            
            <div className="flex-1 w-full">
               <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Tool Mode</label>
               <div className="flex bg-white rounded-lg border border-amber-200 p-1">
                  <button 
                    onClick={() => setMode('timeline')}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${mode === 'timeline' ? 'bg-amber-100 text-amber-900' : 'text-gray-500'}`}
                  >
                    Timeline
                  </button>
                  <button 
                    onClick={() => setMode('interview')}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${mode === 'interview' ? 'bg-amber-100 text-amber-900' : 'text-gray-500'}`}
                  >
                    Interview
                  </button>
                  <button 
                    onClick={() => setMode('narrative')}
                    className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${mode === 'narrative' ? 'bg-amber-100 text-amber-900' : 'text-gray-500'}`}
                  >
                    Narrative
                  </button>
               </div>
            </div>
          </div>
          
          {mode === 'narrative' && (
             <div className="w-full">
               <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Raw Notes & Facts</label>
               <textarea 
                  value={facts}
                  onChange={(e) => setFacts(e.target.value)}
                  className="w-full h-32 border-amber-200 rounded-lg bg-white focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Paste dates, facts, and snippets here..."
               />
             </div>
          )}

          {/* Context/Angle Input (Used for Interview and Narrative) */}
          {(mode === 'interview' || mode === 'narrative') && (
            <div className="w-full">
               <label className="block text-xs font-bold text-amber-800 uppercase mb-1">
                 {mode === 'interview' ? 'Interview Angle / Theme' : 'Tone / Style'}
               </label>
               <input 
                 type="text" 
                 value={angle}
                 onChange={(e) => setAngle(e.target.value)}
                 className="w-full border-amber-200 rounded-lg bg-white focus:ring-amber-500 focus:border-amber-500"
                 placeholder={mode === 'interview' ? "e.g. Childhood Struggles" : "e.g. Reflective, Fast-paced, Nostalgic"}
               />
            </div>
          )}

          <button 
             onClick={handleGenerate}
             disabled={loading || (mode === 'narrative' ? !facts : !subject)}
             className="w-full py-3 bg-amber-900 text-white rounded-lg font-medium hover:bg-amber-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
             {loading ? <Loader2 className="animate-spin" /> : (mode === 'narrative' ? 'Weave Narrative' : 'Generate')}
          </button>
       </div>

       {/* RESULTS AREA */}

       {mode === 'timeline' && timeline.length > 0 && (
          <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
             {timeline.map((event, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8">
                   <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-amber-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Calendar size={16} />
                   </div>
                   <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <time className="font-caveat font-bold text-amber-600 mb-1 block">{event.date}</time>
                      <h3 className="font-bold text-slate-800 text-sm mb-2">{event.event}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed">{event.significance}</p>
                   </div>
                </div>
             ))}
          </div>
       )}

       {mode === 'interview' && interview && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 animate-in fade-in">
             <div className="mb-6 border-b border-gray-100 pb-4">
                <h3 className="font-serif font-bold text-2xl text-slate-900">Interview Guide: {interview.subject}</h3>
                <p className="text-amber-600 font-medium">Angle: {interview.angle}</p>
             </div>
             
             <div className="space-y-6">
                {interview.questions.map((q, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm">
                         {i + 1}
                      </div>
                      <div>
                         <div className="text-xs font-bold text-gray-400 uppercase mb-1">{q.phase}</div>
                         <p className="font-medium text-lg text-slate-800 mb-2">"{q.question}"</p>
                         <div className="flex items-center gap-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded inline-block">
                            <Mic size={12} />
                            Goal: {q.purpose}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       )}

       {mode === 'narrative' && narrative && (
         <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 animate-in fade-in">
           <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
             <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
               <PenTool size={20} />
             </div>
             <div>
               <h3 className="font-serif font-bold text-xl text-slate-900">Generated Narrative Draft</h3>
               <p className="text-xs text-gray-500">Transformed from {facts.split(' ').length} words of raw notes</p>
             </div>
           </div>
           <div className="prose prose-lg prose-amber max-w-none text-slate-700 leading-relaxed font-serif">
             {narrative.split('\n').map((para, i) => para ? <p key={i} className="mb-4">{para}</p> : null)}
           </div>
         </div>
       )}
    </div>
  );
};