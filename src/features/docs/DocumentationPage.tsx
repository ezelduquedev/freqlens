import { useState, useEffect } from 'react';
import tfgDocsData from '../../docs/content/tfg_docs.json';
import { DocumentationSidebar } from './DocumentationSidebar';
import { GlassPanel } from '../../ui/GlassPanel';
import { FileText, Download, Search, Info, List } from 'lucide-react';

interface Subsection {
  id: string;
  title: string;
  content: string;
}

interface Chapter {
  id: string;
  title: string;
  level: number;
  content: string;
  subsections: Subsection[];
}

export default function DocumentationPage() {
  const chapters = tfgDocsData as Chapter[];
  
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id || 'introduccion');
  const [activeSubId, setActiveSubId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ chapterId: string; subId?: string; title: string; preview: string }[]>([]);

  // Buscar ocurrencias del filtro de texto en los contenidos del TFG
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: typeof searchResults = [];

    chapters.forEach(chapter => {
      // Buscar en el texto principal del capítulo (sin tags HTML)
      const cleanChapterText = chapter.content.replace(/<[^>]+>/g, '').toLowerCase();
      if (cleanChapterText.includes(query) || chapter.title.toLowerCase().includes(query)) {
        const index = cleanChapterText.indexOf(query);
        const preview = cleanChapterText.substring(Math.max(0, index - 30), Math.min(cleanChapterText.length, index + 60)) + '...';
        results.push({
          chapterId: chapter.id,
          title: chapter.title,
          preview: `[Capítulo] ...${preview}`
        });
      }

      // Buscar en las subsecciones
      chapter.subsections.forEach(sub => {
        const cleanSubText = sub.content.replace(/<[^>]+>/g, '').toLowerCase();
        if (cleanSubText.includes(query) || sub.title.toLowerCase().includes(query)) {
          const index = cleanSubText.indexOf(query);
          const preview = cleanSubText.substring(Math.max(0, index - 30), Math.min(cleanSubText.length, index + 60)) + '...';
          results.push({
            chapterId: chapter.id,
            subId: sub.id,
            title: `${chapter.title} > ${sub.title}`,
            preview: `[Subsección] ...${preview}`
          });
        }
      });
    });

    setSearchResults(results);
  }, [searchQuery]);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];

  const handleSearchResultClick = (chapterId: string, subId?: string) => {
    setActiveChapterId(chapterId);
    setActiveSubId(subId || '');
    setSearchQuery('');
  };

  return (
    <div className="flex h-[calc(100vh-112px)] min-h-0 border border-white/5 rounded-2xl overflow-hidden bg-panel fade-in select-none">
      
      {/* 1. Left Notion-style Sidebar */}
      <DocumentationSidebar
        sections={chapters}
        activeChapterId={activeChapterId}
        activeSubId={activeSubId}
        onSelectChapter={(id) => { setActiveChapterId(id); setActiveSubId(''); }}
        onSelectSubsection={(cId, sId) => { setActiveChapterId(cId); setActiveSubId(sId); }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 2. Middle & Right Reader Area */}
      <div className="flex-grow flex flex-col h-full min-h-0 bg-black/10">
        
        {/* Sticky Top Breadcrumbs Navigation Bar */}
        <div className="h-11 border-b border-white/5 bg-black/25 flex items-center justify-between px-6 flex-shrink-0 font-mono text-[9px] uppercase tracking-wider text-text-soft">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span className="truncate">TFG FreqLens</span>
            <span className="opacity-30">/</span>
            <span className="truncate text-white font-extrabold">{activeChapter?.title}</span>
            {activeSubId && (
              <>
                <span className="opacity-30">/</span>
                <span className="truncate text-accent font-extrabold">
                  {activeChapter.subsections.find(s => s.id === activeSubId)?.title.replace(/^\d+(\.\d+)*\.\s*/, '')}
                </span>
              </>
            )}
          </div>

          {/* Download Original DOCX Button */}
          <a
            href="/FreqLens_Documento_Maestro_TFG.docx"
            download="FreqLens_Documento_Maestro_TFG.docx"
            className="flex items-center gap-1.5 text-text-soft hover:text-white transition-colors bg-white/[0.03] border border-white/5 px-2.5 py-1 rounded-lg cursor-pointer font-bold select-none"
          >
            <Download className="w-3 h-3 text-accent" />
            <span>Descargar DOCX</span>
          </a>
        </div>

        {/* Reader viewport: splits into 2-columns (Content Reader + Sticky TOC right) */}
        <div className="flex-grow flex min-h-0 w-full overflow-hidden">
          
          {/* Main Chapter Content Reader */}
          <div className="flex-grow overflow-y-auto p-8 select-text no-scrollbar max-w-4xl mx-auto w-full">
            {searchQuery ? (
              // Search Results Page
              <div className="space-y-6 fade-in select-none font-mono">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Search className="w-4 h-4 text-accent" />
                    Resultados de búsqueda ({searchResults.length})
                  </h3>
                  <p className="text-[9px] text-text-muted mt-1">
                    Buscando coincidencias de "{searchQuery}" en todo el volumen académico.
                  </p>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-8 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-center text-xs text-text-soft">
                    No se han encontrado resultados para tu término de búsqueda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {searchResults.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSearchResultClick(res.chapterId, res.subId)}
                        className="p-4 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col gap-1.5"
                      >
                        <h4 className="text-xs font-black text-white hover:text-accent transition-colors leading-tight">
                          {res.title}
                        </h4>
                        <p className="text-[10px] text-text-soft leading-relaxed italic border-l-2 border-accent/20 pl-3">
                          {res.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Structured Chapter/Subsection Contents
              <div className="space-y-6 fade-in pb-12">
                {activeSubId ? (
                  // Render Subsection Specific Details
                  <div
                    className="prose prose-invert max-w-none tfg-content font-sans text-xs leading-relaxed text-text-soft font-medium space-y-4"
                    dangerouslySetInnerHTML={{
                      __html: activeChapter.subsections.find(s => s.id === activeSubId)?.content || ''
                    }}
                  />
                ) : (
                  // Render Whole Chapter with Subsection list
                  <div className="space-y-6">
                    <div
                      className="prose prose-invert max-w-none tfg-content font-sans text-xs leading-relaxed text-text-soft font-medium space-y-4"
                      dangerouslySetInnerHTML={{ __html: activeChapter.content }}
                    />
                    
                    {activeChapter.subsections.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-white/5 space-y-3 select-none font-mono">
                        <span className="text-[7.5px] text-text-muted uppercase tracking-widest font-black block">
                          En este Capítulo:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeChapter.subsections.map(sub => (
                            <button
                              key={sub.id}
                              onClick={() => setActiveSubId(sub.id)}
                              className="p-3 text-left bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer transition-colors"
                            >
                              <h5 className="text-[9.5px] font-black text-white hover:text-accent transition-colors leading-tight">
                                {sub.title}
                              </h5>
                              <span className="text-[6.5px] text-text-soft uppercase tracking-wider block mt-1.5">
                                Leer Sección ➔
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Right Sticky Table of Contents (TOC) */}
          {!searchQuery && activeChapter.subsections.length > 0 && (
            <div className="w-56 border-l border-white/5 bg-black/5 p-5 hidden xl:flex flex-col gap-4 flex-shrink-0 select-none font-mono">
              <div className="flex items-center gap-1.5 text-white font-extrabold text-[8.5px] uppercase tracking-wider">
                <List className="w-3.5 h-3.5 text-accent" />
                <span>Índice del Capítulo</span>
              </div>

              <div className="flex flex-col gap-2">
                {/* Main Chapter Link */}
                <button
                  onClick={() => setActiveSubId('')}
                  className={`text-left text-[9.5px] transition-colors leading-tight cursor-pointer font-bold ${!activeSubId ? 'text-accent font-black border-l-2 border-accent pl-2' : 'text-text-soft hover:text-white pl-2 border-l border-white/5'}`}
                >
                  Inicio del Capítulo
                </button>

                {/* Subheadings list links */}
                {activeChapter.subsections.map(sub => {
                  const isActive = activeSubId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubId(sub.id)}
                      className={`text-left text-[9px] transition-colors leading-snug cursor-pointer ml-2 ${isActive ? 'text-accent font-black border-l-2 border-accent pl-2 -ml-0.5' : 'text-text-soft hover:text-white pl-2 border-l border-white/5'}`}
                    >
                      {sub.title.replace(/^\d+(\.\d+)*\.\s*/, '')}
                    </button>
                  );
                })}
              </div>

              {/* Informative Academic Box */}
              <GlassPanel className="mt-auto !p-2 border-white/5 flex flex-col gap-1 select-none">
                <div className="flex items-center gap-1 text-[7.5px] font-black text-accent uppercase tracking-wider">
                  <Info className="w-3 h-3 animate-pulse" />
                  <span>Tribunal TFG</span>
                </div>
                <p className="text-[6.5px] text-text-soft leading-normal uppercase">
                  Código fuente evaluado y compilado bajo estándares de grado de ingeniería informática.
                </p>
              </GlassPanel>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
