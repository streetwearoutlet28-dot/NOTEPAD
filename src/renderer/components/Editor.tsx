import React, { useRef, useEffect, useState } from 'react';
import { FileText, X, Plus, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import FindReplace from './FindReplace';

export interface Tab {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  savedContent: string;
  projectId: string | null;
  tags?: string[];
}

interface EditorProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onContentChange: (content: string) => void;
  onReorderTabs: (draggedIndex: number, targetIndex: number) => void;
  onExportAsTxt: () => void;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  lineNumbersVisible: boolean;
  zoomLevel: number;
  wordWrap: boolean;
  spellCheck: boolean;
  onToggleWordWrap: () => void;
  onZoomChange: (level: number) => void;
  onRenameTab: (id: string, newTitle: string) => void;
  
  // New features props
  saveStatus: 'saving' | 'saved' | 'unsaved' | null;
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  showFindReplace: boolean;
  onCloseFindReplace: () => void;
  editorMode: 'edit' | 'preview' | 'split';
  onEditorModeChange: (mode: 'edit' | 'preview' | 'split') => void;
  tags: string[];
  onUpdateTags: (tags: string[]) => void;
}

interface LineData {
  text: string;
  html: string;
  isCodeBlock: boolean;
  isDelimiter: boolean;
  isFirstCodeLine?: boolean;
  isLastCodeLine?: boolean;
  codeBlockContent?: string;
  codeBlockId?: string;
}

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default function Editor({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onContentChange,
  onReorderTabs,
  onExportAsTxt,
  fontFamily,
  fontSize,
  lineHeight,
  lineNumbersVisible,
  zoomLevel,
  wordWrap,
  spellCheck,
  onToggleWordWrap,
  onZoomChange,
  onRenameTab,
  
  saveStatus,
  focusMode,
  setFocusMode,
  showFindReplace,
  onCloseFindReplace,
  editorMode,
  onEditorModeChange,
  tags,
  onUpdateTags
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Selected Text Counts
  const [selectedWords, setSelectedWords] = useState(0);
  const [selectedChars, setSelectedChars] = useState(0);

  // Copy code blocks hover state
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  // Find & Replace state
  const [findState, setFindState] = useState({
    visible: false,
    searchQuery: '',
    replaceQuery: '',
    showReplace: true,
    matchCase: false,
    wrapAround: true,
    currentIndex: 0,
    totalMatches: 0
  });

  const [matchIndices, setMatchIndices] = useState<{ start: number; end: number }[]>([]);

  useEffect(() => {
    setFindState(prev => ({
      ...prev,
      visible: !!showFindReplace
    }));
  }, [showFindReplace]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Sync scroll position
  const handleTextareaScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Find matches search query
  useEffect(() => {
    if (!activeTab || !findState.searchQuery) {
      setMatchIndices([]);
      setFindState(prev => ({ ...prev, currentIndex: 0, totalMatches: 0 }));
      return;
    }

    const text = activeTab.content;
    const query = findState.searchQuery;
    const matchCase = findState.matchCase;

    const indices: { start: number; end: number }[] = [];
    let pos = 0;

    const searchString = matchCase ? text : text.toLowerCase();
    const queryString = matchCase ? query : query.toLowerCase();

    while (true) {
      const idx = searchString.indexOf(queryString, pos);
      if (idx === -1) break;
      indices.push({ start: idx, end: idx + queryString.length });
      pos = idx + queryString.length;
      if (queryString.length === 0) break;
    }

    setMatchIndices(indices);
    setFindState(prev => ({
      ...prev,
      totalMatches: indices.length,
      currentIndex: indices.length > 0 ? Math.min(prev.currentIndex, indices.length - 1) : 0
    }));
  }, [activeTab?.content, findState.searchQuery, findState.matchCase]);

  // Navigate matching find values
  const scrollToMatch = (idx: number) => {
    const textarea = textareaRef.current;
    const match = matchIndices[idx];
    if (textarea && match) {
      textarea.focus();
      textarea.setSelectionRange(match.start, match.end);
      // Wait for selection update and scroll
      setTimeout(handleTextareaScroll, 10);
    }
  };

  const handleFindNext = () => {
    if (matchIndices.length === 0) return;
    setFindState(prev => {
      const nextIdx = (prev.currentIndex + 1) % matchIndices.length;
      scrollToMatch(nextIdx);
      return { ...prev, currentIndex: nextIdx };
    });
  };

  const handleFindPrev = () => {
    if (matchIndices.length === 0) return;
    setFindState(prev => {
      const prevIdx = (prev.currentIndex - 1 + matchIndices.length) % matchIndices.length;
      scrollToMatch(prevIdx);
      return { ...prev, currentIndex: prevIdx };
    });
  };

  const handleReplace = () => {
    if (!activeTab || matchIndices.length === 0) return;
    const currentMatch = matchIndices[findState.currentIndex];
    if (!currentMatch) return;

    const text = activeTab.content;
    const before = text.substring(0, currentMatch.start);
    const after = text.substring(currentMatch.end);
    const newContent = before + findState.replaceQuery + after;

    onContentChange(newContent);
  };

  const handleReplaceAll = () => {
    if (!activeTab || !findState.searchQuery) return;
    const text = activeTab.content;
    const query = findState.searchQuery;
    const replace = findState.replaceQuery;
    const matchCase = findState.matchCase;

    const escaped = escapeRegExp(query);
    const regex = new RegExp(escaped, matchCase ? 'g' : 'gi');
    const newContent = text.replace(regex, replace);

    onContentChange(newContent);
  };

  const handleCloseFindReplace = () => {
    setFindState(prev => ({ ...prev, visible: false }));
    onCloseFindReplace();
  };

  const startTabRename = (tab: Tab, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingTabId(tab.id);
    setRenameValue(tab.title);
  };

  const commitTabRename = () => {
    if (renamingTabId && renameValue.trim()) {
      onRenameTab(renamingTabId, renameValue.trim());
    }
    setRenamingTabId(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitTabRename(); }
    if (e.key === 'Escape') { setRenamingTabId(null); setRenameValue(''); }
  };

  // Focus textarea when active tab changes
  useEffect(() => {
    if (activeTab && textareaRef.current) {
      textareaRef.current.focus();
      updateCursorPosition();
      setSelectedWords(0);
      setSelectedChars(0);
    }
  }, [activeTabId]);

  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const selStart = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, selStart);
      const lines = textBefore.split('\n');
      setCursorPos({
        line: lines.length,
        col: lines[lines.length - 1].length + 1
      });
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
    updateCursorPosition();
  };

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selectedText = textarea.value.substring(start, end).trim();
      const words = selectedText === '' ? 0 : selectedText.split(/\s+/).length;
      const chars = end - start;
      setSelectedWords(words);
      setSelectedChars(chars);
    } else {
      setSelectedWords(0);
      setSelectedChars(0);
    }
    updateCursorPosition();
  };

  // Drag and Drop Tab Reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr !== '') {
      const sourceIndex = parseInt(sourceIndexStr, 10);
      if (sourceIndex !== targetIndex) {
        onReorderTabs(sourceIndex, targetIndex);
      }
    }
  };

  const handleMiddleClick = (e: React.MouseEvent, id: string) => {
    if (e.button === 1) { // Middle-click
      e.preventDefault();
      onCloseTab(id);
    }
  };

  // Word count, character count, line count
  const getCounts = () => {
    if (!activeTab) return { words: 0, chars: 0, lines: 0 };
    const text = activeTab.content.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    const chars = activeTab.content.length;
    const lines = activeTab.content.split('\n').length;
    return { words, chars, lines };
  };

  const counts = getCounts();
  const scaledFontSize = fontSize * (zoomLevel / 100);

  const getFontFamily = (family: string) => {
    switch (family) {
      case 'Monospace':
        return '"JetBrains Mono", "Courier New", monospace';
      case 'Serif':
        return 'Georgia, serif';
      case 'Sans-serif':
        return 'Inter, "SF Pro", sans-serif';
      case 'System Default':
      default:
        return 'Onest, -apple-system, sans-serif';
    }
  };

  const resolvedFont = getFontFamily(fontFamily);

  const fontStyle = {
    fontFamily: resolvedFont,
    fontSize: `${scaledFontSize}px`,
    lineHeight: lineHeight.toString()
  };

  // Highlight.js and Find Highlight parser
  const parseLines = (text: string, searchQuery: string, caseSensitive: boolean, currentMatchIndex: number): LineData[] => {
    const rawLines = text.split('\n');
    const linesData: LineData[] = [];
    
    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i];
      if (line.startsWith('```')) {
        const delimiter = line;
        const lang = line.slice(3).trim().toLowerCase() || 'plaintext';
        linesData.push({
          text: delimiter,
          html: escapeHtml(delimiter),
          isCodeBlock: false,
          isDelimiter: true
        });
        
        let codeLines: string[] = [];
        let j = i + 1;
        while (j < rawLines.length && !rawLines[j].startsWith('```')) {
          codeLines.push(rawLines[j]);
          j++;
        }
        
        const codeBlockText = codeLines.join('\n');
        const codeBlockId = `cb-${i}`;
        let highlightedHtml = '';
        const supportedLangs = ['javascript', 'typescript', 'python', 'json', 'bash', 'html', 'css', 'js', 'ts', 'sh'];
        const resolvedLang = supportedLangs.includes(lang) ? lang : 'plaintext';
        
        try {
          highlightedHtml = hljs.highlight(codeBlockText, { language: resolvedLang }).value;
        } catch (e) {
          highlightedHtml = escapeHtml(codeBlockText);
        }
        
        const highlightedLines = highlightedHtml.split('\n');
        for (let k = 0; k < codeLines.length; k++) {
          linesData.push({
            text: codeLines[k],
            html: highlightedLines[k] || '',
            isCodeBlock: true,
            isDelimiter: false,
            isFirstCodeLine: k === 0,
            isLastCodeLine: k === codeLines.length - 1,
            codeBlockContent: k === 0 ? codeBlockText : undefined,
            codeBlockId: k === 0 ? codeBlockId : undefined
          });
        }
        
        if (j < rawLines.length && rawLines[j].startsWith('```')) {
          linesData.push({
            text: rawLines[j],
            html: escapeHtml(rawLines[j]),
            isCodeBlock: false,
            isDelimiter: true
          });
          j++;
        }
        i = j;
      } else {
        linesData.push({
          text: line,
          html: escapeHtml(line),
          isCodeBlock: false,
          isDelimiter: false
        });
        i++;
      }
    }
    
    // Apply search matches highlights
    if (searchQuery && searchQuery.trim()) {
      const escapedQuery = escapeRegExp(searchQuery);
      const regex = new RegExp(`(${escapedQuery})`, caseSensitive ? 'g' : 'gi');
      
      let matchCount = 0;
      
      return linesData.map(line => {
        if (line.isCodeBlock) {
          const htmlParts = line.html.split(/(<[^>]+>)/g);
          const highlightedParts = htmlParts.map(part => {
            if (part.startsWith('<')) {
              return part;
            }
            
            let result = '';
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;
            
            while ((match = regex.exec(part)) !== null) {
              const matchText = match[0];
              const matchIdx = match.index;
              result += part.substring(lastIndex, matchIdx);
              
              const isCurrent = matchCount === currentMatchIndex;
              matchCount++;
              
              const highlightClass = isCurrent 
                ? 'bg-brand-orange/45 dark:bg-brand-orange/60 text-white font-bold rounded-sm px-0.5'
                : 'bg-brand-azure/30 dark:bg-brand-azure/40 text-brand-azure rounded-sm px-0.5';
              
              result += `<mark class="${highlightClass}">${matchText}</mark>`;
              lastIndex = regex.lastIndex;
            }
            result += part.substring(lastIndex);
            return result;
          });
          return {
            ...line,
            html: highlightedParts.join('')
          };
        } else {
          let result = '';
          let lastIndex = 0;
          let match;
          regex.lastIndex = 0;
          
          while ((match = regex.exec(line.html)) !== null) {
            const matchText = match[0];
            const matchIdx = match.index;
            result += line.html.substring(lastIndex, matchIdx);
            
            const isCurrent = matchCount === currentMatchIndex;
            matchCount++;
            
            const highlightClass = isCurrent 
              ? 'bg-brand-orange/45 dark:bg-brand-orange/60 text-white font-bold rounded-sm px-0.5'
              : 'bg-brand-azure/30 dark:bg-brand-azure/40 text-brand-azure rounded-sm px-0.5';
            
            result += `<mark class="${highlightClass}">${matchText}</mark>`;
            lastIndex = regex.lastIndex;
          }
          result += line.html.substring(lastIndex);
          return {
            ...line,
            html: result
          };
        }
      });
    }
    
    return linesData;
  };

  const linesData = parseLines(
    activeTab ? activeTab.content : '', 
    findState.searchQuery, 
    findState.matchCase, 
    findState.currentIndex
  );

  const handleCopyCodeBlock = (content: string, blockId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedBlockId(blockId);
    setTimeout(() => setCopiedBlockId(null), 1500);
  };

  // Preview Mode Code Block Copy Buttons
  useEffect(() => {
    if ((editorMode === 'preview' || editorMode === 'split') && previewContainerRef.current) {
      const preElements = previewContainerRef.current.querySelectorAll('pre');
      preElements.forEach((pre) => {
        if (pre.querySelector('.copy-code-btn')) return;
        
        pre.style.position = 'relative';
        
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn absolute right-2 top-2 px-2 py-1 text-[10px] font-semibold bg-[#2D2D2D]/85 border border-[#3F3F3F] text-neutral-300 rounded-lg hover:bg-neutral-800 transition-all cursor-pointer opacity-0 group-hover:opacity-100';
        btn.innerText = 'Copy';
        
        pre.classList.add('group');
        
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const codeText = pre.querySelector('code')?.innerText || '';
          navigator.clipboard.writeText(codeText);
          btn.innerText = 'Copied ✓';
          setTimeout(() => {
            btn.innerText = 'Copy';
          }, 1500);
        });
        
        pre.appendChild(btn);
      });
    }
  }, [activeTab?.content, editorMode]);

  const getPreviewHtml = () => {
    if (!activeTab) return '';
    try {
      return marked.parse(activeTab.content) as string;
    } catch (e) {
      return escapeHtml(activeTab.content);
    }
  };

  // Tag color assigner
  const getTagColor = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/35' },
      { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/35' },
      { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/35' },
      { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/35' },
      { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-900/35' }
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className={`flex-1 flex flex-col h-full bg-white dark:bg-[#1E1E1E] transition-colors duration-200 overflow-hidden relative ${
      focusMode ? 'z-50' : ''
    }`}>
      
      {/* 1. Tab Bar & Actions — Hidden in Focus Mode */}
      <div 
        className="flex items-center justify-between border-b border-gray-200 dark:border-[#3F3F3F] bg-gray-50/50 dark:bg-[#2D2D2D]/30 px-4 h-12 select-none transition-all duration-500 overflow-hidden flex-shrink-0"
        style={{
          height: focusMode ? '0px' : '3rem',
          opacity: focusMode ? 0 : 1,
          pointerEvents: focusMode ? 'none' : 'auto'
        }}
      >
        {/* Tabs Scroller */}
        <div className="flex items-end h-full overflow-x-auto scrollbar-none flex-1 gap-1 pt-1.5 pr-4">
          {tabs.map((tab, idx) => {
            const isActive = tab.id === activeTabId;
            const isModified = tab.content !== tab.savedContent;
            
            return (
              <div
                key={tab.id}
                draggable={renamingTabId !== tab.id}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                onMouseDown={(e) => handleMiddleClick(e, tab.id)}
                onClick={() => { if (renamingTabId !== tab.id) onSelectTab(tab.id); }}
                className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl text-xs font-medium border-t border-x transition-all cursor-pointer relative max-w-[180px] min-w-[100px] ${
                  isActive
                    ? 'bg-white dark:bg-[#1E1E1E] text-neutral-800 dark:text-white border-gray-200 dark:border-[#3F3F3F] z-10'
                    : 'bg-transparent text-gray-400 dark:text-neutral-400 border-transparent hover:bg-gray-150/40 dark:hover:bg-neutral-800/40 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-brand-azure' : 'text-gray-400'}`} />

                {/* Tab title — double-click to rename */}
                {renamingTabId === tab.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={commitTabRename}
                    onKeyDown={handleRenameKeyDown}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 min-w-0 bg-transparent border-b border-brand-azure text-xs outline-none text-neutral-800 dark:text-white"
                  />
                ) : (
                  <span
                    className="truncate flex-1 select-none pr-1"
                    onDoubleClick={isActive ? (e) => startTabRename(tab, e) : undefined}
                    title={isActive ? 'Double-click to rename' : tab.title}
                  >
                    {tab.title}
                  </span>
                )}
                
                {isModified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange flex-shrink-0 animate-pulse" title="Unsaved changes" />
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="w-4 h-4 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-white transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={onNewTab}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition mb-1"
            title="New Tab (Cmd+T)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Switching controls in Toolbar */}
        {activeTab && (
          <div className="flex items-center gap-4 pl-2">
            <div className="flex items-center gap-1.5 border border-gray-200 dark:border-[#3F3F3F] rounded-lg p-0.5 bg-white dark:bg-[#1E1E1E] shadow-sm select-none">
              <button
                onClick={() => onEditorModeChange('edit')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                  editorMode === 'edit'
                    ? 'bg-brand-azure text-white font-bold'
                    : 'text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-250'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => onEditorModeChange('preview')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                  editorMode === 'preview'
                    ? 'bg-brand-azure text-white font-bold'
                    : 'text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-250'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => onEditorModeChange('split')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                  editorMode === 'split'
                    ? 'bg-brand-azure text-white font-bold'
                    : 'text-gray-400 hover:text-neutral-700 dark:hover:text-neutral-250'
                }`}
              >
                Split
              </button>
            </div>

            <button
              onClick={onExportAsTxt}
              className="px-3 py-1.5 bg-brand-azure hover:bg-brand-azure/95 text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition"
              title="Export as Text File (Cmd+S)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export as .txt</span>
            </button>
          </div>
        )}
      </div>

      {/* Focus Mode Drag Header Bar (Feature 2) */}
      {focusMode && (
        <div 
          className="h-8 flex-shrink-0 flex items-center justify-center bg-transparent border-none text-[11px] text-gray-400 select-none relative"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <span className="font-semibold text-neutral-500 dark:text-neutral-450 tracking-wide uppercase">
            {activeTab ? activeTab.title : 'Focus Workspace'}
          </span>
        </div>
      )}

      {/* Find & Replace Sliding Panel (Feature 4) */}
      <div 
        className="transition-all duration-300 overflow-hidden flex-shrink-0 w-full"
        style={{
          height: findState.visible ? 'auto' : '0px',
          opacity: findState.visible ? 1 : 0
        }}
      >
        <FindReplace
          findState={findState}
          onUpdateState={(updates) => setFindState(prev => ({ ...prev, ...updates }))}
          onFindNext={handleFindNext}
          onFindPrev={handleFindPrev}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onClose={handleCloseFindReplace}
        />
      </div>

      {/* 2. Content Workspace Area */}
      <div className="flex-grow flex overflow-hidden relative">
        {activeTab ? (
          <>
            {/* Editor Pane (with scroll-synced backdrop layer) */}
            {(editorMode === 'edit' || editorMode === 'split') && (
              <div className="flex-1 h-full relative overflow-hidden">
                {/* Backdrop rendering layer */}
                <div 
                  ref={backdropRef}
                  className={`absolute inset-0 p-6 pointer-events-none overflow-auto select-none transition-colors duration-200 ${
                    wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
                  }`}
                  style={{
                    ...fontStyle,
                    paddingLeft: lineNumbersVisible ? '4rem' : '1.5rem',
                    paddingRight: '1.5rem',
                    paddingTop: '1.5rem',
                    paddingBottom: '1.5rem'
                  }}
                >
                  {linesData.map((line, idx) => (
                    <div 
                      key={idx} 
                      className={`flex min-h-[1.6em] relative border-l-2 ${
                        line.isCodeBlock 
                          ? 'bg-neutral-100/60 dark:bg-neutral-900/40 border-brand-azure' 
                          : 'border-transparent'
                      } ${
                        line.isFirstCodeLine ? 'rounded-t-lg border-t border-r border-[#3F3F3F] dark:border-[#3F3F3F]' : ''
                      } ${
                        line.isLastCodeLine ? 'rounded-b-lg border-b border-r border-[#3F3F3F] dark:border-[#3F3F3F]' : ''
                      } ${
                        line.isCodeBlock && !line.isFirstCodeLine && !line.isLastCodeLine ? 'border-r border-[#3F3F3F] dark:border-[#3F3F3F]' : ''
                      }`}
                    >
                      {lineNumbersVisible && (
                        <div 
                          style={{ width: '2.5rem', flexShrink: 0 }} 
                          className="text-right text-gray-400/40 pr-3 select-none font-mono"
                        >
                          {idx + 1}
                        </div>
                      )}
                      <div 
                        className="flex-grow whitespace-pre-wrap break-words pr-2 pl-2"
                        dangerouslySetInnerHTML={{ __html: line.html || '&nbsp;' }}
                      />
                      {line.isFirstCodeLine && line.codeBlockContent && line.codeBlockId && (
                        <button
                          type="button"
                          className="absolute right-3 top-1 px-1.5 py-0.5 text-[9px] font-bold bg-neutral-200/80 border border-gray-300 dark:bg-[#1E1E1E]/80 dark:border-[#3F3F3F] text-neutral-600 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-800 transition pointer-events-auto cursor-pointer"
                          onClick={() => handleCopyCodeBlock(line.codeBlockContent!, line.codeBlockId!)}
                        >
                          {copiedBlockId === line.codeBlockId ? 'Copied ✓' : 'Copy'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Raw Editable Textarea */}
                <textarea
                  ref={textareaRef}
                  value={activeTab.content}
                  onChange={handleTextareaChange}
                  onSelect={handleTextareaSelect}
                  onKeyUp={updateCursorPosition}
                  onMouseUp={updateCursorPosition}
                  onScroll={handleTextareaScroll}
                  spellCheck={spellCheck}
                  autoFocus
                  className={`absolute inset-0 p-6 outline-none bg-transparent text-transparent caret-neutral-850 dark:caret-white border-none select-text resize-none transition-colors duration-200 ${
                    wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
                  }`}
                  style={{
                    ...fontStyle,
                    paddingLeft: lineNumbersVisible ? '4rem' : '1.5rem',
                    paddingRight: '1.5rem',
                    paddingTop: '1.5rem',
                    paddingBottom: '1.5rem'
                  }}
                />
              </div>
            )}

            {/* Split view divider line */}
            {editorMode === 'split' && (
              <div className="w-px h-full bg-gray-200 dark:bg-[#3F3F3F] flex-shrink-0" />
            )}

            {/* Markdown Preview Pane */}
            {(editorMode === 'preview' || editorMode === 'split') && (
              <div 
                ref={previewContainerRef}
                className="flex-1 h-full p-6 overflow-auto bg-white dark:bg-[#1E1E1E] transition-colors duration-200 select-text prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200"
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} 
                  className="markdown-preview font-sans"
                />
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50/20 dark:bg-[#1E1E1E] text-center p-8 select-none fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-azure/5 border border-brand-azure/10 flex items-center justify-center mb-5 text-brand-azure/80 shadow-inner">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-1.5 font-sans">No Document Selected</h3>
            <p className="text-xs text-gray-400 dark:text-neutral-400 max-w-xs mb-5 font-sans">
              Select a project document from the sidebar library or create a new tab to start writing.
            </p>
            <button
              onClick={onNewTab}
              className="px-4 py-2 bg-brand-azure hover:bg-brand-azure/90 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-azure/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 font-sans"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Exit Button for Focus Mode */}
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          className="absolute right-6 top-6 px-3.5 py-2 text-[10px] font-bold tracking-wider uppercase bg-white/90 dark:bg-[#2D2D2D]/90 border border-gray-200 dark:border-[#3F3F3F] text-neutral-600 dark:text-neutral-350 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl shadow-lg transition-all duration-300 pointer-events-auto cursor-pointer z-50 opacity-0 hover:opacity-100"
        >
          Exit Focus Mode (Esc)
        </button>
      )}

      {/* Tag input and coloredbadges (Feature 17) */}
      {activeTab && !focusMode && (
        <div className="px-6 py-2 border-t border-gray-200 dark:border-[#3F3F3F] bg-gray-50/20 dark:bg-[#2D2D2D]/10 flex flex-wrap items-center gap-2 select-none flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 font-sans">Tags:</span>
          {tags.map((tag) => {
            const color = getTagColor(tag);
            return (
              <span 
                key={tag} 
                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 border transition-all ${color.bg} ${color.text} ${color.border}`}
              >
                <span>{tag}</span>
                <button 
                  onClick={() => onUpdateTags(tags.filter(t => t !== tag))}
                  className="hover:text-red-500 transition cursor-pointer font-bold text-xs"
                >
                  &times;
                </button>
              </span>
            );
          })}
          <input
            type="text"
            placeholder="Add #tag..."
            className="px-2 py-0.5 text-xs bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3F3F3F] rounded-lg outline-none text-neutral-800 dark:text-neutral-200 focus:border-brand-azure dark:focus:border-brand-azure transition-colors max-w-[120px] font-sans"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                let val = e.currentTarget.value.trim();
                if (!val) return;
                if (!val.startsWith('#')) val = '#' + val;
                if (!tags.includes(val)) {
                  onUpdateTags([...tags, val]);
                }
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      )}

      {/* 3. Footer Status Bar — Hidden in Focus Mode */}
      {activeTab && (
        <div 
          className="border-t border-gray-200 dark:border-[#3F3F3F] bg-gray-50/50 dark:bg-[#2D2D2D]/10 px-4 flex items-center justify-between text-[11px] text-gray-400 dark:text-neutral-400 select-none transition-all duration-500 overflow-hidden flex-shrink-0"
          style={{
            height: focusMode ? '0px' : '2rem',
            opacity: focusMode ? 0 : 1,
            pointerEvents: focusMode ? 'none' : 'auto'
          }}
        >
          <div className="flex items-center gap-4">
            <span className="font-mono">
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="w-px h-3 bg-gray-250 dark:bg-[#3F3F3F]" />
            <span>
              {selectedWords > 0 ? (
                <span className="font-semibold text-brand-azure">Selected: {selectedWords} words, {selectedChars} chars</span>
              ) : (
                <span>{counts.words} words, {counts.chars} chars, {counts.lines} lines</span>
              )}
            </span>
            {saveStatus && (
              <>
                <span className="w-px h-3 bg-gray-250 dark:bg-[#3F3F3F]" />
                {saveStatus === 'saving' && (
                  <span className="text-amber-500 font-semibold animate-pulse">Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-emerald-500 font-semibold">Saved ✓</span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="text-amber-500 font-semibold animate-pulse">Unsaved changes</span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Font Size Display */}
            <span className="font-mono text-[10px]">
              Size: {fontSize}px
            </span>

            <span className="w-px h-3 bg-gray-250 dark:bg-[#3F3F3F]" />

            <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-200 transition">
              <input
                type="checkbox"
                checked={wordWrap}
                onChange={onToggleWordWrap}
                className="w-3.5 h-3.5 rounded-md border-gray-300 dark:border-[#3F3F3F] text-brand-azure focus:ring-brand-azure"
              />
              <span>Word Wrap</span>
            </label>

            <span className="w-px h-3 bg-gray-250 dark:bg-[#3F3F3F]" />

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => onZoomChange(Math.max(zoomLevel - 10, 50))}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="w-9 text-center font-mono tabular-nums">{zoomLevel}%</span>
              <button 
                onClick={() => onZoomChange(Math.min(zoomLevel + 10, 200))}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
