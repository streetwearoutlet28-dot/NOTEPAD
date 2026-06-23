import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  Folder, 
  Settings, 
  Trash2,
  Layers,
  FilePlus,
  Notebook,
  Check,
  X,
  Lightbulb,
  Pin
} from 'lucide-react';
import { UserProfile } from './Settings';
import { AppIdea } from './AppIdeas/types';
import { marked } from 'marked';
import ContextMenu from './ContextMenu';
import TemplatePicker from './TemplatePicker';

interface SidebarDocument {
  id: string;
  title: string;
  projectId: string | null;
  content: string;
  tags?: string[];
}

interface SidebarProject {
  id: string;
  name: string;
}

interface SidebarProps {
  currentView: 'workspace' | 'settings' | 'app-ideas';
  onNavigate: (view: 'workspace' | 'settings' | 'app-ideas') => void;
  workspaces: { id: string; name: string }[];
  activeWorkspaceId: string;
  projects: SidebarProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  documents: SidebarDocument[];
  activeDocId: string | null;
  onSelectDoc: (id: string) => void;
  onNewDocInProject: (projectId: string) => void;
  onNewFloatingDoc: () => void;
  onDeleteDoc: (id: string) => void;
  onRenameDoc: (id: string, newTitle: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeUser: UserProfile;
  appIdeas?: AppIdea[];

  // New features props
  pinnedDocs: string[];
  onTogglePinDoc: (id: string) => void;
  onDuplicateDoc: (id: string) => void;
  onSaveAsTemplate: (id: string) => void;
  customTemplates: any[];
  onNewFromTemplate: (name: string, projectId?: string | null) => void;
  docsOrder: string[];
  onReorderDocs: (ids: string[]) => void;
  renamingDocId: string | null;
  onRenamingDocIdChange: (id: string | null) => void;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface HighlightedTextProps {
  text: string;
  highlight: string;
}

function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  const escaped = escapeRegExp(highlight);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-brand-azure/30 dark:bg-brand-azure/40 text-brand-azure dark:text-brand-azure font-bold rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function Sidebar({
  currentView,
  onNavigate,
  workspaces,
  activeWorkspaceId,
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  documents,
  activeDocId,
  onSelectDoc,
  onNewDocInProject,
  onNewFloatingDoc,
  onDeleteDoc,
  onRenameDoc,
  searchQuery,
  onSearchChange,
  activeUser,
  appIdeas = [],

  pinnedDocs,
  onTogglePinDoc,
  onDuplicateDoc,
  onSaveAsTemplate,
  customTemplates,
  onNewFromTemplate,
  docsOrder,
  onReorderDocs,
  renamingDocId,
  onRenamingDocIdChange
}: SidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'proj-default': true
  });

  const [recentDraftsExpanded, setRecentDraftsExpanded] = useState(true);

  // New templates popup state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; docId: string } | null>(null);

  // HTML5 Drag and drop state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [draggedOverId, setDraggedOverId] = useState<string | null>(null);
  const [dropIndicatorSide, setDropIndicatorSide] = useState<'top' | 'bottom' | null>(null);

  // Tag filter state
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  useEffect(() => {
    if (window.electron) {
      window.electron.storeGet('recentDraftsExpanded').then((val: any) => {
        if (typeof val === 'boolean') setRecentDraftsExpanded(val);
      }).catch(() => {});
    }
  }, []);

  const toggleRecentDrafts = () => {
    setRecentDraftsExpanded(prev => {
      const next = !prev;
      if (window.electron) {
        window.electron.storeSet('recentDraftsExpanded', next).catch(() => {});
      }
      return next;
    });
  };

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [renameValue, setRenameValue] = useState('');

  const startRename = (doc: SidebarDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    onRenamingDocIdChange(doc.id);
    setRenameValue(doc.title);
  };

  const commitRename = () => {
    if (renamingDocId) {
      onRenameDoc(renamingDocId, renameValue);
    }
    onRenamingDocIdChange(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
    if (e.key === 'Escape') { onRenamingDocIdChange(null); setRenameValue(''); }
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleCreateProject = () => {
    setIsAddingProject(true);
    setNewProjectName('');
  };

  const handleSaveProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setIsAddingProject(false);
      setNewProjectName('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsAddingProject(false);
      setNewProjectName('');
    }
  };

  const hasSearch = searchQuery.trim() !== '';

  const isDocMatch = (doc: SidebarDocument) => {
    if (!hasSearch) return false;
    const q = searchQuery.toLowerCase();
    return doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q);
  };

  const isProjectMatch = (project: SidebarProject) => {
    if (!hasSearch) return false;
    const q = searchQuery.toLowerCase();
    if (project.name.toLowerCase().includes(q)) return true;
    return documents.some(d => d.projectId === project.id && isDocMatch(d));
  };

  const isAppIdeasMatch = () => {
    if (!hasSearch) return false;
    const q = searchQuery.toLowerCase();
    return appIdeas.some(idea => {
      const fields = [
        idea.name,
        idea.appTitle,
        idea.appDescription,
        idea.shortDescription,
        idea.fullDescription,
        idea.keywords,
        idea.extraNotes,
        idea.firebaseNotes,
        idea.antigravityPrompt,
        idea.bigBangPrompt
      ];
      return fields.some(field => typeof field === 'string' && field.toLowerCase().includes(q));
    });
  };

  // Collect all unique tags in documents
  const allTags = Array.from(
    new Set(
      documents
        .flatMap(d => d.tags || [])
        .filter(t => typeof t === 'string' && t.startsWith('#'))
    )
  );

  // Apply Tag Filter + Search query rules
  const filteredDocsByTag = documents.filter(doc => {
    if (activeTagFilter) {
      const tags = doc.tags || [];
      if (!tags.includes(activeTagFilter)) return false;
    }
    return true;
  });

  const floatingDocs = filteredDocsByTag.filter(d => d.projectId === null);

  // Drag and drop notes reorder handlers
  const handleNoteDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNoteId(id);
  };

  const handleNoteDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedNoteId === id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const side = relativeY < rect.height / 2 ? 'top' : 'bottom';

    setDraggedOverId(id);
    setDropIndicatorSide(side);
  };

  const handleNoteDragEnd = () => {
    setDraggedNoteId(null);
    setDraggedOverId(null);
    setDropIndicatorSide(null);
  };

  const handleNoteDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNoteId || draggedNoteId === targetId) return;

    const targetDoc = documents.find(d => d.id === targetId);
    if (!targetDoc) return;

    const sectionDocs = documents.filter(d => d.projectId === targetDoc.projectId);
    const order = [...docsOrder];

    sectionDocs.forEach(d => {
      if (!order.includes(d.id)) {
        order.push(d.id);
      }
    });

    const srcIndex = order.indexOf(draggedNoteId);
    const tarIndex = order.indexOf(targetId);

    if (srcIndex !== -1 && tarIndex !== -1) {
      order.splice(srcIndex, 1);
      const insertIndex = dropIndicatorSide === 'top' ? tarIndex : tarIndex + 1;
      const adjustedInsertIndex = srcIndex < tarIndex && dropIndicatorSide === 'bottom' ? tarIndex : insertIndex;
      order.splice(adjustedInsertIndex, 0, draggedNoteId);
    }

    onReorderDocs(order);
    handleNoteDragEnd();
  };

  // Sort notes using docsOrder and Pinned status
  const sortSectionDocs = (list: SidebarDocument[]) => {
    const pinned = list.filter(d => pinnedDocs.includes(d.id));
    const unpinned = list.filter(d => !pinnedDocs.includes(d.id));

    const sortFn = (a: SidebarDocument, b: SidebarDocument) => {
      const idxA = docsOrder.indexOf(a.id);
      const idxB = docsOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    };

    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
  };

  const sortedFloatingDocs = sortSectionDocs(floatingDocs);

  // Right-click Context Menu triggers
  const handleNoteContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      docId
    });
  };

  // Render Note row helper
  const renderNoteRow = (doc: SidebarDocument, isActive: boolean, isDocMatched: boolean, isDocDimmed: boolean) => {
    const isPinned = pinnedDocs.includes(doc.id);
    const showTopIndicator = draggedOverId === doc.id && dropIndicatorSide === 'top';
    const showBottomIndicator = draggedOverId === doc.id && dropIndicatorSide === 'bottom';

    return (
      <div
        key={doc.id}
        draggable={renamingDocId !== doc.id}
        onDragStart={(e) => handleNoteDragStart(e, doc.id)}
        onDragOver={(e) => handleNoteDragOver(e, doc.id)}
        onDragEnd={handleNoteDragEnd}
        onDrop={(e) => handleNoteDrop(e, doc.id)}
        onContextMenu={(e) => handleNoteContextMenu(e, doc.id)}
        onClick={() => { if (renamingDocId !== doc.id) { onSelectDoc(doc.id); onNavigate('workspace'); } }}
        className={`group flex flex-col px-2.5 py-1.5 rounded-lg text-xs transition-all duration-300 cursor-pointer relative ${
          isDocMatched ? 'search-highlight-pulse text-neutral-850 dark:text-white' : ''
        } ${
          isDocDimmed ? 'opacity-50' : ''
        } ${
          isActive
            ? 'bg-brand-azure/10 text-brand-azure font-medium'
            : 'text-neutral-600 dark:text-neutral-300 hover:bg-gray-200/50 dark:hover:bg-neutral-800/50'
        } ${
          showTopIndicator ? 'border-t-2 border-brand-azure' : ''
        } ${
          showBottomIndicator ? 'border-b-2 border-brand-azure' : ''
        }`}
      >
        <div className="flex items-center justify-between overflow-hidden w-full">
          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
            <Notebook className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
            {renamingDocId === doc.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={handleRenameKeyDown}
                onClick={e => e.stopPropagation()}
                className="flex-1 min-w-0 bg-white dark:bg-[#1E1E1E] border border-brand-azure rounded px-1 py-0.5 text-xs outline-none text-neutral-800 dark:text-neutral-200"
              />
            ) : (
              <span
                className="truncate text-neutral-600 dark:text-neutral-350 flex items-center gap-1.5"
                onDoubleClick={e => startRename(doc, e)}
                title="Double-click to rename"
              >
                {isPinned && <Pin className="w-2.5 h-2.5 text-brand-azure flex-shrink-0 rotate-45" />}
                <HighlightedText text={doc.title} highlight={searchQuery} />
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const confirmed = window.confirm(`Are you sure you want to delete document "${doc.title}"?`);
              if (confirmed) onDeleteDoc(doc.id);
            }}
            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-gray-400 hover:text-red-600 transition flex-shrink-0"
            title="Delete Document"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Tags displayed under note title (Feature 17) */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 pl-5.5">
            {doc.tags.map((tag) => (
              <span key={tag} className="text-[8px] font-bold text-brand-azure/80 dark:text-brand-azure/70">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col border-r bg-gray-50 border-gray-200 dark:bg-[#2D2D2D] dark:border-[#3F3F3F] transition-colors duration-200 select-none font-sans relative">
      
      {/* 1. Draggable title bar strip */}
      <div
        className="h-12 flex-shrink-0 flex items-center"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        onDoubleClick={() => window.electron?.toggleMaximize()}
      >
      </div>
      
      {/* 2. Workspace Selector */}
      <div className="p-4 relative">
        <div 
          className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3F3F3F] rounded-xl shadow-sm text-sm font-medium"
        >
          <div className="flex items-center gap-2 text-neutral-800 dark:text-white">
            <Layers className="w-4 h-4 text-brand-azure" />
            <span className="truncate">{activeWorkspace.name}</span>
          </div>
        </div>
      </div>
      
      {/* 3. New Document split with template selector (Feature 8) */}
      <div className="px-4 pb-2 flex gap-1 relative" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={onNewFloatingDoc}
          className="flex-grow py-2.5 bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-semibold rounded-l-xl flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </button>
        <button
          onClick={() => setShowTemplatePicker(prev => !prev)}
          className="px-2.5 bg-brand-orange hover:bg-brand-orangeHover text-white text-xs font-semibold rounded-r-xl shadow-md shadow-brand-orange/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center cursor-pointer"
          title="New from template"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {showTemplatePicker && (
          <TemplatePicker
            customTemplates={customTemplates}
            onSelectTemplate={(name) => {
              onNewFromTemplate(name);
              setShowTemplatePicker(false);
            }}
            onClose={() => setShowTemplatePicker(false)}
          />
        )}
      </div>
      
      {/* 4. Search Bar */}
      <div className="px-4 py-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3F3F3F] rounded-xl text-xs outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors placeholder-gray-400 font-sans"
          />
        </div>
      </div>

      {/* 5. Tag Search Filters (Feature 17) */}
      {allTags.length > 0 && (
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none select-none">
          <button
            onClick={() => setActiveTagFilter(null)}
            className={`px-2 py-0.5 text-[9px] font-bold rounded-full border transition cursor-pointer flex-shrink-0 ${
              activeTagFilter === null
                ? 'bg-brand-azure text-white border-brand-azure'
                : 'bg-white dark:bg-[#1E1E1E] text-gray-450 dark:text-neutral-450 border-gray-255 dark:border-[#3F3F3F] hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => {
            const isSelected = activeTagFilter === tag;
            return (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(isSelected ? null : tag)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded-full border transition flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-azure text-white border-brand-azure'
                    : 'bg-white dark:bg-[#1E1E1E] text-neutral-600 dark:text-neutral-350 border-gray-200 dark:border-[#3F3F3F] hover:text-brand-azure hover:border-brand-azure'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* 3b. App Ideas Nav Button */}
      <div className="px-4 pb-2">
        <button
          onClick={() => onNavigate(currentView === 'app-ideas' ? 'workspace' : 'app-ideas')}
          className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-300 cursor-pointer ${
            hasSearch && isAppIdeasMatch() ? 'search-highlight-pulse text-brand-azure border border-brand-azure/30 shadow-md shadow-brand-azure/20' : ''
          } ${
            hasSearch && !isAppIdeasMatch() ? 'opacity-50' : ''
          } ${
            currentView === 'app-ideas'
              ? 'bg-brand-azure/15 text-brand-azure border border-brand-azure/30'
              : 'bg-[#1E1E1E] hover:bg-[#2A2A2A] text-neutral-400 hover:text-neutral-200 border border-[#3F3F3F] dark:border-[#3F3F3F]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>
            <HighlightedText text="App Ideas" highlight={searchQuery} />
          </span>
        </button>
      </div>

      {/* 6. Projects & Documents Navigation tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        
        {/* Projects list */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-gray-400 dark:text-gray-500 text-[10px] font-bold tracking-wider uppercase">
            <span>📁 Projects</span>
            <button
              onClick={handleCreateProject}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded transition text-gray-400 hover:text-brand-azure cursor-pointer"
              title="Add Project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 pl-1">
            {projects.map((project) => {
              const isExpanded = expandedProjects[project.id];
              
              // Filter documents in project by Tag filter
              const projectDocs = filteredDocsByTag.filter(d => d.projectId === project.id);
              const sortedDocs = sortSectionDocs(projectDocs);
              
              const isProjMatched = hasSearch && isProjectMatch(project);
              const isProjDimmed = hasSearch && !isProjMatched;
              
              return (
                <div key={project.id} className="space-y-0.5">
                  
                  {/* Project Title Row */}
                  <div 
                    onClick={() => { onSelectProject(project.id); onNavigate('workspace'); }}
                    className={`group flex items-center justify-between px-2 py-1 rounded-lg text-xs transition-all duration-300 cursor-pointer ${
                      isProjMatched ? 'search-highlight-pulse text-neutral-850 dark:text-white' : ''
                    } ${
                      isProjDimmed ? 'opacity-50' : ''
                    } ${
                      project.id === activeProjectId && currentView === 'workspace' && !activeDocId
                        ? 'bg-brand-azure/10 text-brand-azure font-semibold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-gray-200/50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-1 overflow-hidden">
                      <div 
                        onClick={(e) => { e.stopPropagation(); toggleProjectExpand(project.id); }}
                        className="p-0.5 hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 rounded transition flex items-center justify-center cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                      </div>
                      <Folder className="w-3.5 h-3.5 text-brand-azure flex-shrink-0" />
                      <span className="truncate font-semibold text-neutral-800 dark:text-white">
                        <HighlightedText text={project.name} highlight={searchQuery} />
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onNewDocInProject(project.id)}
                        className="p-0.5 hover:bg-gray-300 dark:hover:bg-neutral-700 rounded text-gray-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                        title="Add Document to Project"
                      >
                        <FilePlus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          const confirmed = window.confirm(`Are you sure you want to delete the project "${project.name}" and all its documents?`);
                          if (confirmed) onDeleteProject(project.id);
                        }}
                        className="p-0.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Project Note Items */}
                  {isExpanded && (
                    <div className="pl-6 space-y-0.5">
                      {sortedDocs.map((doc) => {
                        const isActive = doc.id === activeDocId && currentView === 'workspace';
                        const isDocMatched = hasSearch && isDocMatch(doc);
                        const isDocDimmed = hasSearch && !isDocMatched;
                        return renderNoteRow(doc, isActive, isDocMatched, isDocDimmed);
                      })}
                      {sortedDocs.length === 0 && (
                        <div className="text-[10px] text-gray-450 pl-2.5 py-1 italic font-sans">No matching notes</div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}

            {isAddingProject && (
              <form onSubmit={handleSaveProjectSubmit} className="px-2 py-1.5 flex items-center gap-1.5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3F3F3F] rounded-lg mt-1 shadow-sm">
                <input
                  type="text"
                  autoFocus
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 min-w-0 bg-transparent text-xs outline-none text-neutral-800 dark:text-neutral-200 font-sans"
                />
                <button
                  type="submit"
                  className="p-1 text-brand-azure hover:text-brand-azure/80 transition cursor-pointer"
                  title="Save Project"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className="p-1 text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-250 transition cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Categories: Recent Drafts (Floating notes) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={toggleRecentDrafts}
            className="w-full flex items-center justify-between px-2 py-1 text-gray-400 dark:text-gray-500 text-[10px] font-bold tracking-wider uppercase hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors"
          >
            <span>📄 Recent Drafts</span>
            {recentDraftsExpanded
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />
            }
          </button>
          
          {recentDraftsExpanded && (
            <div className="space-y-0.5 pl-1">
              {sortedFloatingDocs.map((doc) => {
                const isActive = doc.id === activeDocId && currentView === 'workspace';
                const isDocMatched = hasSearch && isDocMatch(doc);
                const isDocDimmed = hasSearch && !isDocMatched;
                return renderNoteRow(doc, isActive, isDocMatched, isDocDimmed);
              })}
              {sortedFloatingDocs.length === 0 && (
                <div className="text-[10px] text-gray-450 pl-3.5 py-1 italic font-sans">No matching drafts</div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Right-click Context Menu Portal */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isPinned={pinnedDocs.includes(contextMenu.docId)}
          onClose={() => setContextMenu(null)}
          onPin={() => onTogglePinDoc(contextMenu.docId)}
          onDuplicate={() => onDuplicateDoc(contextMenu.docId)}
          onSaveAsTemplate={() => onSaveAsTemplate(contextMenu.docId)}
          onExportPDF={() => {
            const doc = documents.find(d => d.id === contextMenu.docId);
            if (doc) {
              let htmlContent = '';
              const isMarkdown = doc.title.endsWith('.md') || doc.title.endsWith('.txt');
              if (isMarkdown) {
                try {
                  htmlContent = marked.parse(doc.content) as string;
                } catch (e) {
                  htmlContent = escapeHtml(doc.content);
                }
              } else {
                htmlContent = `<pre><code>${escapeHtml(doc.content)}</code></pre>`;
              }
              window.electron.exportPDF(htmlContent, doc.title);
            }
          }}
        />
      )}

      {/* 7. User Profile Card */}
      <div className="p-3 border-t border-gray-200 dark:border-[#3F3F3F] bg-gray-100/50 dark:bg-[#1E1E1E]/20 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange text-sm font-bold flex-shrink-0 shadow-sm border border-brand-orange/20">
            {activeUser.initials}
          </div>
          <div className="overflow-hidden">
            <div className="text-[12px] font-semibold text-neutral-800 dark:text-white truncate">{activeUser.name}</div>
            <div className="text-[10px] text-gray-400 truncate">{activeUser.email}</div>
          </div>
        </div>
        <button
          onClick={() => onNavigate(currentView === 'settings' ? 'workspace' : 'settings')}
          className={`p-2 rounded-xl transition cursor-pointer ${
            currentView === 'settings' 
              ? 'bg-brand-azure/15 text-brand-azure' 
              : 'text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-800'
          }`}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
