import { useMemo } from 'react';
import { Copy, Download, FileText } from 'lucide-react';
import { AppIdea } from './types';

interface AppIdeasPreviewProps {
  idea: AppIdea | null;
}

function buildMasterPrompt(idea: AppIdea): string {
  const lines: string[] = [];

  const section = (emoji: string, title: string, fields: { label: string; value: string; code?: boolean }[]) => {
    const filled = fields.filter(f => f.value.trim());
    if (filled.length === 0) return;
    lines.push(`## ${emoji} ${title}`);
    lines.push('');
    for (const { label, value, code } of filled) {
      lines.push(`**${label}:**`);
      if (code) {
        lines.push('```');
        lines.push(value);
        lines.push('```');
      } else {
        lines.push(value);
      }
      lines.push('');
    }
  };

  lines.push(`# 💡 App Idea: ${idea.appTitle || idea.name}`);
  lines.push('');

  section('📌', 'Basic Info', [
    { label: 'App Title', value: idea.appTitle },
    { label: 'Package Name', value: idea.packageName },
    { label: 'EAS Project ID', value: idea.easProjectId },
    { label: 'App Description', value: idea.appDescription },
    { label: 'Target Audience', value: idea.targetAudience },
    { label: 'App Category', value: idea.appCategory },
  ]);

  section('🎨', 'Visual Assets', [
    { label: 'Play Store Icon (512×512)', value: idea.playStoreIconNotes },
    { label: 'Adaptive Icon — Foreground', value: idea.adaptiveIconForeground },
    { label: 'Adaptive Icon — Background Color', value: idea.adaptiveIconBgColor },
    { label: 'Splash Screen', value: idea.splashScreenDescription },
    { label: 'Primary Color', value: idea.primaryColor },
    { label: 'Secondary Color', value: idea.secondaryColor },
    { label: 'Background Color', value: idea.backgroundColor },
    { label: 'Font', value: idea.font },
  ]);

  section('💰', 'Monetization', [
    { label: 'Type', value: idea.monetizationType },
    { label: 'Price (RON)', value: idea.priceRON },
    { label: 'IAP Description', value: idea.iapDescription },
  ]);

  section('📋', 'Play Store Listing', [
    { label: 'Short Description', value: idea.shortDescription },
    { label: 'Full Description', value: idea.fullDescription },
    { label: 'Keywords / Tags', value: idea.keywords },
  ]);

  section('🤖', 'AI Prompts', [
    { label: 'Big Bang Prompt', value: idea.bigBangPrompt },
    { label: 'Google AI Studio Notes', value: idea.googleAIStudioNotes },
    { label: 'Antigravity Prompt', value: idea.antigravityPrompt },
  ]);

  section('💻', 'Technical', [
    { label: 'Terminal Commands', value: idea.terminalCommands, code: true },
    { label: 'Dependencies / Packages', value: idea.dependencies },
    { label: 'Firebase / Backend Notes', value: idea.firebaseNotes },
    { label: 'Romanian Localization Notes', value: idea.romanianLocalizationNotes },
  ]);

  section('📝', 'Extra Notes', [
    { label: 'Additional Notes', value: idea.extraNotes },
  ]);

  return lines.join('\n');
}

function renderMarkdown(md: string): string {
  // Minimal safe markdown renderer — no external deps needed
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="preview-code"><code>$1</code></pre>')
    // H1
    .replace(/^# (.+)$/gm, '<h1 class="preview-h1">$1</h1>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="preview-h2">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="preview-bold">$1</strong>')
    // Double newlines → paragraph breaks
    .replace(/\n\n/g, '<br/><br/>')
    // Single newlines
    .replace(/\n/g, '<br/>');
}

export default function AppIdeasPreview({ idea }: AppIdeasPreviewProps) {
  const masterPrompt = useMemo(() => {
    if (!idea) return '';
    return buildMasterPrompt(idea);
  }, [idea]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(masterPrompt);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = masterPrompt;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleSaveAsMd = async () => {
    if (!idea) return;
    const fileName = `${(idea.appTitle || idea.name).replace(/\s+/g, '_') || 'app_idea'}.md`;
    if (window.electron) {
      await window.electron.fileSaveAs(masterPrompt, fileName);
    } else {
      const blob = new Blob([masterPrompt], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!idea) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#121212] text-neutral-600 text-xs p-8 text-center">
        <div>
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-neutral-400 font-semibold mb-1">Master Prompt Preview</div>
          <div>Select or create an app idea to see the live preview here.</div>
        </div>
      </div>
    );
  }

  const isEmpty = masterPrompt.trim() === `# 💡 App Idea: ${idea.appTitle || idea.name}`.trim()
    || masterPrompt.split('\n').filter(l => l.trim() && !l.startsWith('#')).length === 0;

  return (
    <div className="flex flex-col h-full bg-[#121212]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-azure" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Master Prompt Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D2D2D] hover:bg-[#383838] border border-[#3F3F3F] text-[11px] font-semibold text-neutral-200 transition-colors"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
          <button
            onClick={handleSaveAsMd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-azure/10 hover:bg-brand-azure/20 border border-brand-azure/30 text-[11px] font-semibold text-brand-azure transition-colors"
          >
            <Download className="w-3 h-3" />
            Save as .md
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-neutral-600 text-xs text-center p-8">
            <div>
              <div className="text-2xl mb-2">✍️</div>
              <div>Start filling in the fields on the left to see your master prompt build up here live.</div>
            </div>
          </div>
        ) : (
          <div
            className="px-6 py-5 prose-preview text-neutral-200 text-sm leading-relaxed"
            style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(masterPrompt) }}
          />
        )}
      </div>

      {/* Raw markdown toggle footer */}
      <div className="px-5 py-2 border-t border-[#2A2A2A] flex-shrink-0">
        <div className="text-[10px] text-neutral-600 font-mono truncate">
          {masterPrompt.length > 0 ? `${masterPrompt.length.toLocaleString()} chars · ${masterPrompt.split('\n').length} lines` : '—'}
        </div>
      </div>

      <style>{`
        .preview-h1 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #e2e8f0;
          border-bottom: 1px solid #2A2A2A;
          padding-bottom: 0.5rem;
          margin-bottom: 0.5rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .preview-h2 {
          font-size: 0.85rem;
          font-weight: 700;
          color: #60a5fa;
          margin-top: 1.25rem;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .preview-bold {
          color: #94a3b8;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .preview-code {
          background: #0D0D0D;
          border: 1px solid #2A2A2A;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          font-size: 0.72rem;
          line-height: 1.6;
          overflow-x: auto;
          margin: 0.5rem 0;
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
}
