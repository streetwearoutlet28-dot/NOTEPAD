import React, { useState } from 'react';
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react';
import { AppIdea, AppCategory, MonetizationType, createEmptyAppIdea } from './types';
import FormSection from './FormSection';

interface AppIdeasFormProps {
  ideas: AppIdea[];
  activeIdeaId: string | null;
  onSelectIdea: (id: string) => void;
  onCreateIdea: (idea: AppIdea) => void;
  onDeleteIdea: (id: string) => void;
  onRenameIdea: (id: string, name: string) => void;
  onChangeField: <K extends keyof AppIdea>(field: K, value: AppIdea[K]) => void;
}

const inputCls = "w-full bg-[#2D2D2D] border border-[#3F3F3F] rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none focus:border-brand-azure transition-colors placeholder-neutral-500";
const textareaCls = `${inputCls} resize-none leading-relaxed`;
const labelCls = "block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5";
const colorInputCls = "w-9 h-9 rounded-lg border border-[#3F3F3F] cursor-pointer bg-transparent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <div className={`text-right text-[10px] mt-1 ${over ? 'text-red-400' : 'text-neutral-500'}`}>
      {len} / {max}
    </div>
  );
}

export default function AppIdeasForm({
  ideas,
  activeIdeaId,
  onSelectIdea,
  onCreateIdea,
  onDeleteIdea,
  onRenameIdea,
  onChangeField,
}: AppIdeasFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeIdea = ideas.find(i => i.id === activeIdeaId) || null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    const idea = createEmptyAppIdea(newName.trim());
    onCreateIdea(idea);
    setIsCreating(false);
    setNewName('');
  };

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const handleCommitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameIdea(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCommitRename();
    if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
  };

  const f = <K extends keyof AppIdea>(field: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChangeField(field, e.target.value as AppIdea[K]);
  };

  if (!activeIdea) {
    return (
      <div className="flex flex-col h-full">
        <IdeaSelector
          ideas={ideas}
          activeIdeaId={activeIdeaId}
          isCreating={isCreating}
          newName={newName}
          renamingId={renamingId}
          renameValue={renameValue}
          onSelectIdea={onSelectIdea}
          onDeleteIdea={onDeleteIdea}
          onStartCreate={() => { setIsCreating(true); setNewName(''); }}
          onNewNameChange={setNewName}
          onCreate={handleCreate}
          onCancelCreate={() => { setIsCreating(false); setNewName(''); }}
          onStartRename={handleStartRename}
          onRenameValueChange={setRenameValue}
          onCommitRename={handleCommitRename}
          onRenameKey={handleRenameKey}
        />
        <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs p-8 text-center">
          <div>
            <div className="text-4xl mb-3">💡</div>
            <div className="font-semibold text-neutral-300 mb-1">No App Idea Selected</div>
            <div>Create a new app idea above to get started.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <IdeaSelector
        ideas={ideas}
        activeIdeaId={activeIdeaId}
        isCreating={isCreating}
        newName={newName}
        renamingId={renamingId}
        renameValue={renameValue}
        onSelectIdea={onSelectIdea}
        onDeleteIdea={onDeleteIdea}
        onStartCreate={() => { setIsCreating(true); setNewName(''); }}
        onNewNameChange={setNewName}
        onCreate={handleCreate}
        onCancelCreate={() => { setIsCreating(false); setNewName(''); }}
        onStartRename={handleStartRename}
        onRenameValueChange={setRenameValue}
        onCommitRename={handleCommitRename}
        onRenameKey={handleRenameKey}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* BASIC INFO */}
        <FormSection title="Basic Info" emoji="📌">
          <Field label="App Title">
            <input type="text" className={inputCls} placeholder="My Awesome App" value={activeIdea.appTitle} onChange={f('appTitle')} />
          </Field>
          <Field label="Package Name">
            <input type="text" className={inputCls} placeholder="ro.appflowlabs.appname" value={activeIdea.packageName} onChange={f('packageName')} />
          </Field>
          <Field label="EAS Project ID">
            <input type="text" className={inputCls} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={activeIdea.easProjectId} onChange={f('easProjectId')} />
          </Field>
          <Field label="App Description">
            <textarea rows={3} className={textareaCls} placeholder="What does this app do?" value={activeIdea.appDescription} onChange={f('appDescription')} />
          </Field>
          <Field label="Target Audience">
            <input type="text" className={inputCls} placeholder="e.g. Students, Parents, Developers..." value={activeIdea.targetAudience} onChange={f('targetAudience')} />
          </Field>
          <Field label="App Category">
            <select className={inputCls} value={activeIdea.appCategory} onChange={f('appCategory')}>
              {(['Utility', 'Education', 'Productivity', 'Lifestyle', 'Other'] as AppCategory[]).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </FormSection>

        {/* VISUAL ASSETS */}
        <FormSection title="Visual Assets" emoji="🎨" defaultExpanded={false}>
          <Field label="Play Store Icon 512×512 (notes)">
            <textarea rows={2} className={textareaCls} placeholder="Icon concept, style notes..." value={activeIdea.playStoreIconNotes} onChange={f('playStoreIconNotes')} />
          </Field>
          <Field label="Adaptive Icon — Foreground Layer (notes)">
            <textarea rows={2} className={textareaCls} placeholder="Foreground layer description..." value={activeIdea.adaptiveIconForeground} onChange={f('adaptiveIconForeground')} />
          </Field>
          <Field label="Adaptive Icon — Background Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                className={colorInputCls}
                value={activeIdea.adaptiveIconBgColor}
                onChange={f('adaptiveIconBgColor')}
              />
              <input type="text" className={`${inputCls} flex-1`} placeholder="#FFFFFF" value={activeIdea.adaptiveIconBgColor} onChange={f('adaptiveIconBgColor')} />
            </div>
          </Field>
          <Field label="Splash Screen Description">
            <textarea rows={2} className={textareaCls} placeholder="Splash screen layout, animation..." value={activeIdea.splashScreenDescription} onChange={f('splashScreenDescription')} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Primary Color">
              <div className="flex flex-col gap-1.5">
                <input type="color" className={`${colorInputCls} w-full h-8`} value={activeIdea.primaryColor} onChange={f('primaryColor')} />
                <input type="text" className={inputCls} placeholder="#000000" value={activeIdea.primaryColor} onChange={f('primaryColor')} />
              </div>
            </Field>
            <Field label="Secondary Color">
              <div className="flex flex-col gap-1.5">
                <input type="color" className={`${colorInputCls} w-full h-8`} value={activeIdea.secondaryColor} onChange={f('secondaryColor')} />
                <input type="text" className={inputCls} placeholder="#000000" value={activeIdea.secondaryColor} onChange={f('secondaryColor')} />
              </div>
            </Field>
            <Field label="Background Color">
              <div className="flex flex-col gap-1.5">
                <input type="color" className={`${colorInputCls} w-full h-8`} value={activeIdea.backgroundColor} onChange={f('backgroundColor')} />
                <input type="text" className={inputCls} placeholder="#FFFFFF" value={activeIdea.backgroundColor} onChange={f('backgroundColor')} />
              </div>
            </Field>
          </div>
          <Field label="Font">
            <input type="text" className={inputCls} placeholder="e.g. Inter, Roboto, Poppins" value={activeIdea.font} onChange={f('font')} />
          </Field>
        </FormSection>

        {/* MONETIZATION */}
        <FormSection title="Monetization" emoji="💰" defaultExpanded={false}>
          <Field label="Monetization Type">
            <select className={inputCls} value={activeIdea.monetizationType} onChange={f('monetizationType')}>
              {(['One-time purchase', 'Free', 'Subscription', 'IAP'] as MonetizationType[]).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Price in RON">
            <input type="number" className={inputCls} placeholder="e.g. 19.99" value={activeIdea.priceRON} onChange={f('priceRON')} />
          </Field>
          <Field label="IAP Description">
            <textarea rows={2} className={textareaCls} placeholder="In-app purchase details..." value={activeIdea.iapDescription} onChange={f('iapDescription')} />
          </Field>
        </FormSection>

        {/* PLAY STORE LISTING */}
        <FormSection title="Play Store Listing" emoji="📋" defaultExpanded={false}>
          <Field label={`Short Description (${activeIdea.shortDescription.length}/80)`}>
            <textarea rows={2} className={textareaCls} placeholder="Catchy one-liner for the store..." value={activeIdea.shortDescription} onChange={f('shortDescription')} maxLength={80} />
            <CharCounter value={activeIdea.shortDescription} max={80} />
          </Field>
          <Field label="Full Description">
            <textarea rows={6} className={textareaCls} placeholder="Full store description..." value={activeIdea.fullDescription} onChange={f('fullDescription')} maxLength={4000} />
            <CharCounter value={activeIdea.fullDescription} max={4000} />
          </Field>
          <Field label="Keywords / Tags">
            <input type="text" className={inputCls} placeholder="tag1, tag2, tag3..." value={activeIdea.keywords} onChange={f('keywords')} />
          </Field>
        </FormSection>

        {/* AI PROMPTS */}
        <FormSection title="AI Prompts" emoji="🤖" defaultExpanded={false}>
          <Field label="Big Bang Prompt">
            <textarea rows={6} className={textareaCls} placeholder="The foundational prompt that defines the full project..." value={activeIdea.bigBangPrompt} onChange={f('bigBangPrompt')} />
          </Field>
          <Field label="Google AI Studio Notes">
            <textarea rows={3} className={textareaCls} placeholder="Notes for Google AI Studio experiments..." value={activeIdea.googleAIStudioNotes} onChange={f('googleAIStudioNotes')} />
          </Field>
          <Field label="Antigravity Prompt">
            <textarea rows={6} className={textareaCls} placeholder="Detailed prompt for Antigravity agent..." value={activeIdea.antigravityPrompt} onChange={f('antigravityPrompt')} />
          </Field>
        </FormSection>

        {/* TECHNICAL */}
        <FormSection title="Technical" emoji="💻" defaultExpanded={false}>
          <Field label="Terminal Commands">
            <textarea
              rows={4}
              className={`${textareaCls} font-mono text-[11px] bg-[#0D0D0D]`}
              placeholder="npx expo start&#10;npm install package-name&#10;..."
              value={activeIdea.terminalCommands}
              onChange={f('terminalCommands')}
            />
          </Field>
          <Field label="Dependencies / Packages">
            <textarea rows={3} className={textareaCls} placeholder="react-native-reanimated, expo-camera, etc." value={activeIdea.dependencies} onChange={f('dependencies')} />
          </Field>
          <Field label="Firebase / Backend Notes">
            <textarea rows={3} className={textareaCls} placeholder="Firestore collections, Auth setup, functions..." value={activeIdea.firebaseNotes} onChange={f('firebaseNotes')} />
          </Field>
          <Field label="Romanian Localization Notes">
            <textarea rows={2} className={textareaCls} placeholder="Strings that need Romanian translation..." value={activeIdea.romanianLocalizationNotes} onChange={f('romanianLocalizationNotes')} />
          </Field>
        </FormSection>

        {/* EXTRA NOTES */}
        <FormSection title="Extra Notes" emoji="📝" defaultExpanded={false}>
          <Field label="Anything else">
            <textarea rows={6} className={textareaCls} placeholder="Miscellaneous notes, ideas, reminders..." value={activeIdea.extraNotes} onChange={f('extraNotes')} />
          </Field>
        </FormSection>

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// ─── Idea Selector ────────────────────────────────────────────────────────────
interface IdeaSelectorProps {
  ideas: AppIdea[];
  activeIdeaId: string | null;
  isCreating: boolean;
  newName: string;
  renamingId: string | null;
  renameValue: string;
  onSelectIdea: (id: string) => void;
  onDeleteIdea: (id: string) => void;
  onStartCreate: () => void;
  onNewNameChange: (v: string) => void;
  onCreate: () => void;
  onCancelCreate: () => void;
  onStartRename: (id: string, name: string, e: React.MouseEvent) => void;
  onRenameValueChange: (v: string) => void;
  onCommitRename: () => void;
  onRenameKey: (e: React.KeyboardEvent) => void;
}

function IdeaSelector({
  ideas, activeIdeaId, isCreating, newName, renamingId, renameValue,
  onSelectIdea, onDeleteIdea, onStartCreate, onNewNameChange, onCreate, onCancelCreate,
  onStartRename, onRenameValueChange, onCommitRename, onRenameKey
}: IdeaSelectorProps) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-[#3F3F3F] flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">App Ideas</span>
        <button
          onClick={onStartCreate}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-azure/10 hover:bg-brand-azure/20 text-brand-azure text-[10px] font-semibold transition-colors"
          title="Create new app idea"
        >
          <Plus className="w-3 h-3" />
          <span>New Idea</span>
        </button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-1.5 mb-2 bg-[#2D2D2D] border border-brand-azure/40 rounded-lg px-2.5 py-1.5">
          <input
            autoFocus
            type="text"
            placeholder="Idea name..."
            value={newName}
            onChange={e => onNewNameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onCreate();
              if (e.key === 'Escape') onCancelCreate();
            }}
            className="flex-1 bg-transparent text-xs outline-none text-neutral-200 placeholder-neutral-500"
          />
          <button onClick={onCreate} className="text-brand-azure hover:text-brand-azure/80 transition"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={onCancelCreate} className="text-neutral-500 hover:text-neutral-300 transition"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ideas.map(idea => (
            <div
              key={idea.id}
              onClick={() => onSelectIdea(idea.id)}
              className={`group flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all ${
                idea.id === activeIdeaId
                  ? 'bg-brand-azure text-white shadow-md shadow-brand-azure/30'
                  : 'bg-[#2D2D2D] text-neutral-300 hover:bg-[#3A3A3A] border border-[#3F3F3F]'
              }`}
            >
              {renamingId === idea.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => onRenameValueChange(e.target.value)}
                  onBlur={onCommitRename}
                  onKeyDown={onRenameKey}
                  onClick={e => e.stopPropagation()}
                  className="bg-transparent outline-none text-[11px] w-24 text-neutral-200"
                />
              ) : (
                <span className="truncate max-w-[120px]">{idea.name}</span>
              )}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={e => onStartRename(idea.id, idea.name, e)}
                  className="p-0.5 hover:text-white text-white/60 rounded transition"
                  title="Rename"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete app idea "${idea.name}"?`)) onDeleteIdea(idea.id);
                  }}
                  className="p-0.5 hover:text-red-400 text-white/60 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
