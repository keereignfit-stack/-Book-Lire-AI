
import React, { useState, useEffect } from 'react';
import { GitMerge, Layout, Loader2, ArrowRight, Download } from 'lucide-react';
import { ContentConcept, ContentFormat, OutlineDepth } from '../types';
import { generateOutline } from '../services/geminiService';

interface StructureBuilderProps {
  concept: ContentConcept;
  onComplete: (outline: string) => void;
}

const TEMPLATES: Record<ContentFormat, string[]> = {
  [ContentFormat.JOURNALISM]: ['Inverted Pyramid', 'Feature Article', 'Op-Ed Structure', 'Investigative Report'],
  [ContentFormat.FICTION]: ["Hero's Journey", "Save the Cat!", "Three-Act Structure", "Fichtean Curve"],
  [ContentFormat.NON_FICTION]: ['Problem-Agitate-Solve', 'Chronological', 'Compare and Contrast', 'Thematic'],
  [ContentFormat.POETRY]: ['Sonnet', 'Haiku Sequence', 'Free Verse Structure', 'Narrative Poem'],
  [ContentFormat.DRAMA]: ['Five-Act Structure (Shakespearean)', 'Realist Three-Act', 'One-Act'],
  [ContentFormat.GRAPHIC_NOVEL]: ['Kishōtenketsu', 'Standard Comic Script', 'Yon-Koma']
};

export const StructureBuilder: React.FC<StructureBuilderProps> = ({ concept, onComplete }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES[concept.format][0]);
  const [depth, setDepth] = useState<OutlineDepth>(OutlineDepth.DETAILED);
  const [outline, setOutline] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Reset template if concept format changes (though typically this component unmounts)
    if (TEMPLATES[concept.format] && !TEMPLATES[concept.format].includes(selectedTemplate)) {
      setSelectedTemplate(TEMPLATES[concept.format][0]);
    }
  }, [concept.format]);

  const handleGenerateOutline = async () => {
    setIsGenerating(true);
    try {
      const result = await generateOutline(
        concept.headline, 
        concept.summary, 
        concept.format, 
        selectedTemplate, 
        depth, 
        concept.language || 'English'
      );
      setOutline(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!outline) return;
    const blob = new Blob([outline], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${concept.headline.toLowerCase().replace(/\s+/g, '-')}-outline.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto h-full p-6 flex gap-6">
      {/* Configuration Panel */}
      <div className="w-1/3 bg-white p-6 rounded-xl border border-gray-200 h-fit shadow-sm">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900 mb-2">Structure & Outline</h2>
          <p className="text-sm text-gray-500">
            Define the skeleton of your {concept.format.toLowerCase()} piece before drafting.
            {concept.language && <span className="block mt-1 text-xs text-indigo-600 font-medium">Target Language: {concept.language}</span>}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Template</label>
            <div className="space-y-2">
              {TEMPLATES[concept.format].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${
                    selectedTemplate === t
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detail Level</label>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              {Object.values(OutlineDepth).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    depth === d
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateOutline}
            disabled={isGenerating}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <GitMerge size={18} />}
            Generate Outline
          </button>
        </div>
      </div>

      {/* Result Panel */}
      <div className="flex-1 bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
        {outline ? (
          <>
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
               <div>
                 <h3 className="font-bold text-lg text-slate-800">Generated Outline</h3>
                 <span className="text-xs text-indigo-600 font-medium uppercase tracking-wider">{selectedTemplate}</span>
               </div>
               <div className="flex gap-2">
                 <button
                   onClick={handleDownload}
                   className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                   title="Download Markdown"
                 >
                   <Download size={16} />
                 </button>
                 <button 
                   onClick={() => onComplete(outline)}
                   className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                 >
                   Start Drafting <ArrowRight size={16} />
                 </button>
               </div>
            </div>
            <textarea 
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              className="flex-1 w-full resize-none outline-none font-mono text-sm leading-relaxed text-slate-700 overflow-y-auto"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
            <Layout size={64} className="mb-4" />
            <p className="text-lg font-medium">No outline generated yet.</p>
            <p className="text-sm">Select a template and click generate.</p>
          </div>
        )}
      </div>
    </div>
  );
};
