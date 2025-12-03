
import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, Wand2, RefreshCw, PanelRightOpen, PanelRightClose, 
  BrainCircuit, Globe, Scissors, Maximize2, Minimize2, 
  CheckCheck, Sparkles, Languages, MessageSquare, ShieldCheck, Play,
  FileDown, ChevronDown, Loader2, History, CalendarClock
} from 'lucide-react';
import { improveWriting, continueNarrative, translateText, enrichText } from '../services/geminiService';
import { EthicsPanel } from './EthicsPanel';
import { ChatAssistant } from './ChatAssistant';
import { ContentFormat, HistoryEntry } from '../types';

interface EditorProps {
  title: string;
  content: string;
  outline: string;
  format?: ContentFormat;
  history: HistoryEntry[];
  onUpdate: (title: string, content: string) => void;
  onLogHistory: (action: string, type: HistoryEntry['type'], details?: string) => void;
}

type PanelType = 'none' | 'outline' | 'ethics' | 'chat' | 'history';

const TARGET_LANGUAGES = [
  'Spanish', 'French', 'German', 'Japanese', 'Italian', 
  'Portuguese', 'Chinese (Simplified)', 'Russian', 'Arabic', 'Hindi'
];

export const Editor: React.FC<EditorProps> = ({ title, content, outline, format = ContentFormat.JOURNALISM, history, onUpdate, onLogHistory }) => {
  const [activePanel, setActivePanel] = useState<PanelType>('outline');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  
  // Translation State
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [targetLang, setTargetLang] = useState('Spanish');

  // Selection State
  const [selection, setSelection] = useState({ start: 0, end: 0, text: '' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelect = () => {
    const el = textareaRef.current;
    if (el) {
      setSelection({
        start: el.selectionStart,
        end: el.selectionEnd,
        text: el.value.substring(el.selectionStart, el.selectionEnd)
      });
    }
  };

  const updateText = (newText: string, start: number, end: number, replace: string) => {
    const updated = newText.substring(0, start) + replace + newText.substring(end);
    onUpdate(title, updated);
    // Clear selection
    setSelection({ start: 0, end: 0, text: '' });
  };

  const handleInlineAction = async (action: string) => {
    if (!selection.text) return;
    setIsAiProcessing(true);
    
    try {
      if (action === 'enrich') {
          const result = await enrichText(selection.text, useThinking);
          updateText(content, selection.start, selection.end, result);
          onLogHistory('Enriched Text', 'ai_assist', 'Added sensory details and emotional depth.');
      } else {
          let instruction = "";
          switch (action) {
            case 'rephrase': instruction = "Rephrase this text to be more clear, engaging, and stylistically improved."; break;
            case 'expand': instruction = "Expand this text with more vivid detail, deeper explanation, or character insight."; break;
            case 'shorten': instruction = "Shorten this text to be more concise while retaining key meaning."; break;
            case 'grammar': instruction = "Fix any grammar, spelling, or punctuation errors in this text."; break;
            default: instruction = action;
          }
          const improved = await improveWriting(selection.text, instruction, useThinking);
          updateText(content, selection.start, selection.end, improved);
          onLogHistory(`AI Edit: ${action}`, 'ai_assist', `Applied "${action}" to selection.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleTranslateSelection = async (lang: string) => {
    if (!selection.text) return;
    setIsAiProcessing(true);
    try {
      const translated = await translateText(selection.text, lang);
      updateText(content, selection.start, selection.end, translated);
      onLogHistory('Translated Selection', 'ai_assist', `Translated text chunk to ${lang}.`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleChapterTranslate = async () => {
    if (!content) return;
    setIsAiProcessing(true);
    try {
      const translated = await translateText(content, targetLang);
      onUpdate(title, translated);
      setShowTranslateMenu(false);
      onLogHistory('Full Chapter Translation', 'ai_assist', `Translated entire document to ${targetLang}.`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Merriweather', serif; padding: 40px; line-height: 1.6; color: #1a202c; max-width: 800px; margin: 0 auto; }
              h1 { font-family: 'Inter', sans-serif; font-size: 24pt; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
              p { margin-bottom: 16px; font-size: 12pt; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div>${content.split('\n').map(p => p ? `<p>${p}</p>` : '<br/>').join('')}</div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      onLogHistory('Exported PDF', 'system', 'Generated print-ready PDF.');
    }
    setShowTranslateMenu(false);
  };

  const handleContinueWriting = async () => {
    setIsAiProcessing(true);
    try {
      const continuation = await continueNarrative(content, format);
      if (continuation) {
        const newContent = content + (content.endsWith(' ') || content.endsWith('\n') ? '' : '\n\n') + continuation;
        onUpdate(title, newContent);
        onLogHistory('AI Continuation', 'ai_assist', 'Extended narrative flow.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? 'none' : panel);
  };

  // Helper to get relative time string
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex h-full gap-4 max-w-7xl mx-auto relative">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden h-full z-0 relative">
        
        {/* Contextual Toolbar */}
        <div className={`bg-indigo-50 border-b border-indigo-100 p-2 flex items-center gap-2 transition-all duration-200 overflow-x-auto ${selection.text ? 'h-12 opacity-100' : 'h-0 opacity-0 overflow-hidden py-0 border-0'}`}>
           <span className="text-xs font-bold text-indigo-800 uppercase px-2 whitespace-nowrap">Selected Text:</span>
           <button onClick={() => handleInlineAction('rephrase')} disabled={isAiProcessing} className="editor-tool-btn"><RefreshCw size={14} /> Rephrase</button>
           <button onClick={() => handleInlineAction('expand')} disabled={isAiProcessing} className="editor-tool-btn"><Maximize2 size={14} /> Expand</button>
           <button onClick={() => handleInlineAction('shorten')} disabled={isAiProcessing} className="editor-tool-btn"><Minimize2 size={14} /> Shorten</button>
           <button onClick={() => handleInlineAction('grammar')} disabled={isAiProcessing} className="editor-tool-btn"><CheckCheck size={14} /> Fix Grammar</button>
           <button onClick={() => handleInlineAction('enrich')} disabled={isAiProcessing} className="editor-tool-btn text-purple-700 bg-purple-50 border-purple-300 hover:bg-purple-100"><Sparkles size={14} /> Enrich Content</button>
           
           <div className="h-4 w-px bg-indigo-200 mx-1"></div>
           
           <div className="flex items-center gap-1">
              <Globe size={14} className="text-indigo-600" />
              <select 
                onChange={(e) => { if(e.target.value) handleTranslateSelection(e.target.value); e.target.value=''; }}
                className="text-xs bg-transparent border-none focus:ring-0 text-indigo-800 font-medium cursor-pointer"
              >
                <option value="">Translate Selection...</option>
                {TARGET_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
           </div>
        </div>

        {/* Standard Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
             <PenTool size={16} />
             <span className="font-medium hidden sm:inline">Drafting Mode</span>
          </div>
          
          <div className="flex items-center gap-2">
            
            {/* Multilingual & Export Menu */}
            <div className="relative">
               <button 
                  onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showTranslateMenu ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
               >
                  <Globe size={14} />
                  <span className="hidden sm:inline">Multilingual</span>
                  <ChevronDown size={12} />
               </button>

               {showTranslateMenu && (
                 <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-xl border border-gray-200 rounded-lg p-3 z-30 animate-in fade-in zoom-in-95">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Translation Hub</h3>
                    <div className="mb-3">
                       <label className="block text-xs font-medium text-gray-600 mb-1">Target Language</label>
                       <select 
                         value={targetLang}
                         onChange={(e) => setTargetLang(e.target.value)}
                         className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                       >
                          {TARGET_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                       </select>
                    </div>
                    
                    <button 
                       onClick={handleChapterTranslate}
                       disabled={isAiProcessing || !content}
                       className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded mb-1 flex items-center gap-2"
                    >
                       <Languages size={14} />
                       Translate Full Document
                    </button>

                    <div className="h-px bg-gray-100 my-2"></div>
                    
                    <button 
                       onClick={handleExportPDF}
                       className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded flex items-center gap-2"
                    >
                       <FileDown size={14} />
                       Export as PDF
                    </button>
                 </div>
               )}
            </div>

            <div className="h-5 w-px bg-gray-300 mx-1"></div>

            {/* Custom Instruction Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowAiInput(!showAiInput)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  showAiInput ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Wand2 size={14} />
                <span className="hidden sm:inline">Custom AI</span>
              </button>
              
              {showAiInput && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white shadow-xl border border-gray-200 rounded-lg p-3 z-30">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Custom Instruction</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'Rewrite the last paragraph to be more ominous'"
                    className="w-full text-sm border rounded p-2 mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <input 
                      type="checkbox" 
                      id="thinkingMode" 
                      checked={useThinking} 
                      onChange={(e) => setUseThinking(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="thinkingMode" className="text-xs text-gray-600 font-medium flex items-center gap-1 cursor-pointer">
                      <BrainCircuit size={12} className="text-purple-600" /> 
                      Thinking Mode
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2 border-t border-gray-100 pt-2">
                    <button 
                      onClick={() => setShowAiInput(false)}
                      className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => { handleInlineAction(aiPrompt); setShowAiInput(false); }}
                      disabled={isAiProcessing}
                      className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-gray-300 mx-1"></div>

            {/* Panel Toggles */}
            <div className="flex bg-gray-200 rounded-lg p-0.5">
               <button onClick={() => togglePanel('outline')} title="Outline" className={`panel-toggle ${activePanel === 'outline' ? 'active' : ''}`}>
                 <PanelRightOpen size={16} />
               </button>
               <button onClick={() => togglePanel('chat')} title="AI Chat" className={`panel-toggle ${activePanel === 'chat' ? 'active' : ''}`}>
                 <MessageSquare size={16} />
               </button>
               <button onClick={() => togglePanel('ethics')} title="Editorial Suite" className={`panel-toggle ${activePanel === 'ethics' ? 'active' : ''}`}>
                 <ShieldCheck size={16} />
               </button>
               <button onClick={() => togglePanel('history')} title="Book History" className={`panel-toggle ${activePanel === 'history' ? 'active' : ''}`}>
                 <History size={16} />
               </button>
            </div>
          </div>
        </div>

        {/* Editor Surface */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-24">
            <input
              type="text"
              value={title}
              onChange={(e) => onUpdate(e.target.value, content)}
              placeholder="Title..."
              className="w-full text-4xl font-serif font-bold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 mb-6 bg-transparent"
            />
            <textarea
              ref={textareaRef}
              value={content}
              onSelect={handleSelect}
              onChange={(e) => onUpdate(title, e.target.value)}
              placeholder="Start writing your masterpiece here..."
              className="w-full h-full resize-none font-serif text-lg leading-relaxed text-gray-800 placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent outline-none pb-20"
            />
          </div>

          {/* Continue Writing Fab/Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
             <button
               onClick={handleContinueWriting}
               disabled={isAiProcessing}
               className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 hover:scale-105 transition-all text-sm font-medium disabled:opacity-50 disabled:hover:scale-100"
             >
               {isAiProcessing ? (
                 <>
                   <RefreshCw className="animate-spin" size={16} />
                   <span>Writing...</span>
                 </>
               ) : (
                 <>
                   <Play size={16} fill="currentColor" />
                   <span>Continue Writing</span>
                 </>
               )}
             </button>
          </div>
        </div>
        
        {/* Footer Status */}
        <div className="bg-white border-t border-gray-100 p-2 text-xs text-gray-400 flex justify-between px-4 z-10">
           <span>{useThinking ? 'Thinking Mode Active' : 'Standard Mode'}</span>
           <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
        </div>
      </div>

      {/* Right Panels */}
      {activePanel === 'outline' && outline && (
        <div className="w-80 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="p-3 bg-gray-100 border-b border-gray-200 font-medium text-sm text-gray-700 flex justify-between items-center">
            Structure Reference
            <button onClick={() => setActivePanel('none')}><PanelRightClose size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
             <div className="prose prose-sm prose-slate font-mono text-xs whitespace-pre-wrap">
               {outline}
             </div>
          </div>
        </div>
      )}

      {activePanel === 'ethics' && (
        <div className="w-80 md:w-96 relative">
          <EthicsPanel 
            content={content} 
            title={title} 
            format={format} 
            onUpdate={(newContent) => {
              onUpdate(title, newContent);
              onLogHistory('Applied Audit Fix', 'ai_assist', 'Accepted editorial suggestions.');
            }}
          />
        </div>
      )}

      {activePanel === 'chat' && (
        <div className="w-80 md:w-96 relative">
           <ChatAssistant currentContent={content} />
        </div>
      )}

      {activePanel === 'history' && (
        <div className="w-80 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
           <div className="p-3 bg-gray-100 border-b border-gray-200 font-medium text-sm text-gray-700 flex justify-between items-center">
              <span className="flex items-center gap-2"><History size={16} /> Activity Log</span>
              <button onClick={() => setActivePanel('none')}><PanelRightClose size={16} /></button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center italic mt-10">No history yet.</p>
              ) : (
                [...history].reverse().map((entry) => (
                  <div key={entry.id} className="relative pl-4 border-l-2 border-gray-100 py-1">
                    <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      entry.type === 'ai_assist' ? 'bg-indigo-500' :
                      entry.type === 'visual' ? 'bg-pink-500' :
                      entry.type === 'creation' ? 'bg-green-500' :
                      'bg-gray-400'
                    }`}></div>
                    <div className="text-xs text-gray-400 mb-0.5">{getRelativeTime(entry.timestamp)}</div>
                    <div className="text-sm font-medium text-slate-800">{entry.action}</div>
                    {entry.details && <div className="text-xs text-gray-500 mt-1">{entry.details}</div>}
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      <style>{`
        .editor-tool-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          background-color: white;
          color: #4338ca;
          border: 1px solid #c7d2fe;
          white-space: nowrap;
          transition: all 0.1s;
        }
        .editor-tool-btn:hover {
          background-color: #e0e7ff;
        }
        .panel-toggle {
          padding: 6px;
          border-radius: 6px;
          color: #6b7280;
          transition: all 0.2s;
        }
        .panel-toggle:hover {
          background-color: white;
          color: #111827;
        }
        .panel-toggle.active {
          background-color: white;
          color: #4f46e5;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
};
