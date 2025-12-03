
import React from 'react';
import { Book, Plus, Clock, FileText, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Manuscript, ContentFormat } from '../types';

interface ManuscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  manuscripts: Manuscript[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export const ManuscriptDrawer: React.FC<ManuscriptDrawerProps> = ({ 
  isOpen, onClose, manuscripts, activeId, onSelect, onCreate 
}) => {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/create');
    onClose();
    // onCreate prop might be deprecated if navigation handles logic, 
    // but useful if we wanted to trigger an empty state immediately.
    // For this refactor, we redirect to the Ideation wizard.
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-900">My Bookshelf</h2>
              <p className="text-xs text-gray-500">Manage your manuscripts</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {manuscripts.map((m) => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); onClose(); }}
                className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden ${
                  activeId === m.id 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200' 
                    : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-md ${activeId === m.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                      <Book size={16} />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{m.format}</span>
                  </div>
                  {activeId === m.id && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
                </div>
                
                <h3 className={`font-serif font-bold truncate mb-1 relative z-10 ${activeId === m.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                  {m.title || 'Untitled Draft'}
                </h3>
                
                <div className="flex items-center gap-3 text-xs text-gray-400 relative z-10">
                   <span className="flex items-center gap-1"><Clock size={10} /> {new Date(m.lastUpdated).toLocaleDateString()}</span>
                   <span className="flex items-center gap-1"><FileText size={10} /> {m.content.split(' ').length} words</span>
                </div>
                
                {/* Visual Cover Hint if exists */}
                {m.coverImage && (
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-16 opacity-10 bg-cover bg-center mask-linear"
                    style={{ backgroundImage: `url(${m.coverImage})` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Footer / Create New */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleCreate}
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Start New Book
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
