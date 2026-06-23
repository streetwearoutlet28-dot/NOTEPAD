import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FormSectionProps {
  title: string;
  emoji: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export default function FormSection({ title, emoji, defaultExpanded = true, children }: FormSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-[#3F3F3F] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#2D2D2D] hover:bg-[#333333] transition-colors duration-150 text-left"
      >
        <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-300 flex items-center gap-2">
          <span>{emoji}</span>
          <span>{title}</span>
        </span>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        }
      </button>
      {expanded && (
        <div className="px-4 py-4 bg-[#1E1E1E] space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
