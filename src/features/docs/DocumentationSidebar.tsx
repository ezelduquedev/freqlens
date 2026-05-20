import { Book, ChevronRight } from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  level: number;
  subsections?: { id: string; title: string }[];
}

interface DocumentationSidebarProps {
  sections: DocSection[];
  activeChapterId: string;
  activeSubId: string;
  onSelectChapter: (chapterId: string) => void;
  onSelectSubsection: (chapterId: string, subId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const DocumentationSidebar = ({
  sections,
  activeChapterId,
  activeSubId,
  onSelectChapter,
  onSelectSubsection,
  searchQuery,
  setSearchQuery
}: DocumentationSidebarProps) => {
  return (
    <aside className="w-64 border-r border-white/5 bg-black/30 flex flex-col h-full flex-shrink-0 select-none font-mono">
      {/* Search Input Box */}
      <div className="p-4 border-b border-white/5 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en el TFG..."
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl pl-3 pr-8 py-1.5 font-mono text-[10.5px] text-white focus:outline-none focus:border-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1.5 hover:text-white text-text-soft text-[10px] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chapters list */}
      <div className="flex-grow overflow-y-auto no-scrollbar p-3 flex flex-col gap-1.5 min-h-0">
        <span className="text-[7.5px] text-text-muted uppercase tracking-widest font-black block px-2 mb-1">
          Capítulos del Proyecto
        </span>

        {sections.map(section => {
          const isChapterActive = activeChapterId === section.id;
          return (
            <div key={section.id} className="flex flex-col gap-0.5">
              {/* Chapter Item */}
              <button
                onClick={() => onSelectChapter(section.id)}
                className={`w-full text-left px-2 py-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 group ${isChapterActive ? 'border-accent bg-accent/[0.02] text-accent font-bold' : 'border-transparent text-text-soft hover:bg-white/[0.02] hover:text-white'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Book className={`w-3.5 h-3.5 flex-shrink-0 ${isChapterActive ? 'text-accent' : 'text-text-muted group-hover:text-white transition-colors'}`} />
                  <span className="text-[10px] truncate leading-tight">
                    {section.title}
                  </span>
                </div>
                {section.subsections && section.subsections.length > 0 && (
                  <ChevronRight className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isChapterActive ? 'rotate-90 text-accent' : ''}`} />
                )}
              </button>

              {/* Subheadings list under active chapter */}
              {isChapterActive && section.subsections && section.subsections.length > 0 && (
                <div className="pl-6 pr-1 py-0.5 flex flex-col border-l border-white/5 ml-4 gap-0.5 animate-fade-in">
                  {section.subsections.map(sub => {
                    const isSubActive = activeSubId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectSubsection(section.id, sub.id)}
                        className={`w-full text-left py-1 px-2 text-[9px] rounded-lg transition-colors cursor-pointer truncate ${isSubActive ? 'text-accent bg-accent/5 font-extrabold border border-accent/10' : 'text-text-soft hover:bg-white/[0.01] hover:text-white border border-transparent'}`}
                      >
                        {sub.title.replace(/^\d+(\.\d+)*\.\s*/, '')} {/* clean hierarchy prefixes for compact UI */}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
