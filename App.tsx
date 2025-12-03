
import React, { useState, useEffect } from 'react';
import { Layout, PenTool, BookOpen, Globe, GitMerge, Image, Search, Library } from 'lucide-react';
import { HashRouter, Routes, Route, Navigate, NavLink, useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Ideation } from './components/Ideation';
import { Editor } from './components/Editor';
import { StructureBuilder } from './components/StructureBuilder';
import { VisualDesignStudio } from './components/VisualDesignStudio';
import { ResearchCenter } from './components/ResearchCenter';
import { PublishingStudio } from './components/PublishingStudio';
import { ManuscriptDrawer } from './components/ManuscriptDrawer';
import { ContentConcept, Manuscript, ContentFormat, HistoryEntry } from './types';

// Default initial state
const INITIAL_MANUSCRIPT: Manuscript = {
  id: 'default-1',
  title: '',
  content: '',
  outline: '',
  format: ContentFormat.JOURNALISM,
  language: 'English',
  lastUpdated: new Date(),
  history: [
    { id: 'h1', timestamp: new Date(), action: 'Project Created', type: 'creation' }
  ]
};

// --- Sub-components for Routing ---

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all w-full mb-1 ${
      isActive
        ? 'bg-slate-800 text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const BookLayout: React.FC<{
  manuscripts: Manuscript[],
  onUpdateManuscript: (id: string, updates: Partial<Manuscript>) => void,
  onCreateManuscript: () => void,
  activeId: string | null
}> = ({ manuscripts, onUpdateManuscript, onCreateManuscript, activeId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Use URL param id or fallback to prop (though prop is likely redundant if we trust URL)
  const currentId = params.bookId || activeId;
  const activeManuscript = manuscripts.find(m => m.id === currentId);

  // Redirect if book not found
  useEffect(() => {
    if (currentId && !activeManuscript) {
      navigate('/create');
    }
  }, [currentId, activeManuscript, navigate]);

  if (!activeManuscript) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <ManuscriptDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        manuscripts={manuscripts}
        activeId={activeManuscript.id}
        onSelect={(id) => { 
          navigate(`/book/${id}/editor`); 
          setIsDrawerOpen(false);
        }}
        onCreate={() => {
          onCreateManuscript();
          setIsDrawerOpen(false);
        }}
      />

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2 mb-1">
             <Globe className="text-indigo-400" size={24} />
             <h1 className="text-xl font-serif font-bold tracking-tight">Book@Lire-AI</h1>
           </div>
           <p className="text-xs text-slate-500 uppercase tracking-widest pl-8">Editorial Suite</p>
        </div>

        <div className="px-4 mt-4">
           <button 
             onClick={() => setIsDrawerOpen(true)}
             className="w-full flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
           >
             <div className="flex items-center gap-2 overflow-hidden">
                <Library size={16} className="text-indigo-400 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{activeManuscript.title || 'Untitled'}</span>
             </div>
             <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
           </button>
        </div>

        <nav className="flex-1 p-4">
          {/* Note: Relative paths work within the /book/:bookId context */}
          <SidebarLink to={`/create`} icon={Layout} label="Ideation" />
          <SidebarLink to={`structure`} icon={GitMerge} label="Structure" />
          <SidebarLink to={`editor`} icon={PenTool} label="Editor" />
          <SidebarLink to={`research`} icon={Search} label="Research & Strategy" />
          <SidebarLink to={`visual`} icon={Image} label="Visual Studio" />
          
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Production
            </h3>
            <SidebarLink to={`publish`} icon={BookOpen} label="Preview & Publish" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 text-center">
            <div className="text-xs text-slate-600">v2.1.0 • AI Co-Author</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Top Header (Contextual) */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <BookBreadcrumbs title={activeManuscript.title} />
        </header>

        {/* Viewport */}
        <div className="flex-1 relative overflow-hidden bg-gray-100/50">
           <Outlet context={{ manuscript: activeManuscript, onUpdate: onUpdateManuscript }} />
        </div>
      </main>
    </div>
  );
};

const BookBreadcrumbs = ({ title }: { title: string }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const viewName = pathSegments[pathSegments.length - 1] || 'Dashboard';

  return (
    <div className="flex items-center text-sm breadcrumbs text-gray-500">
      <span>Book@Lire-AI</span>
      <span className="mx-2">/</span>
      <span className="font-medium text-gray-900 capitalize">{viewName.replace('_', ' ')}</span>
      {title && (
        <>
          <span className="mx-2">/</span>
          <span className="truncate max-w-xs">{title}</span>
        </>
      )}
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([INITIAL_MANUSCRIPT]);

  const handleCreateManuscript = (newMs: Manuscript) => {
    setManuscripts(prev => [newMs, ...prev]);
    return newMs.id;
  };

  const handleUpdateManuscript = (id: string, updates: Partial<Manuscript>) => {
    setManuscripts(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates, lastUpdated: new Date() } : m
    ));
  };

  const addHistoryEntry = (id: string, action: string, type: HistoryEntry['type'], details?: string) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      type,
      details
    };
    
    setManuscripts(prev => prev.map(m => {
       if (m.id === id) {
         return { ...m, history: [...m.history, entry], lastUpdated: new Date() };
       }
       return m;
    }));
  };

  return (
    <HashRouter>
      <Routes>
        {/* Redirect Root to Editor of first book or Create */}
        <Route path="/" element={
           manuscripts.length > 0 
             ? <Navigate to={`/book/${manuscripts[0].id}/editor`} replace /> 
             : <Navigate to="/create" replace /> 
        } />

        {/* Ideation / Create Wizard */}
        <Route path="/create" element={
           <div className="h-screen bg-gray-50 overflow-y-auto">
             <div className="p-6">
               <NavLink to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-4">
                  &larr; Back to Dashboard
               </NavLink>
               <Ideation onSelectIdea={(idea) => {
                  // Logic handled inside Ideation wrapper below via navigate
               }} />
             </div>
           </div>
        } />

        {/* Book Workspace Layout */}
        <Route path="/book/:bookId" element={
          <BookLayout 
            manuscripts={manuscripts} 
            onUpdateManuscript={handleUpdateManuscript} 
            onCreateManuscript={() => {}} // Drawer handles logic via local navigation
            activeId={null} 
          />
        }>
            <Route index element={<Navigate to="editor" replace />} />
            
            <Route path="editor" element={<EditorRouteWrapper onLog={addHistoryEntry} />} />
            <Route path="structure" element={<StructureRouteWrapper onLog={addHistoryEntry} />} />
            <Route path="visual" element={<VisualRouteWrapper onLog={addHistoryEntry} />} />
            <Route path="research" element={<ResearchRouteWrapper />} />
            <Route path="publish" element={<PublishRouteWrapper />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

// --- Route Wrappers to extract context ---

import { useOutletContext } from 'react-router-dom';

type OutletContextType = {
  manuscript: Manuscript;
  onUpdate: (id: string, updates: Partial<Manuscript>) => void;
};

const EditorRouteWrapper = ({ onLog }: { onLog: (id: string, action: string, type: any, details?: string) => void }) => {
  const { manuscript, onUpdate } = useOutletContext<OutletContextType>();
  return (
    <div className="h-full p-6">
      <Editor 
        title={manuscript.title} 
        content={manuscript.content} 
        outline={manuscript.outline}
        format={manuscript.format}
        history={manuscript.history}
        onUpdate={(t, c) => onUpdate(manuscript.id, { title: t, content: c })}
        onLogHistory={(a, t, d) => onLog(manuscript.id, a, t, d)}
      />
    </div>
  );
};

const StructureRouteWrapper = ({ onLog }: { onLog: (id: string, action: string, type: any, details?: string) => void }) => {
  const { manuscript, onUpdate } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto">
      <StructureBuilder 
        concept={{
          headline: manuscript.title,
          summary: manuscript.content.slice(0, 300), 
          format: manuscript.format,
          angle: 'Existing',
          language: manuscript.language
        }} 
        onComplete={(outline) => {
           onUpdate(manuscript.id, { outline });
           onLog(manuscript.id, 'Outline Generated', 'ai_assist', 'Structure created from template.');
           navigate(`../editor`);
        }} 
      />
    </div>
  );
};

const VisualRouteWrapper = ({ onLog }: { onLog: (id: string, action: string, type: any, details?: string) => void }) => {
  const { manuscript, onUpdate } = useOutletContext<OutletContextType>();
  return (
    <div className="h-full">
      <VisualDesignStudio onSaveCover={(url) => {
         onUpdate(manuscript.id, { coverImage: url });
         onLog(manuscript.id, 'Cover Updated', 'visual', 'New cover art applied.');
      }} />
    </div>
  );
};

const ResearchRouteWrapper = () => {
  return (
    <div className="h-full">
      <ResearchCenter />
    </div>
  );
};

const PublishRouteWrapper = () => {
  const { manuscript, onUpdate } = useOutletContext<OutletContextType>();
  return (
    <div className="h-full">
      <PublishingStudio 
        title={manuscript.title} 
        content={manuscript.content} 
        onUpdate={(t, c) => onUpdate(manuscript.id, { title: t, content: c })} 
      />
    </div>
  );
};

export default App;
