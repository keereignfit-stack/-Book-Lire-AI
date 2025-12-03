
import React, { useState } from 'react';
import { Image, Users, Wand2, Palette, Download, Loader2, Sparkles, TrendingUp, AlertCircle, Save } from 'lucide-react';
import { generateImage, analyzeImageAesthetics, createCharacterProfile } from '../services/geminiService';
import { CharacterProfile, CoverAnalysis, ImageResolution } from '../types';

interface VisualDesignStudioProps {
  onSaveCover?: (url: string) => void;
}

export const VisualDesignStudio: React.FC<VisualDesignStudioProps> = ({ onSaveCover }) => {
  const [activeTab, setActiveTab] = useState<'cover' | 'character'>('cover');

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-2 shadow-sm z-10">
         <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Studio Modes</h2>
         <button 
           onClick={() => setActiveTab('cover')}
           className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
             activeTab === 'cover' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
           }`}
         >
           <Image size={18} />
           <span>Cover Design</span>
         </button>
         <button 
           onClick={() => setActiveTab('character')}
           className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
             activeTab === 'character' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
           }`}
         >
           <Users size={18} />
           <span>Character Studio</span>
         </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'cover' ? <CoverDesigner onSave={onSaveCover} /> : <CharacterCreator />}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const CoverDesigner: React.FC<{onSave?: (url: string) => void}> = ({ onSave }) => {
  const [title, setTitle] = useState('The Lost Echo');
  const [author, setAuthor] = useState('A.I. Writer');
  const [stylePrompt, setStylePrompt] = useState('A mysterious forest with glowing blue fog, minimalist vector art style');
  const [resolution, setResolution] = useState<ImageResolution>('1K');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<CoverAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGenerate = async () => {
    if(!stylePrompt) return;
    
    // Check API Key for Pro models (2K/4K)
    if (resolution === '2K' || resolution === '4K') {
      try {
        const win = window as any;
        if (win.aistudio) {
             const hasKey = await win.aistudio.hasSelectedApiKey();
             if (!hasKey) {
                 await win.aistudio.openSelectKey();
             }
        }
      } catch (err) {
        console.error("API Key check warning:", err);
      }
    }

    setIsGenerating(true);
    setAnalysis(null);
    try {
      const fullPrompt = `Book cover art. ${stylePrompt}. Do not include text.`;
      const url = await generateImage(fullPrompt, '3:4', resolution);
      setGeneratedImage(url);
    } catch (e: any) {
      console.error(e);
      // Handle missing/invalid key error for Pro models
      if (e.toString().includes('Requested entity was not found') || e.message?.includes('Requested entity was not found')) {
          const win = window as any;
          if (win.aistudio) {
             alert("High-resolution generation requires a valid paid API key. Please select one.");
             await win.aistudio.openSelectKey();
          }
      } else {
          alert("Image generation failed. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if(!generatedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeImageAesthetics(generatedImage);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
      {/* Controls */}
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="mb-6">
           <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Cover Studio</h1>
           <p className="text-gray-500 text-sm">Design market-ready covers with Nano Banana visualization models.</p>
        </div>

        <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Book Title</label>
             <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
           </div>
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Author Name</label>
             <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
           </div>
           
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resolution</label>
              <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
                {(['1K', '2K', '4K'] as ImageResolution[]).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      resolution === res
                        ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {res}
                    {res !== '1K' && <span className="ml-1 text-[10px] text-amber-500 font-bold">PRO</span>}
                  </button>
                ))}
              </div>
              {resolution !== '1K' && (
                  <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={10} />
                    High-res requires a paid project API key.
                  </p>
              )}
           </div>

           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visual Prompt</label>
             <textarea 
               rows={4} 
               value={stylePrompt} 
               onChange={e => setStylePrompt(e.target.value)} 
               placeholder="Describe the mood, colors, and subject..."
               className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" 
             />
           </div>
           <button 
             onClick={handleGenerate} 
             disabled={isGenerating}
             className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
           >
             {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
             Generate Art
           </button>
        </div>

        {analysis && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <TrendingUp size={18} className="text-green-600" /> Market Analysis
               </h3>
               <span className={`text-xl font-black ${analysis.score > 75 ? 'text-green-600' : 'text-orange-500'}`}>
                 {analysis.score}/100
               </span>
             </div>
             <p className="text-sm text-gray-700 italic mb-4">"{analysis.critique}"</p>
             <div>
               <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Suggestions</h4>
               <ul className="space-y-1">
                 {analysis.suggestions.map((s, i) => (
                   <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                     <span className="text-indigo-500">•</span> {s}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center">
         <div className="relative shadow-2xl rounded-sm overflow-hidden bg-gray-900 w-[400px] h-[600px] group">
            {generatedImage ? (
              <img src={generatedImage} alt="Cover Art" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                <Palette size={64} className="opacity-20" />
              </div>
            )}
            
            {/* Text Overlay Layer */}
            <div className="absolute inset-0 flex flex-col items-center p-8 text-center pointer-events-none">
               <div className="mt-12">
                 <h1 className="text-4xl font-serif font-bold text-white drop-shadow-lg tracking-wide uppercase break-words leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                   {title}
                 </h1>
               </div>
               <div className="mt-auto mb-12">
                 <h2 className="text-xl font-sans font-medium text-white/90 drop-shadow-md tracking-widest uppercase" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                   {author}
                 </h2>
               </div>
            </div>
         </div>

         {generatedImage && (
           <div className="flex gap-3 mt-8">
             <button 
               onClick={handleAnalyze} 
               disabled={isAnalyzing}
               className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-105"
             >
               {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
               Aesthetic Check
             </button>
             {onSave && (
               <button 
                 onClick={() => onSave(generatedImage)}
                 className="flex items-center gap-2 px-5 py-2 bg-white text-gray-700 border border-gray-300 rounded-full shadow hover:bg-gray-50 transition-colors"
               >
                 <Save size={16} /> Set as Manuscript Cover
               </button>
             )}
           </div>
         )}
      </div>
    </div>
  );
};

const CharacterCreator: React.FC = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Protagonist');
  const [traits, setTraits] = useState('');
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreate = async () => {
    if(!name || !traits) return;
    setIsProcessing(true);
    setProfile(null);
    try {
      // 1. Generate text profile
      const newProfile = await createCharacterProfile(name, role, traits);
      
      // 2. Generate portrait based on the AI's visual description
      const portraitUrl = await generateImage(`Photorealistic character portrait. ${newProfile.visualDescription}. High quality, cinematic lighting.`, '1:1');
      newProfile.portraitUrl = portraitUrl;
      
      setProfile(newProfile);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Character Studio</h1>
        <p className="text-gray-500">Create living, breathing characters with deep psychological profiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-4 space-y-4">
           <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
               <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Elara Vance" className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role/Archetype</label>
               <select value={role} onChange={e => setRole(e.target.value)} className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                 <option>Protagonist</option>
                 <option>Antagonist</option>
                 <option>Sidekick</option>
                 <option>Mentor</option>
                 <option>Love Interest</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Traits & Vibe</label>
               <textarea 
                  value={traits} 
                  onChange={e => setTraits(e.target.value)} 
                  placeholder="e.g. Cynical detective, neon trenchcoat, scar on left cheek, loves jazz..."
                  rows={4}
                  className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
               />
             </div>
             <button 
               onClick={handleCreate} 
               disabled={isProcessing}
               className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
             >
               {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
               Bring to Life
             </button>
           </div>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-8">
          {profile ? (
             <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-right-8">
                <div className="md:w-1/3 bg-gray-100 relative">
                   {profile.portraitUrl ? (
                     <img src={profile.portraitUrl} alt={profile.name} className="w-full h-full object-cover min-h-[300px]" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 min-h-[300px]">
                       <Loader2 className="animate-spin" />
                     </div>
                   )}
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h2 className="text-white text-2xl font-bold font-serif">{profile.name}</h2>
                      <span className="text-indigo-200 text-sm font-medium uppercase tracking-wider">{profile.archetype}</span>
                   </div>
                </div>
                <div className="flex-1 p-8 space-y-6">
                   <div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Backstory</h3>
                     <p className="text-gray-700 leading-relaxed text-sm">{profile.backstory}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hidden Motivation</h3>
                        <p className="text-gray-700 leading-relaxed text-sm">{profile.motivation}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Visual DNA</h3>
                        <p className="text-gray-500 text-xs italic leading-relaxed bg-gray-50 p-3 rounded border border-gray-100">
                          "{profile.visualDescription}"
                        </p>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl min-h-[400px]">
                <Users size={64} className="mb-4 opacity-20" />
                <p>Character profile will appear here.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
