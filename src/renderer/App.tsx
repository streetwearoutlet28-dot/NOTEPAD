import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { Folder, Plus } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Editor, { Tab } from './components/Editor';
import Settings, { UserProfile } from './components/Settings';
import ProjectRoadmap from './components/ProjectRoadmap';
import ThemeCapsule from './components/ThemeCapsule';
import AppIdeasPanel from './components/AppIdeas/AppIdeasPanel';
import { AppIdea } from './components/AppIdeas/types';
import {
  loadAllData,
  savePreferences,
  saveNote,
  deleteNote,
  saveProject,
  deleteProject as dbDeleteProject,
  saveAppIdea,
  deleteAppIdea,
  subscribeToAll,
  DBNote,
  DBProject,
  DBAppIdea,
  DBPreferences,
} from '../lib/db';

interface ProjectStep {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface DocumentModel {
  id: string;
  title: string;
  projectId: string | null;
  content: string;
  savedContent: string;
  filePath: string | null;
  tags?: string[];
  pinned?: boolean;
}

interface ProjectModel {
  id: string;
  name: string;
  steps: ProjectStep[];
}

const defaultUsers: UserProfile[] = [
  { id: '1', name: 'Arthur Taylor', email: 'arthur@notepad.com', initials: 'AT' }
];

const defaultProjects: ProjectModel[] = [
  { 
    id: 'proj-default', 
    name: 'My First Project',
    steps: [
      { id: 'step-1', text: 'Create draft outline', isCompleted: true },
      { id: 'step-2', text: 'Write core text specifications', isCompleted: false },
      { id: 'step-3', text: 'Export note as text file', isCompleted: false }
    ]
  }
];

const defaultDocuments: DocumentModel[] = [
  {
    id: 'doc-intro',
    title: 'Getting Started.txt',
    projectId: 'proj-default',
    content: 'Welcome to Notepad by Flo! This is a production-ready plain text desktop workspace built with React, TypeScript, and Tailwind CSS.\n\nKey features:\n1. Dynamic Projects on the left sidebar (add projects, delete projects, add notes inside specific projects).\n2. Unblocked live-typing editor interface with live word & character counters.\n3. Native text downloader & file exporter (Cmd+S or "Export as .txt" button).\n4. Persistent store settings (Language, timezones, themes, active profiles).\n5. Full user profile CRUD management.\n\nSelect Settings in the bottom-left corner to manage options.',
    savedContent: 'Welcome to Notepad by Flo! This is a production-ready plain text desktop workspace built with React, TypeScript, and Tailwind CSS.\n\nKey features:\n1. Dynamic Projects on the left sidebar (add projects, delete projects, add notes inside specific projects).\n2. Unblocked live-typing editor interface with live word & character counters.\n3. Native text downloader & file exporter (Cmd+S or "Export as .txt" button).\n4. Persistent store settings (Language, timezones, themes, active profiles).\n5. Full user profile CRUD management.\n\nSelect Settings in the bottom-left corner to manage options.',
    filePath: null
  }
];

const defaultTabs: Tab[] = [
  {
    id: 'doc-intro',
    title: 'Getting Started.txt',
    filePath: null,
    content: 'Welcome to Notepad by Flo! This is a production-ready plain text desktop workspace built with React, TypeScript, and Tailwind CSS.\n\nKey features:\n1. Dynamic Projects on the left sidebar (add projects, delete projects, add notes inside specific projects).\n2. Unblocked live-typing editor interface with live word & character counters.\n3. Native text downloader & file exporter (Cmd+S or "Export as .txt" button).\n4. Persistent store settings (Language, timezones, themes, active profiles).\n5. Full user profile CRUD management.\n\nSelect Settings in the bottom-left corner to manage options.',
    savedContent: 'Welcome to Notepad by Flo! This is a production-ready plain text desktop workspace built with React, TypeScript, and Tailwind CSS.\n\nKey features:\n1. Dynamic Projects on the left sidebar (add projects, delete projects, add notes inside specific projects).\n2. Unblocked live-typing editor interface with live word & character counters.\n3. Native text downloader & file exporter (Cmd+S or "Export as .txt" button).\n4. Persistent store settings (Language, timezones, themes, active profiles).\n5. Full user profile CRUD management.\n\nSelect Settings in the bottom-left corner to manage options.',
    projectId: 'proj-default'
  }
];

const mockWorkspaces = [
  { id: 'notepad-by-flo', name: 'Notepad by Flo' }
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'workspace' | 'settings' | 'app-ideas'>('workspace');
  const activeWorkspaceId = 'notepad-by-flo';
  const [searchQuery, setSearchQuery] = useState('');

  // Core Projects & Documents State Database
  const [projects, setProjects] = useState<ProjectModel[]>(defaultProjects);
  const [documents, setDocuments] = useState<DocumentModel[]>(defaultDocuments);
  const [activeProjectId, setActiveProjectId] = useState<string | null>('proj-default');

  // Tabbed Workspace states
  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const [activeTabId, setActiveTabId] = useState<string | null>('doc-intro');

  // User CRUD states
  const [users, setUsers] = useState<UserProfile[]>(defaultUsers);
  const [activeUserId, setActiveUserId] = useState<string>('1');

  // App Ideas states
  const [appIdeas, setAppIdeas] = useState<AppIdea[]>([]);
  const [activeAppIdeaId, setActiveAppIdeaId] = useState<string | null>(null);

  // General Preferences States
  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('GMT+02:00');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system' | 'sepia' | 'midnight'>('system');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [wordWrap, setWordWrap] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);

  // New features preferences states
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fontFamily, setFontFamily] = useState('System Default');
  const [lineNumbersVisible, setLineNumbersVisible] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [pinnedDocs, setPinnedDocs] = useState<string[]>([]);
  const [docsOrder, setDocsOrder] = useState<string[]>([]);
  const [projectsOrder, setProjectsOrder] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'unsaved' | null>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('edit');

  // Floating Capsule state
  const [capsuleVisible, setCapsuleVisible] = useState(false);

  // Derived states (Temporal Dead Zone safe definitions)
  const activeTab = tabs.find(t => t.id === activeTabId) || null;
  const activeUser = users.find(u => u.id === activeUserId) || users[0] || defaultUsers[0];
  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // 1. Load settings and documents — Firestore first, electron-store as fallback
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try Firestore first (returns null if not configured or offline)
        const firestoreData = await loadAllData();

        if (firestoreData) {
          // ── Firestore loaded successfully ──
          const { preferences: p, notes, projects: projs, appIdeas: ideas } = firestoreData;

          if (p.theme) setTheme(p.theme as any);
          if (p.zoomLevel) setZoomLevel(p.zoomLevel);
          if (p.language) setLanguage(p.language);
          if (p.timezone) setTimezone(p.timezone);
          if (p.timeFormat) setTimeFormat(p.timeFormat as any);
          if (p.dateFormat) setDateFormat(p.dateFormat);
          if (p.wordWrap !== undefined) setWordWrap(p.wordWrap);
          if (p.spellCheck !== undefined) setSpellCheck(p.spellCheck);
          if (p.users && p.users.length > 0) setUsers(p.users);
          if (p.activeUserId) setActiveUserId(p.activeUserId);
          if (p.activeProjectId !== undefined) setActiveProjectId(p.activeProjectId);

          // Load new features states
          if ((p as any).fontSize) setFontSize((p as any).fontSize);
          if ((p as any).lineHeight) setLineHeight((p as any).lineHeight);
          if ((p as any).fontFamily) setFontFamily((p as any).fontFamily);
          if ((p as any).lineNumbersVisible !== undefined) setLineNumbersVisible((p as any).lineNumbersVisible);
          if ((p as any).focusMode !== undefined) setFocusMode((p as any).focusMode);
          if ((p as any).customTemplates) setCustomTemplates((p as any).customTemplates);
          if ((p as any).pinnedDocs) setPinnedDocs((p as any).pinnedDocs);
          if ((p as any).docsOrder) setDocsOrder((p as any).docsOrder);
          if ((p as any).projectsOrder) setProjectsOrder((p as any).projectsOrder);

          if (projs.length > 0) {
            const migrated = projs.map((proj: any) => ({
              ...proj,
              steps: Array.isArray(proj.steps) ? proj.steps : [],
            }));
            setProjects(migrated);
          }

          if (notes.length > 0) {
            setDocuments(notes as any);
          }

          if (p.tabs && p.tabs.length > 0) {
            setTabs(p.tabs);
            if (p.activeTabId && p.tabs.some((t: Tab) => t.id === p.activeTabId)) {
              setActiveTabId(p.activeTabId);
            } else {
              setActiveTabId(p.tabs[0].id);
            }
          }

          if (ideas.length > 0) setAppIdeas(ideas as AppIdea[]);
          if (p.activeAppIdeaId !== undefined) setActiveAppIdeaId(p.activeAppIdeaId);

        } else {
          // ── Firestore unavailable — fall back to electron-store / localStorage ──
          let store: any = null;
          if (window.electron) {
            store = await window.electron.storeGetStore();
          } else {
            const localData = localStorage.getItem('notepad_store');
            if (localData) {
              try { store = JSON.parse(localData); } catch (e) {}
            }
          }

          if (store) {
            if (store.theme) setTheme(store.theme);
            if (store.zoomLevel) setZoomLevel(store.zoomLevel);
            if (store.language) setLanguage(store.language);
            if (store.timezone) setTimezone(store.timezone);
            if (store.timeFormat) setTimeFormat(store.timeFormat);
            if (store.dateFormat) setDateFormat(store.dateFormat);
            if (store.wordWrap !== undefined) setWordWrap(store.wordWrap);
            if (store.spellCheck !== undefined) setSpellCheck(store.spellCheck);
            if (store.users && store.users.length > 0) setUsers(store.users);
            if (store.activeUserId) setActiveUserId(store.activeUserId);

            // Load new features states
            if (store.fontSize) setFontSize(store.fontSize);
            if (store.lineHeight) setLineHeight(store.lineHeight);
            if (store.fontFamily) setFontFamily(store.fontFamily);
            if (store.lineNumbersVisible !== undefined) setLineNumbersVisible(store.lineNumbersVisible);
            if (store.focusMode !== undefined) setFocusMode(store.focusMode);
            if (store.customTemplates) setCustomTemplates(store.customTemplates);
            if (store.pinnedDocs) setPinnedDocs(store.pinnedDocs);
            if (store.docsOrder) setDocsOrder(store.docsOrder);
            if (store.projectsOrder) setProjectsOrder(store.projectsOrder);

            if (store.projects && store.projects.length > 0) {
              const migratedProjects = store.projects.map((p: any) => ({
                ...p,
                steps: Array.isArray(p.steps) ? p.steps : [],
              }));
              setProjects(migratedProjects);
            }
            if (store.activeProjectId) setActiveProjectId(store.activeProjectId);
            if (store.documents && store.documents.length > 0) setDocuments(store.documents);
            if (store.tabs && store.tabs.length > 0) {
              setTabs(store.tabs);
              if (store.activeTabId && store.tabs.some((t: Tab) => t.id === store.activeTabId)) {
                setActiveTabId(store.activeTabId);
              } else {
                setActiveTabId(store.tabs[0].id);
              }
            }
            if (store.appIdeas && store.appIdeas.length > 0) setAppIdeas(store.appIdeas);
            if (store.activeAppIdeaId) setActiveAppIdeaId(store.activeAppIdeaId);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 2. Debounced save — writes to electron-store (local cache) AND Firestore (sync)
  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      // ── Preferences object for Firestore ──
      const prefs = {
        theme, zoomLevel, language, timezone, timeFormat, dateFormat,
        wordWrap, spellCheck, users, activeUserId, activeProjectId,
        activeTabId, activeAppIdeaId, tabs,
        fontSize, lineHeight, fontFamily, lineNumbersVisible, focusMode,
        customTemplates, pinnedDocs, docsOrder, projectsOrder,
      };

      // Always write to electron-store as local cache / fallback
      if (window.electron) {
        window.electron.storeSet('theme', theme);
        window.electron.storeSet('zoomLevel', zoomLevel);
        window.electron.storeSet('language', language);
        window.electron.storeSet('timezone', timezone);
        window.electron.storeSet('timeFormat', timeFormat);
        window.electron.storeSet('dateFormat', dateFormat);
        window.electron.storeSet('wordWrap', wordWrap);
        window.electron.storeSet('spellCheck', spellCheck);
        window.electron.storeSet('users', users);
        window.electron.storeSet('activeUserId', activeUserId);
        window.electron.storeSet('projects', projects);
        window.electron.storeSet('activeProjectId', activeProjectId);
        window.electron.storeSet('documents', documents);
        window.electron.storeSet('tabs', tabs);
        window.electron.storeSet('activeTabId', activeTabId);
        window.electron.storeSet('appIdeas', appIdeas);
        window.electron.storeSet('activeAppIdeaId', activeAppIdeaId);

        // New features
        window.electron.storeSet('fontSize', fontSize);
        window.electron.storeSet('lineHeight', lineHeight);
        window.electron.storeSet('fontFamily', fontFamily);
        window.electron.storeSet('lineNumbersVisible', lineNumbersVisible);
        window.electron.storeSet('focusMode', focusMode);
        window.electron.storeSet('customTemplates', customTemplates);
        window.electron.storeSet('pinnedDocs', pinnedDocs);
        window.electron.storeSet('docsOrder', docsOrder);
        window.electron.storeSet('projectsOrder', projectsOrder);
      } else {
        localStorage.setItem('notepad_store', JSON.stringify({
          theme, zoomLevel, language, timezone, timeFormat, dateFormat,
          wordWrap, spellCheck, users, activeUserId, projects, activeProjectId,
          documents, tabs, activeTabId, appIdeas, activeAppIdeaId,
          fontSize, lineHeight, fontFamily, lineNumbersVisible, focusMode,
          customTemplates, pinnedDocs, docsOrder, projectsOrder
        }));
      }

      // Also write to Firestore (no-op if not configured)
      savePreferences(prefs);
      projects.forEach(p => saveProject(p as any));
      appIdeas.forEach(idea => saveAppIdea(idea as any));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [theme, zoomLevel, language, timezone, timeFormat, dateFormat, wordWrap, spellCheck, users, activeUserId, projects, activeProjectId, documents, tabs, activeTabId, appIdeas, activeAppIdeaId, fontSize, lineHeight, fontFamily, lineNumbersVisible, focusMode, customTemplates, pinnedDocs, docsOrder, projectsOrder, loading]);

  // 2b. Real-time Firestore listeners — push remote changes to React state
  useEffect(() => {
    if (loading) return;
    const unsubscribe = subscribeToAll({
      onNotesChange: (notes: DBNote[]) => {
        setDocuments(prev => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(notes);
          return prevStr === nextStr ? prev : (notes as any);
        });
      },
      onProjectsChange: (projs: DBProject[]) => {
        setProjects(prev => {
          const migrated = projs.map((p: DBProject) => ({
            ...p,
            steps: Array.isArray(p.steps) ? p.steps : [],
          }));
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(migrated);
          return prevStr === nextStr ? prev : (migrated as any);
        });
      },
      onAppIdeasChange: (ideas: DBAppIdea[]) => {
        setAppIdeas(prev => {
          const prevStr = JSON.stringify(prev);
          const nextStr = JSON.stringify(ideas);
          return prevStr === nextStr ? prev : (ideas as AppIdea[]);
        });
      },
      onPreferencesChange: (p: DBPreferences) => {
        if (p.theme) setTheme(p.theme as any);
        if (p.zoomLevel) setZoomLevel(p.zoomLevel);
        if (p.language) setLanguage(p.language);
        if (p.wordWrap !== undefined) setWordWrap(p.wordWrap);
        if (p.spellCheck !== undefined) setSpellCheck(p.spellCheck);
        
        // Remote sync new preferences
        if ((p as any).fontSize) setFontSize((p as any).fontSize);
        if ((p as any).lineHeight) setLineHeight((p as any).lineHeight);
        if ((p as any).fontFamily) setFontFamily((p as any).fontFamily);
        if ((p as any).lineNumbersVisible !== undefined) setLineNumbersVisible((p as any).lineNumbersVisible);
        if ((p as any).focusMode !== undefined) setFocusMode((p as any).focusMode);
      },
    });
    return () => unsubscribe();
  }, [loading]);

  // 2c. Debounced save for documents content changes (500ms)
  useEffect(() => {
    if (loading) return;
    
    // Find if there are unsaved documents
    const unsavedDocs = documents.filter(d => d.content !== d.savedContent);
    if (unsavedDocs.length === 0) return;
    
    const timeout = setTimeout(async () => {
      try {
        const promises = unsavedDocs.map(async (doc) => {
          saveNote(doc as any);
          return doc.id;
        });
        
        await Promise.all(promises);
        
        // Update savedContent to match content in local state
        setDocuments(prev => prev.map(d => {
          const unsaved = unsavedDocs.find(ud => ud.id === d.id);
          return unsaved ? { ...d, savedContent: d.content } : d;
        }));
        setTabs(prev => prev.map(t => {
          const unsaved = unsavedDocs.find(ud => ud.id === t.id);
          return unsaved ? { ...t, savedContent: t.content } : t;
        }));
        
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to auto-save documents:', err);
        setSaveStatus('unsaved');
      }
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [documents, loading]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const t = setTimeout(() => setSaveStatus(null), 3000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

  // 3. Sync window title (Mac OS Style)
  useEffect(() => {
    const isModified = activeTab && activeTab.content !== activeTab.savedContent;
    const titleStr = activeTab 
      ? `${isModified ? '• ' : ''}${activeTab.title} — Notepad by Flo` 
      : activeProject
        ? `${activeProject.name} — Project Roadmap`
        : 'Notepad by Flo';
    if (window.electron) {
      window.electron.setTitle(titleStr);
    } else {
      document.title = titleStr;
    }
  }, [activeTab?.title, activeTab?.content, activeTab?.savedContent, activeProject?.name]);

  // Helper to escape HTML tags in strings
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Feature 18: Export to PDF
  const handleExportPDF = async () => {
    if (!activeTab) return;
    
    let htmlContent = '';
    const isMarkdown = activeTab.title.endsWith('.md') || activeTab.title.endsWith('.txt');
    
    if (isMarkdown) {
      try {
        htmlContent = marked.parse(activeTab.content) as string;
      } catch (e) {
        htmlContent = escapeHtml(activeTab.content);
      }
    } else {
      htmlContent = `<pre><code>${escapeHtml(activeTab.content)}</code></pre>`;
    }
    
    setSaveStatus('saving');
    const success = await window.electron.exportPDF(htmlContent, activeTab.title);
    if (success) {
      setSaveStatus('saved');
    } else {
      setSaveStatus('unsaved');
    }
  };

  // 4. Set theme class in document element
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  // 5b. Keyboard Shortcuts Listener (Features 2, 4, 9, 10, 11, 13, 18)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Focus Mode: Cmd+Shift+F
      if (cmdCtrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFocusMode(prev => !prev);
      }

      // Markdown Preview Toggle: Cmd+Shift+P
      if (cmdCtrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setEditorMode(m => m === 'preview' ? 'edit' : 'preview');
      }

      // Line Numbers: Cmd+Shift+L
      if (cmdCtrl && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setLineNumbersVisible(prev => !prev);
      }

      // Theme Cycle: Cmd+Shift+T
      if (cmdCtrl && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        const themes: ('light' | 'dark' | 'sepia' | 'midnight')[] = ['dark', 'light', 'sepia', 'midnight'];
        setTheme(current => {
          const nextIndex = (themes.indexOf(current as any) + 1) % themes.length;
          const nextTheme = themes[nextIndex === -1 ? 0 : nextIndex];
          handleThemeChange(nextTheme);
          return nextTheme as any;
        });
      }

      // Export to PDF: Cmd+Shift+E
      if (cmdCtrl && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExportPDF();
      }

      // Find & Replace: Cmd+H
      if (cmdCtrl && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
      }

      // Font Size: Cmd++ (or Cmd+=) and Cmd+-
      if (cmdCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setFontSize(sz => Math.min(32, sz + 2));
      }
      if (cmdCtrl && e.key === '-') {
        e.preventDefault();
        setFontSize(sz => Math.max(10, sz - 2));
      }

      // Esc key behavior: close find/replace if open, otherwise exit focus mode
      if (e.key === 'Escape') {
        if (showFindReplace) {
          e.preventDefault();
          setShowFindReplace(false);
        } else if (focusMode) {
          e.preventDefault();
          setFocusMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFindReplace, focusMode, activeTab, customTemplates]);

  // 5. Handle Electron IPC Native Menu events
  useEffect(() => {
    if (!window.electron) return;

    const unsubscribeClose = window.electron.onWindowCloseRequest(() => {
      const modifiedTabs = tabs.filter(t => t.content !== t.savedContent);
      if (modifiedTabs.length > 0) {
        const confirmed = window.confirm(
          `You have ${modifiedTabs.length} document(s) with unsaved changes. Are you sure you want to exit?`
        );
        if (!confirmed) return;
      }
      window.electron.closeWindow();
    });

    const handleMenuAction = (action: string) => {
      switch (action) {
        case 'new-tab':
          handleNewFloatingDoc();
          break;
        case 'open-file':
          handleOpenFile();
          break;
        case 'save-file':
          handleSaveFile();
          break;
        case 'save-as-file':
          handleSaveAsFile();
          break;
        case 'close-tab':
          if (activeTabId) handleCloseTab(activeTabId);
          break;
        case 'zoom-in':
          setZoomLevel(z => Math.min(z + 10, 200));
          break;
        case 'zoom-out':
          setZoomLevel(z => Math.max(z - 10, 50));
          break;
        case 'zoom-reset':
          setZoomLevel(100);
          break;
        case 'toggle-word-wrap':
          setWordWrap(w => !w);
          break;
        case 'spellcheck-on':
          setSpellCheck(true);
          break;
        case 'spellcheck-off':
          setSpellCheck(false);
          break;
        case 'theme-light':
          handleThemeChange('light');
          break;
        case 'theme-dark':
          handleThemeChange('dark');
          break;
        case 'theme-system':
          handleThemeChange('system');
          break;
        case 'show-font-dialog':
          setCurrentView('settings');
          break;
        case 'find':
        case 'replace':
          setShowFindReplace(true);
          break;
        default:
          break;
      }
    };

    const unsubscribeMenu = window.electron.onMenuAction(handleMenuAction);

    return () => {
      unsubscribeClose();
      unsubscribeMenu();
    };
  }, [tabs, activeTabId, theme, zoomLevel, documents, projects]);

  // Document & Tab Operation Handlers
  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    // Find parent project of this tab if any and set activeProjectId
    const doc = documents.find(d => d.id === tabId);
    if (doc && doc.projectId) {
      setActiveProjectId(doc.projectId);
    }
    setCurrentView('workspace');
  };

  const handleSelectProject = (projectId: string | null) => {
    setActiveProjectId(projectId);
    setActiveTabId(null); // display project roadmap
    setCurrentView('workspace');
  };

  const handleNewTab = () => {
    handleNewFloatingDoc();
  };

  const handleNewFloatingDoc = () => {
    const newId = 'doc-' + Date.now();
    const newDoc: DocumentModel = {
      id: newId,
      title: `Draft ${documents.filter(d => d.projectId === null).length + 1}.txt`,
      projectId: null,
      content: '',
      savedContent: '',
      filePath: null
    };

    setDocuments(prev => [...prev, newDoc]);
    
    // Open in Tab
    const newTab: Tab = {
      id: newId,
      title: newDoc.title,
      filePath: null,
      content: '',
      savedContent: '',
      projectId: null
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setCurrentView('workspace');
  };

  const handleNewDocInProject = (projectId: string) => {
    const projectDocs = documents.filter(d => d.projectId === projectId);
    
    const newId = 'doc-' + Date.now();
    const newDoc: DocumentModel = {
      id: newId,
      title: `Untitled Note ${projectDocs.length + 1}.txt`,
      projectId,
      content: '',
      savedContent: '',
      filePath: null
    };

    setDocuments(prev => [...prev, newDoc]);

    // Open in Tab
    const newTab: Tab = {
      id: newId,
      title: newDoc.title,
      filePath: null,
      content: '',
      savedContent: '',
      projectId
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setCurrentView('workspace');
  };

  const handleOpenFile = async () => {
    if (!window.electron) {
      alert('Native file opening is only available in the Desktop App.');
      return;
    }
    const result = await window.electron.fileOpen();
    if (result) {
      const { filePath, content } = result;
      const title = filePath.split('/').pop() || 'Untitled.txt';
      
      // Check if already in documents list
      let doc = documents.find(d => d.filePath === filePath);
      if (!doc) {
        doc = {
          id: 'doc-' + Date.now(),
          title,
          projectId: activeProjectId, // open inside currently active project if any
          content,
          savedContent: content,
          filePath
        };
        setDocuments(prev => [...prev, doc as DocumentModel]);
      }

      // Check if already open in tabs
      const existingTab = tabs.find(t => t.id === doc?.id);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        setCurrentView('workspace');
        return;
      }

      // Open new tab
      const newTab: Tab = {
        id: doc.id,
        title: doc.title,
        filePath: doc.filePath,
        content: doc.content,
        savedContent: doc.savedContent,
        projectId: doc.projectId
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(doc.id);
      setCurrentView('workspace');
    }
  };

  const handleSaveFile = async () => {
    if (!activeTab) return;
    if (!window.electron) {
      // In web browser fallback, trigger a native web file download
      const blob = new Blob([activeTab.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeTab.title;
      link.click();
      URL.revokeObjectURL(url);
      
      // Update savedContent to mark it as saved
      setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, savedContent: t.content } : t));
      setDocuments(prev => prev.map(d => d.id === activeTab.id ? { ...d, content: activeTab.content, savedContent: activeTab.content } : d));
      return;
    }
    if (activeTab.filePath) {
      const success = await window.electron.fileSave(activeTab.filePath, activeTab.content);
      if (success) {
        setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, savedContent: t.content } : t));
        setDocuments(prev => prev.map(d => d.id === activeTab.id ? { ...d, content: activeTab.content, savedContent: activeTab.content } : d));
      }
    } else {
      await handleSaveAsFile();
    }
  };

  const handleSaveAsFile = async () => {
    if (!activeTab) return;
    if (!window.electron) {
      // In web browser fallback, trigger a web download
      const blob = new Blob([activeTab.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeTab.title;
      link.click();
      URL.revokeObjectURL(url);
      
      // Update savedContent to mark it as saved
      setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, savedContent: t.content } : t));
      setDocuments(prev => prev.map(d => d.id === activeTab.id ? { ...d, content: activeTab.content, savedContent: activeTab.content } : d));
      return;
    }
    const result = await window.electron.fileSaveAs(activeTab.content, activeTab.title);
    if (result) {
      const { filePath } = result;
      const title = filePath.split('/').pop() || 'Untitled.txt';
      
      setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, title, filePath, savedContent: t.content } : t));
      setDocuments(prev => prev.map(d => d.id === activeTab.id ? { ...d, title, filePath, content: activeTab.content, savedContent: activeTab.content } : d));
    }
  };

  const handleCloseTab = (id: string) => {
    const tabToClose = tabs.find(t => t.id === id);
    if (!tabToClose) return;
    const isModified = tabToClose.content !== tabToClose.savedContent;

    const performClose = () => {
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) {
        if (newTabs.length > 0) {
          const closedIdx = tabs.findIndex(t => t.id === id);
          const nextActiveIdx = Math.min(closedIdx, newTabs.length - 1);
          handleSelectTab(newTabs[nextActiveIdx].id);
        } else {
          setActiveTabId(null);
        }
      }
    };

    if (isModified) {
      const confirmed = window.confirm(`"${tabToClose.title}" has unsaved changes. Are you sure you want to close it?`);
      if (confirmed) {
        performClose();
      }
    } else {
      performClose();
    }
  };

  const handleReorderTabs = (draggedIndex: number, targetIndex: number) => {
    const updated = [...tabs];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);
    setTabs(updated);
  };

  const handleContentChange = (newContent: string) => {
    if (activeTabId) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: newContent } : t));
      setDocuments(prev => prev.map(d => d.id === activeTabId ? { ...d, content: newContent } : d));
    }
  };

  const handleDeleteDoc = (id: string) => {
    deleteNote(id); // immediate Firestore delete
    setDocuments(prev => prev.filter(d => d.id !== id));
    // Also remove from tabs if open
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id) {
      const remainingTabs = tabs.filter(t => t.id !== id);
      if (remainingTabs.length > 0) {
        handleSelectTab(remainingTabs[0].id);
      } else {
        setActiveTabId(null);
      }
    }
  };

  const handleRenameDoc = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, title: trimmed } : d));
    setTabs(prev => prev.map(t => t.id === id ? { ...t, title: trimmed } : t));
  };

  // Feature 6: Toggle Pin Document
  const handleTogglePinDoc = (docId: string) => {
    setPinnedDocs(prev => {
      const isPinned = prev.includes(docId);
      const next = isPinned ? prev.filter(id => id !== docId) : [...prev, docId];
      if (window.electron) {
        window.electron.storeSet('pinnedDocs', next);
      }
      return next;
    });
  };

  // Feature 7: Duplicate Note
  const handleDuplicateDoc = (docId: string) => {
    const docToCopy = documents.find(d => d.id === docId);
    if (!docToCopy) return;

    const newId = 'doc-' + Date.now();
    const extIndex = docToCopy.title.lastIndexOf('.');
    const titleBase = extIndex !== -1 ? docToCopy.title.substring(0, extIndex) : docToCopy.title;
    const ext = extIndex !== -1 ? docToCopy.title.substring(extIndex) : '';
    const newTitle = `Copy of ${titleBase}${ext}`;

    const duplicatedDoc: DocumentModel = {
      ...docToCopy,
      id: newId,
      title: newTitle,
      savedContent: '',
      tags: docToCopy.tags ? [...docToCopy.tags] : [],
    };

    setDocuments(prev => {
      const idx = prev.findIndex(d => d.id === docId);
      const next = [...prev];
      if (idx !== -1) {
        next.splice(idx + 1, 0, duplicatedDoc);
      } else {
        next.push(duplicatedDoc);
      }
      return next;
    });

    const newTab: Tab = {
      id: newId,
      title: newTitle,
      filePath: null,
      content: docToCopy.content,
      savedContent: '',
      projectId: docToCopy.projectId,
      tags: docToCopy.tags ? [...docToCopy.tags] : [],
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setRenamingDocId(newId);
    setCurrentView('workspace');
  };

  // Feature 8: Create Note from Template
  const handleNewFromTemplate = (templateName: string, projectId: string | null = null) => {
    let content = '';
    const dateStr = new Date().toLocaleDateString();

    switch (templateName) {
      case 'Meeting Notes':
        content = `# Meeting Notes\n**Date:** ${dateStr}\n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n- \n\n## Action Items\n- [ ] \n`;
        break;
      case 'To-Do List':
        content = `# To-Do List\n- [ ] High Priority Task\n- [ ] Medium Priority Task\n- [ ] Low Priority Task\n`;
        break;
      case 'App Idea':
        content = `# App Idea: [App Name]\n\n## Description\n\n## Core Features\n- \n\n## Target Audience\n\n## Notes\n`;
        break;
      case 'Daily Journal':
        content = `# Daily Journal — ${dateStr}\n**Mood:** \n\n## Today's Highlights\n- \n\n## Reflection\n`;
        break;
      case 'Blank':
      default:
        content = '';
        break;
    }

    const custom = customTemplates.find(t => t.name === templateName);
    if (custom) {
      content = custom.content;
    }

    const newId = 'doc-' + Date.now();
    const newDoc: DocumentModel = {
      id: newId,
      title: `${templateName} ${documents.filter(d => d.projectId === projectId).length + 1}.txt`,
      projectId,
      content,
      savedContent: '',
      filePath: null,
      tags: []
    };

    setDocuments(prev => [...prev, newDoc]);

    const newTab: Tab = {
      id: newId,
      title: newDoc.title,
      filePath: null,
      content,
      savedContent: '',
      projectId,
      tags: []
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setRenamingDocId(newId);
    setCurrentView('workspace');
  };

  // Save current note as template
  const handleSaveAsTemplate = (docId: string) => {
    const docToSave = documents.find(d => d.id === docId);
    if (!docToSave) return;
    const name = prompt('Enter a name for this custom template:', docToSave.title.replace(/\.[^/.]+$/, ""));
    if (!name || !name.trim()) return;

    setCustomTemplates(prev => {
      const next = [...prev.filter(t => t.name !== name), { name: name.trim(), content: docToSave.content }];
      if (window.electron) {
        window.electron.storeSet('customTemplates', next);
      }
      return next;
    });
  };

  // Feature 17: Update Tags
  const handleUpdateTags = (docId: string, tags: string[]) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, tags } : d));
    setTabs(prev => prev.map(t => t.id === docId ? { ...t, tags } : t));
  };

  // Feature 5: Drag and Drop Reordering
  const handleReorderDocs = (reorderedIds: string[]) => {
    setDocsOrder(reorderedIds);
    if (window.electron) {
      window.electron.storeSet('docsOrder', reorderedIds);
    }
  };

  // Projects Administration Handlers
  const handleAddProject = (name: string) => {
    const newProj: ProjectModel = {
      id: 'proj-' + Date.now(),
      name,
      steps: []
    };
    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    setActiveTabId(null); // Switch to the new project's roadmap view
  };

  const handleDeleteProject = (projectId: string) => {
    const docIdsToDelete = documents.filter(d => d.projectId === projectId).map(d => d.id);
    dbDeleteProject(projectId, docIdsToDelete); // immediate Firestore batch delete

    setProjects(prev => prev.filter(p => p.id !== projectId));
    setDocuments(prev => prev.filter(d => d.projectId !== projectId));
    setTabs(prev => prev.filter(t => !docIdsToDelete.includes(t.id)));
    
    if (activeTabId && docIdsToDelete.includes(activeTabId)) {
      const remainingTabs = tabs.filter(t => !docIdsToDelete.includes(t.id));
      if (remainingTabs.length > 0) {
        handleSelectTab(remainingTabs[0].id);
      } else {
        setActiveTabId(null);
      }
    }
    
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  // Project checklist roadmap step handlers
  const handleAddProjectStep = (projId: string, text: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          steps: [...p.steps, { id: 'step-' + Date.now(), text, isCompleted: false }]
        };
      }
      return p;
    }));
  };

  const handleToggleProjectStep = (projId: string, stepId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          steps: p.steps.map(s => s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s)
        };
      }
      return p;
    }));
  };

  const handleDeleteProjectStep = (projId: string, stepId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          steps: p.steps.filter(s => s.id !== stepId)
        };
      }
      return p;
    }));
  };

  // Users CRUD Handlers
  const handleAddUser = (newProfile: Omit<UserProfile, 'id'>) => {
    const newUser: UserProfile = {
      id: 'usr-' + Date.now(),
      ...newProfile
    };
    setUsers(prev => [...prev, newUser]);
    setActiveUserId(newUser.id);
  };

  const handleEditUser = (id: string, updated: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
  };

  const handleDeleteUser = (id: string) => {
    if (id === activeUserId) return; // prevent active deletion
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system' | 'sepia' | 'midnight') => {
    setTheme(newTheme);
    setCapsuleVisible(true);
  };

  // App Ideas handlers
  const handleCreateAppIdea = (idea: AppIdea) => {
    setAppIdeas(prev => [...prev, idea]);
    setActiveAppIdeaId(idea.id);
  };

  const handleDeleteAppIdea = (id: string) => {
    deleteAppIdea(id); // immediate Firestore delete
    setAppIdeas(prev => prev.filter(i => i.id !== id));
    if (activeAppIdeaId === id) {
      const remaining = appIdeas.filter(i => i.id !== id);
      setActiveAppIdeaId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameAppIdea = (id: string, name: string) => {
    setAppIdeas(prev => prev.map(i => i.id === id ? { ...i, name, updatedAt: Date.now() } : i));
  };

  const handleUpdateAppIdea = (id: string, updates: Partial<AppIdea>) => {
    setAppIdeas(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  useEffect(() => {
    if (capsuleVisible) {
      const handler = setTimeout(() => {
        setCapsuleVisible(false);
      }, 2500);
      return () => clearTimeout(handler);
    }
  }, [capsuleVisible]);

  // Sidebar documents format mapper
  const sidebarDocs = documents.map(d => ({
    id: d.id,
    title: d.title,
    projectId: d.projectId,
    content: d.content
  }));

  const sidebarProjects = projects.map(p => ({
    id: p.id,
    name: p.name
  }));

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg text-neutral-500 font-sans">
        Loading Notepad by Flo...
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen bg-light-bg dark:bg-[#121212] overflow-hidden text-neutral-800 dark:text-neutral-200 font-sans body.theme-${theme}`}>
      
      {/* Sidebar navigation container with smooth transition for Focus Mode */}
      <div 
        className="transition-all duration-500 flex-shrink-0 overflow-hidden h-full border-r border-transparent"
        style={{ 
          width: focusMode ? '0px' : '16rem', 
          opacity: focusMode ? 0 : 1,
          pointerEvents: focusMode ? 'none' : 'auto'
        }}
      >
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView as (view: 'workspace' | 'settings' | 'app-ideas') => void}
          workspaces={mockWorkspaces}
          activeWorkspaceId={activeWorkspaceId}
          projects={sidebarProjects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onAddProject={handleAddProject}
          onDeleteProject={handleDeleteProject}
          documents={sidebarDocs}
          activeDocId={activeTabId}
          onSelectDoc={handleSelectTab}
          onNewDocInProject={handleNewDocInProject}
          onNewFloatingDoc={handleNewFloatingDoc}
          onDeleteDoc={handleDeleteDoc}
          onRenameDoc={handleRenameDoc}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeUser={activeUser}
          appIdeas={appIdeas}
          pinnedDocs={pinnedDocs}
          onTogglePinDoc={handleTogglePinDoc}
          onDuplicateDoc={handleDuplicateDoc}
          onSaveAsTemplate={handleSaveAsTemplate}
          customTemplates={customTemplates}
          onNewFromTemplate={handleNewFromTemplate}
          docsOrder={docsOrder}
          onReorderDocs={handleReorderDocs}
          renamingDocId={renamingDocId}
          onRenamingDocIdChange={setRenamingDocId}
        />
      </div>

      {/* Main Workspace content */}
      <div className="flex-1 flex overflow-hidden h-full">
        {currentView === 'settings' ? (
          <Settings
            users={users}
            activeUserId={activeUserId}
            onSelectActiveUser={setActiveUserId}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            language={language}
            onLanguageChange={setLanguage}
            timezone={timezone}
            onTimezoneChange={setTimezone}
            timeFormat={timeFormat}
            onTimeFormatChange={setTimeFormat}
            dateFormat={dateFormat}
            onDateFormatChange={setDateFormat}
            theme={theme}
            onThemeChange={handleThemeChange}
            onClose={() => setCurrentView('workspace')}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            lineHeight={lineHeight}
            onLineHeightChange={setLineHeight}
            fontFamily={fontFamily}
            onFontFamilyChange={setFontFamily}
            lineNumbersVisible={lineNumbersVisible}
            onToggleLineNumbers={() => setLineNumbersVisible(!lineNumbersVisible)}
          />
        ) : currentView === 'app-ideas' ? (
          <AppIdeasPanel
            ideas={appIdeas}
            activeIdeaId={activeAppIdeaId}
            onSelectIdea={setActiveAppIdeaId}
            onCreateIdea={handleCreateAppIdea}
            onDeleteIdea={handleDeleteAppIdea}
            onRenameIdea={handleRenameAppIdea}
            onUpdateIdea={handleUpdateAppIdea}
          />
        ) : activeTabId !== null ? (
          <Editor
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
            onContentChange={handleContentChange}
            onReorderTabs={handleReorderTabs}
            onExportAsTxt={handleSaveFile}
            fontFamily={fontFamily}
            fontSize={fontSize}
            lineHeight={lineHeight}
            lineNumbersVisible={lineNumbersVisible}
            zoomLevel={zoomLevel}
            wordWrap={wordWrap}
            spellCheck={spellCheck}
            onToggleWordWrap={() => setWordWrap(!wordWrap)}
            onZoomChange={setZoomLevel}
            onRenameTab={handleRenameDoc}
            saveStatus={saveStatus}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            showFindReplace={showFindReplace}
            onCloseFindReplace={() => setShowFindReplace(false)}
            editorMode={editorMode}
            onEditorModeChange={setEditorMode}
            tags={activeTab && (activeTab as any).tags ? (activeTab as any).tags : []}
            onUpdateTags={(newTags) => handleUpdateTags(activeTabId!, newTags)}
          />
        ) : activeProjectId !== null ? (
          <ProjectRoadmap
            projectId={activeProjectId}
            projectName={activeProject ? activeProject.name : ''}
            steps={activeProject ? activeProject.steps : []}
            documents={sidebarDocs}
            onAddStep={handleAddProjectStep}
            onToggleStep={handleToggleProjectStep}
            onDeleteStep={handleDeleteProjectStep}
            onSelectDoc={handleSelectTab}
            onNewDocInProject={handleNewDocInProject}
          />
        ) : (
          /* Main Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/20 dark:bg-[#1E1E1E] text-center p-8 select-none fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-azure/5 border border-brand-azure/10 flex items-center justify-center mb-5 text-brand-azure/80 shadow-inner">
              <Folder className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-1.5 font-sans">No Project or Document Selected</h3>
            <p className="text-xs text-gray-400 dark:text-neutral-400 max-w-xs mb-5 font-sans">
              Select an active project or draft note in the sidebar tree, or create a new document to start.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleNewFloatingDoc}
                className="px-4 py-2 bg-brand-azure hover:bg-brand-azure/90 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-azure/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Document</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Transition Theme Capsule */}
      <ThemeCapsule
        theme={theme}
        visible={capsuleVisible}
      />

    </div>
  );
}
