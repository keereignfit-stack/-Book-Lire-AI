
import React, { useState } from 'react';
import { Lightbulb, ArrowRight, Loader2, Book, PenTool, Mic, Clapperboard, Frame, Globe } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { generateContentConcepts } from '../services/geminiService';
import { ContentConcept, ContentFormat, Manuscript } from '../types';

interface IdeationProps {
  onSelectIdea: (idea: ContentConcept) => void;
}

export const Ideation: React.FC<IdeationProps> = ({ onSelectIdea }) => {
  const navigate = useNavigate();
  // Try to get context if we are inside the book layout (unlikely for create page, but possible if repurposed)
  // For the main /create route, we need to access the App's state updater or context if we were using Context API.
  // Since we are not using a global Context Provider in this simplified refactor (state is in App),
  // we need to access the state setter via the parent Route or passed props.
  // However, `react-router` makes passing props to element tricky without Wrapper.
  // We will assume `onSelectIdea` passed from App wrapper handles the creation logic.
  
  // Actually, we need to inject the "Create Manuscript" logic here.
  // Since Ideation is rendered in a Route in App.tsx, we can wrap it there.
  // Let's assume the wrapper in App.tsx passes the correct handler.
  
  // BUT, to make this cleaner: We will use a wrapper in this file that implements the logic using `useNavigate` 
  // if we had access to the `setManuscripts` context. 
  // In the current architecture (App.tsx holds state), the `Ideation` component just receives `onSelectIdea`.
  // The App.tsx `Ideation` route:
  // <Ideation onSelectIdea={(idea) => { 
  //    const newMs = ...; 
  //    handleCreate(newMs); 
  //    navigate(`/book/${newMs.id}/structure`); 
  // }} />

  const [topic, setTopic] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>(ContentFormat.JOURNALISM);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [ideas, setIdeas] = useState<ContentConcept[]>([]);
  const [loading, setLoading] = useState(false);

  const formats = [
    { id: ContentFormat.JOURNALISM, icon: PenTool, label: 'Journalism' },
    { id: ContentFormat.FICTION, icon: Book, label: 'Fiction' },
    { id: ContentFormat.NON_FICTION, icon: Book, label: 'Non-Fiction' },
    { id: ContentFormat.POETRY, icon: Mic, label: 'Poetry' },
    { id: ContentFormat.DRAMA, icon: Clapperboard, label: 'Drama' },
    { id: ContentFormat.GRAPHIC_NOVEL, icon: Frame, label: 'Graphic Novel' },
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Japanese', 'Portuguese', 'Chinese (Simplified)', 'Russian', 'Arabic'
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const generated = await generateContentConcepts(topic, selectedFormat, selectedLanguage);
      setIdeas(generated);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Re-implement the handler to use the prop but we also need to create the book in App.tsx.
  // To solve the state access issue without Context API:
  // We will pass the `manuscripts` setter down? No, `App.tsx` has the logic.
  // We will modify `Ideation` to be simpler: it calls `onSelectIdea` which returns the ID, then we navigate.
  // But `onSelectIdea` in `types` returns void. 
  // The `Ideation` in `App.tsx` route:
  // <Ideation onSelectIdea={(idea) => {
  //    const newMs = ...;
  //    handleCreateManuscript(newMs);
  //    navigate(`/book/${newMs.id}/structure`);
  // }} />

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
          <Lightbulb size={32} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-slate-900">Creative Studio</h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Choose your format and enter a topic to generate distinctive concepts for your next masterpiece.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 mb-8">
        {/* Format Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setSelectedFormat(fmt.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFormat === fmt.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <fmt.icon size={14} />
              <span>{fmt.label}</span>
            </button>
          ))}
        </div>

        {/* Language Selector */}
        <div className="relative inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
           <Globe size={16} className="text-indigo-600" />
           <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Multilingual</span>
           <div className="h-4 w-px bg-indigo-200 mx-1"></div>
           <select 
             value={selectedLanguage}
             onChange={(e) => setSelectedLanguage(e.target.value)}
             className="bg-transparent border-none text-sm font-medium text-indigo-700 focus:ring-0 p-0 cursor-pointer"
           >
             {languages.map(lang => (
               <option key={lang} value={lang}>{lang}</option>
             ))}
           </select>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="max-w-xl mx-auto relative">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={`Enter a topic for your ${selectedFormat.toLowerCase()} piece...`}
          className="w-full pl-6 pr-32 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg"
        />
        <button
          type="submit"
          disabled={loading || !topic}
          className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-full font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Ideate'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        {ideas.map((idea, index) => (
          <div 
            key={index}
            className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col"
            onClick={() => {
              // We construct the manuscript object here in the App wrapper, but since we are modifying files,
              // let's check App.tsx changes.
              // App.tsx uses:
              /*
               <Ideation onSelectIdea={(idea) => {
                  const newMs: Manuscript = { ... };
                  handleCreateManuscript(newMs);
                  navigate(`/book/${newMs.id}/structure`);
               }} />
              */
              onSelectIdea(idea);
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider rounded-full">
                {idea.angle}
              </span>
              <ArrowRight className="text-gray-300 group-hover:text-indigo-500 transition-colors" size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif group-hover:text-indigo-700 transition-colors">
              {idea.headline}
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm flex-grow">
              {idea.summary}
            </p>
          </div>
        ))}
      </div>
      
      {ideas.length === 0 && !loading && (
        <div className="text-center mt-20 opacity-20 select-none">
           <p className="text-6xl font-serif font-bold text-gray-300">Book@Lire-AI</p>
        </div>
      )}
    </div>
  );
};
