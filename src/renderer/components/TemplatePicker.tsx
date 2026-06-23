import { useEffect, useRef } from 'react';

interface TemplatePickerProps {
  customTemplates: { name: string; content: string }[];
  onSelectTemplate: (name: string) => void;
  onClose: () => void;
}

export default function TemplatePicker({
  customTemplates,
  onSelectTemplate,
  onClose
}: TemplatePickerProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const builtInTemplates = [
    { name: 'Blank', desc: 'Start with an empty note' },
    { name: 'Meeting Notes', desc: 'Agenda, Attendees, Actions' },
    { name: 'To-Do List', desc: 'Checkbox style checklist' },
    { name: 'App Idea', desc: 'App Name, Features, Target' },
    { name: 'Daily Journal', desc: 'Date, Mood & Reflections' }
  ];

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3F3F3F] rounded-xl shadow-lg py-2 z-50 select-none max-h-[300px] overflow-y-auto font-sans"
    >
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
        Built-in Templates
      </div>
      {builtInTemplates.map((t) => (
        <button
          key={t.name}
          onClick={() => onSelectTemplate(t.name)}
          className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] transition-colors cursor-pointer flex flex-col items-start"
        >
          <div className="text-xs font-bold text-neutral-800 dark:text-white">{t.name}</div>
          <div className="text-[10px] text-gray-400 dark:text-neutral-450">{t.desc}</div>
        </button>
      ))}

      {customTemplates.length > 0 && (
        <>
          <div className="border-t border-gray-200 dark:border-[#3F3F3F] my-1.5" />
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
            Custom Templates
          </div>
          {customTemplates.map((t) => (
            <button
              key={t.name}
              onClick={() => onSelectTemplate(t.name)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] transition-colors cursor-pointer flex flex-col items-start"
            >
              <div className="text-xs font-bold text-neutral-800 dark:text-white truncate w-full">{t.name}</div>
            </button>
          ))}
        </>
      )}
    </div>
  );
}
