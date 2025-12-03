
import React, { useState } from 'react';
import { 
  Smartphone, Tablet, Monitor, Book, Printer, Download, Play, 
  BarChart, Headphones, Volume2, CheckCircle, AlertTriangle, Loader2, Wand2, Trash2, Mic2, Globe, FileCode
} from 'lucide-react';
import { generateAudiobookChapter, analyzeReadability, applyReadabilitySuggestions, improveWriting } from '../services/geminiService';
import { ReadabilityMetrics, VoiceName, AudiobookTrack } from '../types';

interface PublishingStudioProps {
  title: string;
  content: string;
  onUpdate: (title: string, content: string) => void;
}

export const PublishingStudio: React.FC<PublishingStudioProps> = ({ title, content, onUpdate }) => {
  const [activeMode, setActiveMode] = useState<'preview' | 'audio' | 'analytics' | 'web'>('preview');
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'ereader' | 'laptop'>('laptop');
  
  // Audio State
  const [tracks, setTracks] = useState<AudiobookTrack[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Analytics State
  const [metrics, setMetrics] = useState<ReadabilityMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  // Web Export State
  const [authorName, setAuthorName] = useState('Veritas Author');
  const [bookDescription, setBookDescription] = useState('');
  const [isGeneratingBlurb, setIsGeneratingBlurb] = useState(false);

  // --- Handlers ---
  const handlePrint = () => {
    window.print();
  };

  const handleGenerateAudio = async () => {
    if (!content) return;
    setIsGeneratingAudio(true);
    try {
      const { url, duration } = await generateAudiobookChapter(content, selectedVoice);
      const newTrack: AudiobookTrack = {
        id: Date.now().toString(),
        title: title || 'Untitled Chapter',
        voice: selectedVoice,
        duration: duration,
        url: url,
        createdAt: new Date()
      };
      setTracks(prev => [newTrack, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDeleteTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalyze = async () => {
    if (!content) return;
    setIsAnalyzing(true);
    try {
      const data = await analyzeReadability(content);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestions = async () => {
      if (!content || !metrics?.suggestions) return;
      setIsFixing(true);
      try {
          const revised = await applyReadabilitySuggestions(content, metrics.suggestions);
          onUpdate(title, revised);
          setMetrics(null); // Clear metrics as they are now stale
      } catch (e) {
          console.error(e);
      } finally {
          setIsFixing(false);
      }
  };

  const handleGenerateBlurb = async () => {
    if (!content) return;
    setIsGeneratingBlurb(true);
    try {
      const blurb = await improveWriting(
        content.slice(0, 5000), 
        "Write a compelling, SEO-friendly book description (blurb) suitable for a website metadata tag. Keep it under 160 words.",
        true
      );
      setBookDescription(blurb);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingBlurb(false);
    }
  };

  const handleExportWeb = () => {
    const htmlContent = generateStandaloneHTML(title, content, authorName, bookDescription);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-') || 'book'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Rendering Helpers ---
  
  const getDeviceFrame = () => {
    switch (device) {
      case 'mobile': 
        return 'max-w-[375px] border-[14px] border-gray-900 rounded-[40px] shadow-2xl';
      case 'tablet': 
        return 'max-w-[768px] border-[20px] border-gray-800 rounded-[30px] shadow-2xl';
      case 'ereader': 
        return 'max-w-[600px] border-[16px] border-gray-300 border-b-[50px] rounded-[12px] shadow-xl grayscale';
      case 'laptop':
      default: 
        return 'max-w-[1024px] border-t-[24px] border-x-[12px] border-b-[24px] border-gray-800 rounded-lg shadow-2xl';
    }
  };

  const getScreenStyles = () => {
     if (device === 'ereader') return 'font-serif text-lg leading-relaxed bg-[#f4f4f4] text-slate-900 min-h-[800px] p-8';
     if (device === 'mobile') return 'font-sans text-base leading-snug bg-white text-gray-900 min-h-[667px] p-6';
     if (device === 'tablet') return 'font-serif text-lg leading-relaxed bg-white text-gray-900 min-h-[1024px] p-12';
     return 'font-serif text-xl leading-loose bg-white text-gray-900 min-h-[800px] p-16'; // Laptop
  };

  const getDeviceLabel = () => {
    switch(device) {
      case 'mobile': return 'Smartphone View (iPhone SE)';
      case 'tablet': return 'Tablet View (iPad)';
      case 'ereader': return 'E-Reader View (Kindle)';
      default: return 'Desktop/Laptop View';
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20 print:hidden">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full">
          <button 
             onClick={() => setActiveMode('preview')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeMode === 'preview' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Monitor size={16} /> Device Preview
          </button>
          <button 
             onClick={() => setActiveMode('audio')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeMode === 'audio' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Headphones size={16} /> Audiobook Studio
          </button>
          <button 
             onClick={() => setActiveMode('analytics')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeMode === 'analytics' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <BarChart size={16} /> Readability
          </button>
          <button 
             onClick={() => setActiveMode('web')}
             className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeMode === 'web' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Globe size={16} /> Web Edition
          </button>
        </div>

        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          <Printer size={16} /> Export PDF
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto relative bg-slate-100">
        
        {/* === DEVICE PREVIEW MODE === */}
        {activeMode === 'preview' && (
          <div className="flex flex-col items-center py-8 min-h-full">
            <div className="flex flex-col items-center mb-6 print:hidden">
               <div className="flex gap-4 mb-2">
                 <button onClick={() => setDevice('mobile')} className={`p-3 rounded-xl border-2 transition-all ${device === 'mobile' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`} title="Smartphone"><Smartphone size={20}/></button>
                 <button onClick={() => setDevice('tablet')} className={`p-3 rounded-xl border-2 transition-all ${device === 'tablet' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`} title="Tablet"><Tablet size={20}/></button>
                 <button onClick={() => setDevice('ereader')} className={`p-3 rounded-xl border-2 transition-all ${device === 'ereader' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`} title="E-Reader"><Book size={20}/></button>
                 <button onClick={() => setDevice('laptop')} className={`p-3 rounded-xl border-2 transition-all ${device === 'laptop' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`} title="Laptop"><Monitor size={20}/></button>
               </div>
               <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{getDeviceLabel()}</span>
            </div>

            <div className={`w-full mx-auto transition-all duration-500 ease-in-out ${getDeviceFrame()} bg-white overflow-hidden print:w-full print:shadow-none print:max-w-none print:border-0`}>
               {/* Simulated Screen */}
               <div className={`${getScreenStyles()} w-full h-full overflow-y-auto`}>
                  <h1 className="text-3xl font-bold mb-6 text-center">{title || 'Untitled Draft'}</h1>
                  <div className="whitespace-pre-wrap">{content || 'No content available to preview.'}</div>
               </div>
            </div>
          </div>
        )}

        {/* === AUDIOBOOK MODE === */}
        {activeMode === 'audio' && (
          <div className="max-w-4xl mx-auto py-12 px-6">
             <div className="text-center mb-10">
               <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">Narration & Distribution</h2>
               <p className="text-gray-500">Produce high-quality audiobooks using advanced neural text-to-speech.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Configuration Panel */}
               <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
                   <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <h3 className="text-xs font-bold text-indigo-800 uppercase mb-2">Target Selection</h3>
                      <div className="text-sm font-medium text-slate-900 truncate mb-1">{title || 'Untitled'}</div>
                      <div className="text-xs text-gray-500">{content ? `${content.split(' ').length} words` : 'No content'}</div>
                   </div>

                   <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Mic2 size={18}/> Narrator Voice</h3>
                   <div className="space-y-2 mb-6">
                      {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map((voice) => (
                         <button 
                           key={voice}
                           onClick={() => setSelectedVoice(voice as VoiceName)}
                           className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all ${selectedVoice === voice ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                         >
                           <span>{voice}</span>
                           {selectedVoice === voice && <CheckCircle size={14} />}
                         </button>
                      ))}
                   </div>
                   
                   <button 
                     onClick={handleGenerateAudio}
                     disabled={isGeneratingAudio || !content}
                     className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                   >
                     {isGeneratingAudio ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                     Generate Audiobook
                   </button>
                   <p className="text-[10px] text-gray-400 mt-2 text-center">Processes current chapter text for narration.</p>
               </div>

               {/* Tracks List */}
               <div className="md:col-span-2 space-y-4">
                 {tracks.length === 0 ? (
                    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-gray-400">
                       <Headphones size={48} className="mb-4 opacity-20" />
                       <p className="font-medium">No audio tracks yet.</p>
                       <p className="text-sm">Select a narrator and generate audio for your current chapter.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                      {tracks.map((track) => (
                        <div key={track.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <h4 className="font-bold text-slate-800 text-sm">{track.title}</h4>
                                 <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium">{track.voice}</span>
                                    <span>{formatDuration(track.duration)}</span>
                                    <span>{track.createdAt.toLocaleTimeString()}</span>
                                 </div>
                              </div>
                              <button onClick={() => handleDeleteTrack(track.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                           
                           <audio controls src={track.url} className="w-full h-8 mb-3" />
                           
                           <div className="flex justify-end">
                              <a 
                                href={track.url} 
                                download={`${track.title.replace(/\s+/g, '_')}_${track.voice}.wav`}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                              >
                                <Download size={14} /> Download WAV
                              </a>
                           </div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
             </div>
          </div>
        )}

        {/* === ANALYTICS MODE === */}
        {activeMode === 'analytics' && (
          <div className="max-w-4xl mx-auto py-12 px-6">
             <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                <div>
                   <h2 className="text-3xl font-serif font-bold text-slate-800">Readability Analysis</h2>
                   <p className="text-gray-500">Ensure your audience connects with your writing.</p>
                </div>
                {!metrics && (
                   <button 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                   >
                      {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                   </button>
                )}
             </div>

             {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Grade Level</span>
                      <span className="text-4xl font-black text-slate-800 mb-1">{metrics.gradeLevel}</span>
                      <span className="text-xs text-gray-500">Target Audience</span>
                   </div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reading Ease</span>
                      <span className={`text-4xl font-black mb-1 ${metrics.score > 60 ? 'text-green-600' : 'text-orange-500'}`}>{metrics.score}</span>
                      <span className="text-xs text-gray-500">/ 100</span>
                   </div>
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Complex Sentences</span>
                      <span className="text-4xl font-black text-red-500 mb-1">{metrics.complexSentenceCount}</span>
                      <span className="text-xs text-gray-500">Detected</span>
                   </div>
                </div>
             )}

             {metrics && (
                <div className="bg-indigo-50 rounded-xl p-8 border border-indigo-100">
                   <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <CheckCircle size={18} /> Improvements
                   </h3>
                   <ul className="space-y-3">
                      {metrics.suggestions.map((suggestion, i) => (
                         <li key={i} className="flex gap-3 text-sm text-indigo-800 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="font-bold text-indigo-400">{i+1}.</span>
                            {suggestion}
                         </li>
                      ))}
                   </ul>
                   <div className="mt-6 pt-4 border-t border-indigo-200 flex justify-end">
                      <button 
                        onClick={handleApplySuggestions}
                        disabled={isFixing}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {isFixing ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                        Apply Suggestions with AI
                      </button>
                   </div>
                </div>
             )}
          </div>
        )}

        {/* === WEB EXPORT MODE === */}
        {activeMode === 'web' && (
          <div className="max-w-4xl mx-auto py-12 px-6">
             <div className="text-center mb-10">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-600 mb-4">
                 <Globe size={32} />
               </div>
               <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">Publish to Web</h2>
               <p className="text-gray-500">Export your manuscript as a professional, standalone website.</p>
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Author Name</label>
                        <input 
                          type="text" 
                          value={authorName} 
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Book Description (Meta Tag)</label>
                        <textarea 
                          rows={4}
                          value={bookDescription} 
                          onChange={(e) => setBookDescription(e.target.value)}
                          className="w-full border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
                          placeholder="A brief summary for SEO..."
                        />
                        <button 
                          onClick={handleGenerateBlurb}
                          disabled={isGeneratingBlurb || !content}
                          className="mt-2 text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1"
                        >
                          {isGeneratingBlurb ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>}
                          Generate with AI
                        </button>
                      </div>
                   </div>

                   <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileCode size={18} className="text-teal-600"/> Website Features
                      </h3>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="text-teal-500"/> Responsive Mobile Design
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="text-teal-500"/> Built-in Table of Contents
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="text-teal-500"/> Light / Sepia / Dark Modes
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle size={14} className="text-teal-500"/> Single File (No Dependencies)
                        </li>
                      </ul>
                      <button
                        onClick={handleExportWeb}
                        className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download size={18} /> Download Website (.html)
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:w-full, .print\\:w-full * {
            visibility: visible;
          }
          .print\\:w-full {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 2cm;
            border: none;
            box-shadow: none;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Helper: Generate Standalone HTML content
const generateStandaloneHTML = (title: string, content: string, author: string, description: string): string => {
  // Simple parser to structure content
  // Wraps paragraphs, detects headers
  const formatContent = (text: string) => {
    return text.split('\n').map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('## ')) return `<h2 id="${line.replace('## ', '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${line.replace('## ', '')}</h2>`;
      if (line.startsWith('# ')) return `<h1 id="${line.replace('# ', '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${line.replace('# ', '')}</h1>`;
      return `<p>${line}</p>`;
    }).join('\n');
  };

  const formattedBody = formatContent(content);

  // Extract simple TOC from headers
  const tocItems = content.split('\n')
    .filter(line => line.startsWith('#') || line.startsWith('##'))
    .map(line => {
       const text = line.replace(/^#+\s+/, '');
       const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
       const level = line.startsWith('##') ? 'ml-4' : '';
       return `<a href="#${id}" class="block py-1 text-sm opacity-80 hover:opacity-100 ${level}">${text}</a>`;
    }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="author" content="${author}">
    <meta name="description" content="${description}">
    <style>
        :root {
            --bg: #ffffff;
            --text: #1a202c;
            --accent: #0f766e;
            --sidebar-bg: #f8fafc;
            --sidebar-border: #e2e8f0;
        }
        [data-theme="sepia"] {
            --bg: #fbf0d9;
            --text: #5f4b32;
            --accent: #8b5cf6;
            --sidebar-bg: #f3e6c8;
            --sidebar-border: #e6dcb8;
        }
        [data-theme="dark"] {
            --bg: #1e293b;
            --text: #e2e8f0;
            --accent: #38bdf8;
            --sidebar-bg: #0f172a;
            --sidebar-border: #334155;
        }
        body { margin: 0; font-family: 'Georgia', serif; background: var(--bg); color: var(--text); transition: background 0.3s, color 0.3s; line-height: 1.8; }
        .layout { display: flex; min-height: 100vh; }
        .sidebar { width: 280px; background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); padding: 2rem; position: fixed; height: 100vh; overflow-y: auto; font-family: sans-serif; }
        .main { margin-left: 280px; padding: 4rem 10%; max-width: 800px; width: 100%; }
        h1, h2, h3 { line-height: 1.3; margin-top: 2em; color: var(--text); }
        h1 { font-size: 2.5em; border-bottom: 2px solid var(--accent); padding-bottom: 0.5rem; margin-top: 0; }
        a { text-decoration: none; color: inherit; transition: opacity 0.2s; }
        p { margin-bottom: 1.5em; font-size: 1.15em; }
        
        .theme-toggle { position: fixed; top: 1rem; right: 2rem; display: flex; gap: 0.5rem; background: var(--bg); padding: 0.5rem; border-radius: 2rem; border: 1px solid var(--sidebar-border); z-index: 50; }
        .theme-btn { width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ccc; cursor: pointer; }

        @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%); transition: transform 0.3s; z-index: 40; }
            .sidebar.open { transform: translateX(0); }
            .main { margin-left: 0; padding: 2rem 5%; }
            .menu-btn { display: block; position: fixed; top: 1rem; left: 1rem; z-index: 50; background: var(--bg); border: 1px solid var(--sidebar-border); padding: 0.5rem; border-radius: 4px; }
        }
        @media (min-width: 769px) { .menu-btn { display: none; } }
    </style>
</head>
<body>
    <button class="menu-btn" onclick="document.querySelector('.sidebar').classList.toggle('open')">☰ Menu</button>
    <div class="theme-toggle">
        <div class="theme-btn" style="background:#fff" onclick="setTheme('light')" title="Light"></div>
        <div class="theme-btn" style="background:#fbf0d9" onclick="setTheme('sepia')" title="Sepia"></div>
        <div class="theme-btn" style="background:#1e293b" onclick="setTheme('dark')" title="Dark"></div>
    </div>

    <div class="layout">
        <nav class="sidebar">
            <div style="margin-bottom: 2rem; font-weight: bold; font-size: 1.2rem;">${title}</div>
            <div style="font-size: 0.85rem; color: var(--accent); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px;">Contents</div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${tocItems || '<p style="opacity:0.5; font-size:0.9rem;">No headers detected.</p>'}
            </div>
            <div style="margin-top: 3rem; font-size: 0.8rem; opacity: 0.6;">
                &copy; ${new Date().getFullYear()} ${author}
            </div>
        </nav>
        <main class="main">
            <h1 style="border:none; margin-bottom: 0.5rem;">${title}</h1>
            <div style="font-family: sans-serif; opacity: 0.6; margin-bottom: 3rem;">By ${author}</div>
            ${formattedBody}
        </main>
    </div>

    <script>
        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('book-theme', theme);
        }
        const savedTheme = localStorage.getItem('book-theme') || 'light';
        setTheme(savedTheme);
    </script>
</body>
</html>`;
};
