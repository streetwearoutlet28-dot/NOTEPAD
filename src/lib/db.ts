/**
 * db.ts — All Firestore read/write/subscribe operations for Notepad by Flo.
 *
 * Collection layout:
 *   settings/preferences   — single document: prefs, users, activeTabId, etc.
 *   notes/{id}             — one doc per text document/draft
 *   projects/{id}          — one doc per project (includes steps[])
 *   appIdeas/{id}          — one doc per App Idea entry
 *
 * Design:
 *   - All writes are fire-and-forget (no await at call site) for snappy UI.
 *   - onSnapshot listeners push server changes to React state in real-time.
 *   - electron-store is used as a local cache; this module does NOT touch it.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

// ─── Type Imports (inline to avoid circular deps with renderer) ────────────────
export interface DBPreferences {
  theme?: string;
  zoomLevel?: number;
  language?: string;
  timezone?: string;
  timeFormat?: string;
  dateFormat?: string;
  wordWrap?: boolean;
  spellCheck?: boolean;
  users?: any[];
  activeUserId?: string;
  activeProjectId?: string | null;
  activeTabId?: string | null;
  activeAppIdeaId?: string | null;
  recentDraftsExpanded?: boolean;
  tabs?: any[];
}

export interface DBNote {
  id: string;
  title: string;
  projectId: string | null;
  content: string;
  savedContent: string;
  filePath: string | null;
}

export interface DBProject {
  id: string;
  name: string;
  steps: any[];
}

export interface DBAppIdea {
  id: string;
  [key: string]: any;
}

export interface AllDBData {
  preferences: DBPreferences;
  notes: DBNote[];
  projects: DBProject[];
  appIdeas: DBAppIdea[];
}

// ─── Collection / Doc refs ────────────────────────────────────────────────────
const prefsRef = () => doc(db, 'settings', 'preferences');
const notesRef = () => collection(db, 'notes');
const noteRef = (id: string) => doc(db, 'notes', id);
const projectsRef = () => collection(db, 'projects');
const projectRef = (id: string) => doc(db, 'projects', id);
const appIdeasRef = () => collection(db, 'appIdeas');
const appIdeaRef = (id: string) => doc(db, 'appIdeas', id);

// ─── Guard — no-op if Firebase not configured ─────────────────────────────────
function canUseFirestore(): boolean {
  return isFirebaseConfigured();
}

// ─── LOAD ─────────────────────────────────────────────────────────────────────

/**
 * Load all synced data from Firestore in parallel.
 * Returns null if Firebase is not yet configured (placeholders still in config).
 */
export async function loadAllData(): Promise<AllDBData | null> {
  if (!canUseFirestore()) {
    console.info('[db] Firebase not configured — skipping Firestore load, using local cache.');
    return null;
  }

  try {
    const [prefsSnap, notesSnap, projectsSnap, ideasSnap] = await Promise.all([
      getDoc(prefsRef()),
      getDocs(query(notesRef())),
      getDocs(query(projectsRef())),
      getDocs(query(appIdeasRef())),
    ]);

    const preferences: DBPreferences = prefsSnap.exists() ? (prefsSnap.data() as DBPreferences) : {};

    const notes: DBNote[] = notesSnap.docs.map(d => ({ id: d.id, ...d.data() } as DBNote));
    const projects: DBProject[] = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DBProject));
    const appIdeas: DBAppIdea[] = ideasSnap.docs.map(d => ({ id: d.id, ...d.data() } as DBAppIdea));

    return { preferences, notes, projects, appIdeas };
  } catch (err) {
    console.error('[db] Firestore load failed — falling back to local cache:', err);
    return null;
  }
}

// ─── SAVE — PREFERENCES ───────────────────────────────────────────────────────

export function savePreferences(data: DBPreferences): void {
  if (!canUseFirestore()) return;
  setDoc(prefsRef(), data, { merge: true }).catch(err =>
    console.error('[db] savePreferences failed:', err)
  );
}

// ─── SAVE / DELETE — NOTES ────────────────────────────────────────────────────

export function saveNote(note: DBNote): void {
  if (!canUseFirestore()) return;
  setDoc(noteRef(note.id), note).catch(err =>
    console.error('[db] saveNote failed:', err)
  );
}

export function deleteNote(id: string): void {
  if (!canUseFirestore()) return;
  deleteDoc(noteRef(id)).catch(err =>
    console.error('[db] deleteNote failed:', err)
  );
}

// ─── SAVE / DELETE — PROJECTS ─────────────────────────────────────────────────

export function saveProject(project: DBProject): void {
  if (!canUseFirestore()) return;
  setDoc(projectRef(project.id), project).catch(err =>
    console.error('[db] saveProject failed:', err)
  );
}

/**
 * Deletes a project and all its associated notes in a single batch.
 */
export async function deleteProject(projectId: string, noteIds: string[]): Promise<void> {
  if (!canUseFirestore()) return;
  try {
    const batch = writeBatch(db);
    batch.delete(projectRef(projectId));
    noteIds.forEach(id => batch.delete(noteRef(id)));
    await batch.commit();
  } catch (err) {
    console.error('[db] deleteProject batch failed:', err);
  }
}

// ─── SAVE / DELETE — APP IDEAS ────────────────────────────────────────────────

export function saveAppIdea(idea: DBAppIdea): void {
  if (!canUseFirestore()) return;
  setDoc(appIdeaRef(idea.id), idea).catch(err =>
    console.error('[db] saveAppIdea failed:', err)
  );
}

export function deleteAppIdea(id: string): void {
  if (!canUseFirestore()) return;
  deleteDoc(appIdeaRef(id)).catch(err =>
    console.error('[db] deleteAppIdea failed:', err)
  );
}

// ─── REAL-TIME LISTENERS (onSnapshot) ─────────────────────────────────────────

export interface SnapshotCallbacks {
  onNotesChange: (notes: DBNote[]) => void;
  onProjectsChange: (projects: DBProject[]) => void;
  onAppIdeasChange: (ideas: DBAppIdea[]) => void;
  onPreferencesChange: (prefs: DBPreferences) => void;
}

/**
 * Subscribe to real-time updates from Firestore.
 * Returns a cleanup function — call it on component unmount.
 *
 * Skips subscription if Firebase is not yet configured.
 */
export function subscribeToAll(callbacks: SnapshotCallbacks): () => void {
  if (!canUseFirestore()) {
    return () => {}; // no-op unsubscribe
  }

  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(query(notesRef()), snap => {
      const notes = snap.docs.map(d => ({ id: d.id, ...d.data() } as DBNote));
      callbacks.onNotesChange(notes);
    }, err => console.error('[db] notes snapshot error:', err))
  );

  unsubs.push(
    onSnapshot(query(projectsRef()), snap => {
      const projects = snap.docs.map(d => ({ id: d.id, ...d.data() } as DBProject));
      callbacks.onProjectsChange(projects);
    }, err => console.error('[db] projects snapshot error:', err))
  );

  unsubs.push(
    onSnapshot(query(appIdeasRef()), snap => {
      const ideas = snap.docs.map(d => ({ id: d.id, ...d.data() } as DBAppIdea));
      callbacks.onAppIdeasChange(ideas);
    }, err => console.error('[db] appIdeas snapshot error:', err))
  );

  unsubs.push(
    onSnapshot(prefsRef(), snap => {
      if (snap.exists()) {
        callbacks.onPreferencesChange(snap.data() as DBPreferences);
      }
    }, err => console.error('[db] preferences snapshot error:', err))
  );

  return () => unsubs.forEach(u => u());
}
