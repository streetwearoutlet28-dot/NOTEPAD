import { useState, useCallback, useRef } from 'react';
import { AppIdea } from './types';
import AppIdeasForm from './AppIdeasForm';
import AppIdeasPreview from './AppIdeasPreview';

interface AppIdeasPanelProps {
  ideas: AppIdea[];
  activeIdeaId: string | null;
  onSelectIdea: (id: string) => void;
  onCreateIdea: (idea: AppIdea) => void;
  onDeleteIdea: (id: string) => void;
  onRenameIdea: (id: string, name: string) => void;
  onUpdateIdea: (id: string, updates: Partial<AppIdea>) => void;
}

export default function AppIdeasPanel({
  ideas,
  activeIdeaId,
  onSelectIdea,
  onCreateIdea,
  onDeleteIdea,
  onRenameIdea,
  onUpdateIdea,
}: AppIdeasPanelProps) {
  // Resizable split — left panel width as percentage of total (default 45%)
  const [splitPercent, setSplitPercent] = useState(45);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const activeIdea = ideas.find(i => i.id === activeIdeaId) || null;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(75, Math.max(25, newPercent)));
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const handleChangeField = useCallback(<K extends keyof AppIdea>(field: K, value: AppIdea[K]) => {
    if (!activeIdeaId) return;
    onUpdateIdea(activeIdeaId, { [field]: value, updatedAt: Date.now() } as Partial<AppIdea>);
  }, [activeIdeaId, onUpdateIdea]);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden bg-[#121212]">
      {/* Left: Form */}
      <div
        className="flex-shrink-0 overflow-hidden border-r border-[#2A2A2A] flex flex-col"
        style={{ width: `${splitPercent}%` }}
      >
        <AppIdeasForm
          ideas={ideas}
          activeIdeaId={activeIdeaId}
          onSelectIdea={onSelectIdea}
          onCreateIdea={onCreateIdea}
          onDeleteIdea={onDeleteIdea}
          onRenameIdea={onRenameIdea}
          onChangeField={handleChangeField}
        />
      </div>

      {/* Divider */}
      <div
        className="w-1 flex-shrink-0 cursor-col-resize bg-[#2A2A2A] hover:bg-brand-azure/40 transition-colors duration-150 relative group"
        onMouseDown={handleMouseDown}
      >
        {/* Visual grip dots */}
        <div className="absolute inset-y-0 -left-1 -right-1" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {[0,1,2].map(i => (
            <div key={i} className="w-0.5 h-3 bg-brand-azure/60 rounded-full" />
          ))}
        </div>
      </div>

      {/* Right: Preview */}
      <div
        className="flex-1 overflow-hidden flex flex-col min-w-0"
      >
        <AppIdeasPreview idea={activeIdea} />
      </div>
    </div>
  );
}
