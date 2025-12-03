import React, { useState } from 'react';
import { 
  ShieldAlert, CheckCircle, AlertTriangle, Info, Play, Loader2, 
  BarChart2, BookOpen, Layers, Zap, User, Search, FileText, Globe, Wand2
} from 'lucide-react';
import { EthicsReport, DeepAnalysisReport, ProofreadItem, PlagiarismResult } from '../types';
import { runEthicsAudit, runDeepAnalysis, runProofread, checkPlagiarism, fixPlagiarism } from '../services/geminiService';

interface EthicsPanelProps {
  content: string;
  title: string;
  format: string;
  onUpdate: (content: string) => void;
}

type Tab = 'ethics' | 'analysis' | 'proofing';

export const EthicsPanel: React.FC<EthicsPanelProps> = ({ content, title, format, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('ethics');
  
  // State for Ethics
  const [ethicsReport, setEthicsReport] = useState<EthicsReport | null>(null);
  const [loadingEthics, setLoadingEthics] = useState(false);

  // State for Analysis
  const [analysisReport, setAnalysisReport] = useState<DeepAnalysisReport | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // State for Proofing
  const [proofItems, setProofItems] = useState<ProofreadItem[] | null>(null);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [isFixingPlagiarism, setIsFixingPlagiarism] = useState(false);

  // --- Handlers ---

  const handleAudit = async () => {
    if (!content.trim()) return;
    setLoadingEthics(true);
    try {
      const result = await runEthicsAudit(content, title, format);
      setEthicsReport(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingEthics(false);
    }
  };

  const handleDeepAnalysis = async (type: 'plot' | 'pacing' | 'character' | 'style') => {
    if (!content.trim()) return;
    setLoadingAnalysis(true);
    setAnalysisReport(null);
    try {
      const result = await runDeepAnalysis(content, type, format);
      setAnalysisReport(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleProofread = async () => {
    if (!content.trim()) return;
    setLoadingProof(true);
    setPlagiarismResult(null); // Clear previous plagiarism
    try {
      const result = await runProofread(content);
      setProofItems(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProof(false);
    }
  };

  const handlePlagiarismCheck = async () => {
    if (!content.trim()) return;
    setLoadingProof(true);
    setProofItems(null); // Clear proof items
    try {
      const result = await checkPlagiarism(content);
      setPlagiarismResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProof(false);
    }
  };

  const handleFixPlagiarism = async () => {
    if (!content.trim() || !plagiarismResult) return;
    setIsFixingPlagiarism(true);
    try {
      const fixedContent = await fixPlagiarism(content, plagiarismResult);
      onUpdate(fixedContent);
      setPlagiarismResult(null); // Clear result after fix
    } catch (error) {
      console.error(error);
    } finally {
      setIsFixingPlagiarism(false);
    }
  };

  // --- Render Helpers ---

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-500';
    return 'text-red-600';
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 w-full md:w-96 shadow-lg absolute right-0 top-0 bottom-0 z-10">
      
      {/* Tab Header */}
      <div className="flex border-b border-gray-200 bg-slate-50">
         <button 
           onClick={() => setActiveTab('ethics')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'ethics' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-800'}`}
         >
           Ethics Committee
         </button>
         <button 
           onClick={() => setActiveTab('analysis')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'analysis' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-800'}`}
         >
           Editorial Board
         </button>
         <button 
           onClick={() => setActiveTab('proofing')}
           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'proofing' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-800'}`}
         >
           Copy Desk
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* === ETHICS TAB === */}
        {activeTab === 'ethics' && (
          <>
            <div className="text-center mb-4">
              <h2 className="font-bold text-slate-800 flex items-center justify-center gap-2 mb-1">
                <ShieldAlert size={20} className="text-slate-600" />
                Ethics Committee
              </h2>
              <p className="text-xs text-gray-500">Checking for Truthfulness, Independence, & Source Protection</p>
            </div>

            {!ethicsReport && !loadingEthics && (
              <div className="text-center py-8">
                <button
                  onClick={handleAudit}
                  disabled={!content.trim()}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" />
                  Run Compliance Audit
                </button>
              </div>
            )}

            {loadingEthics && (
              <div className="flex flex-col items-center py-10 text-gray-500">
                <Loader2 className="animate-spin mb-3 text-indigo-600" size={24} />
                <p className="text-xs font-medium">Reviewing against ethical guidelines...</p>
              </div>
            )}

            {ethicsReport && !loadingEthics && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-end mb-4 pb-4 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-600">Compliance Score</span>
                  <span className={`text-3xl font-black ${getScoreColor(ethicsReport.score)}`}>{ethicsReport.score}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6">
                   <p className="text-sm text-slate-700 leading-relaxed">{ethicsReport.summary}</p>
                </div>

                <div className="space-y-4">
                  {ethicsReport.issues.map((issue, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-sm ${getSeverityColor(issue.severity)}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold capitalize text-xs opacity-80">{issue.type}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{issue.severity}</span>
                      </div>
                      <p className="font-medium mb-2">"{issue.text}"</p>
                      <div className="flex gap-2 items-start mt-2 pt-2 border-t border-black/5">
                        <Info size={14} className="mt-0.5 shrink-0" />
                        <p className="opacity-90 italic text-xs">{issue.suggestion}</p>
                      </div>
                    </div>
                  ))}
                  {ethicsReport.issues.length === 0 && (
                     <p className="text-sm text-gray-500 italic text-center">No ethical violations detected.</p>
                  )}
                </div>

                <button onClick={handleAudit} className="w-full mt-6 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
                  Re-run Audit
                </button>
              </div>
            )}
          </>
        )}

        {/* === ANALYSIS TAB === */}
        {activeTab === 'analysis' && (
          <>
             <div className="grid grid-cols-2 gap-2 mb-6">
                <button onClick={() => handleDeepAnalysis('plot')} className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                  <Layers size={20} className="text-indigo-600" />
                  <span className="text-xs font-bold text-gray-700">Plot & Arc</span>
                </button>
                <button onClick={() => handleDeepAnalysis('pacing')} className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                  <Zap size={20} className="text-amber-500" />
                  <span className="text-xs font-bold text-gray-700">Pacing</span>
                </button>
                <button onClick={() => handleDeepAnalysis('character')} className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                  <User size={20} className="text-rose-500" />
                  <span className="text-xs font-bold text-gray-700">Characters</span>
                </button>
                <button onClick={() => handleDeepAnalysis('style')} className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                  <BookOpen size={20} className="text-emerald-500" />
                  <span className="text-xs font-bold text-gray-700">Style/Voice</span>
                </button>
             </div>

             {loadingAnalysis && (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <Loader2 className="animate-spin mb-3 text-indigo-600" size={24} />
                  <p className="text-xs font-medium">Deep reading in progress...</p>
                </div>
             )}

             {analysisReport && !loadingAnalysis && (
                <div className="animate-in fade-in slide-in-from-right-2">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 capitalize">{analysisReport.type} Report</h3>
                      <span className="font-bold text-indigo-600">{analysisReport.score}/100</span>
                   </div>
                   <div className="text-sm text-gray-700 leading-relaxed mb-6 bg-gray-50 p-3 rounded border border-gray-100">
                      {analysisReport.analysis}
                   </div>
                   
                   <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase text-green-600 mb-2 flex items-center gap-1"><CheckCircle size={12}/> Strengths</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {analysisReport.strengths.map((s, i) => <li key={i} className="text-xs text-gray-600">{s}</li>)}
                      </ul>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold uppercase text-orange-500 mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Needs Improvement</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {analysisReport.weaknesses.map((w, i) => <li key={i} className="text-xs text-gray-600">{w}</li>)}
                      </ul>
                   </div>
                </div>
             )}
          </>
        )}

        {/* === PROOFING TAB === */}
        {activeTab === 'proofing' && (
          <>
             <div className="flex flex-col gap-3 mb-6">
                <button 
                  onClick={handleProofread}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                     <FileText size={18} className="text-blue-600" />
                     <div className="text-left">
                        <div className="text-sm font-bold text-gray-700">Copy Edit</div>
                        <div className="text-xs text-gray-400">Grammar, spelling, passive voice</div>
                     </div>
                  </div>
                  <Play size={14} className="text-gray-400" />
                </button>

                <button 
                  onClick={handlePlagiarismCheck}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                     <Globe size={18} className="text-purple-600" />
                     <div className="text-left">
                        <div className="text-sm font-bold text-gray-700">Plagiarism Scan</div>
                        <div className="text-xs text-gray-400">Search grounding check</div>
                     </div>
                  </div>
                  <Search size={14} className="text-gray-400" />
                </button>
             </div>

             {loadingProof && (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <Loader2 className="animate-spin mb-3 text-indigo-600" size={24} />
                  <p className="text-xs font-medium">Scanning document...</p>
                </div>
             )}

             {/* Proofreading Results */}
             {proofItems && !loadingProof && (
                <div className="space-y-4 animate-in fade-in">
                   <h3 className="font-bold text-sm text-gray-800 border-b pb-2">Proofreading Results ({proofItems.length})</h3>
                   {proofItems.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No errors found. Great job!</p>
                   ) : (
                      proofItems.map((item, idx) => (
                         <div key={idx} className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                            <div className="flex justify-between mb-1">
                               <span className="text-xs font-bold uppercase text-red-500 bg-red-100 px-1.5 py-0.5 rounded">{item.type}</span>
                            </div>
                            <div className="text-sm text-gray-800 line-through decoration-red-400 mb-1 opacity-70">
                               {item.original}
                            </div>
                            <div className="text-sm font-medium text-green-700 flex items-center gap-1 mb-1">
                               <CheckCircle size={12} /> {item.suggestion}
                            </div>
                            <p className="text-xs text-gray-500 italic">{item.reason}</p>
                         </div>
                      ))
                   )}
                </div>
             )}

             {/* Plagiarism Results */}
             {plagiarismResult && !loadingProof && (
                <div className="animate-in fade-in">
                   <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 text-center shadow-sm">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Originality Score</div>
                      <div className={`text-4xl font-black ${getScoreColor(plagiarismResult.originalityScore)}`}>
                         {plagiarismResult.originalityScore}%
                      </div>
                   </div>

                   <p className="text-xs text-gray-600 italic mb-4 border-l-2 border-indigo-200 pl-3">
                      {plagiarismResult.analysis}
                   </p>

                   {plagiarismResult.sources.length > 0 && (
                      <div className="mb-4">
                         <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">Potential Sources Found</h4>
                         <ul className="space-y-2">
                            {plagiarismResult.sources.map((source, i) => (
                               <li key={i} className="text-xs bg-gray-50 p-2 rounded border border-gray-100 truncate">
                                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                                     <Globe size={10} /> {source.title || 'Unknown Source'}
                                  </a>
                                  <div className="text-gray-400 text-[10px] mt-0.5 truncate">{source.uri}</div>
                               </li>
                            ))}
                         </ul>
                      </div>
                   )}
                   
                   {/* Plagiarism Fix Button */}
                   {plagiarismResult.originalityScore < 100 && (
                     <button
                       onClick={handleFixPlagiarism}
                       disabled={isFixingPlagiarism}
                       className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                     >
                        {isFixingPlagiarism ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                        Auto-Fix: Paraphrase & Cite
                     </button>
                   )}
                </div>
             )}
          </>
        )}

      </div>
    </div>
  );
};