import { Sun, Moon } from 'lucide-react';

interface ThemeCapsuleProps {
  theme: 'light' | 'dark' | 'system' | 'sepia' | 'midnight';
  visible: boolean;
}

export default function ThemeCapsule({ theme, visible }: ThemeCapsuleProps) {
  // Determine if the current active state is dark-like or light-like
  const isDark = theme === 'dark' || theme === 'midnight' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Custom display name and icon depending on theme
  let themeLabel = 'Theme';
  if (theme === 'light') themeLabel = 'Light Mode';
  else if (theme === 'dark') themeLabel = 'Dark Mode';
  else if (theme === 'sepia') themeLabel = 'Sepia Mode';
  else if (theme === 'midnight') themeLabel = 'Midnight Mode';
  else if (theme === 'system') {
    themeLabel = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'System (Dark)' : 'System (Light)';
  }

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3.5 rounded-full border shadow-2xl transition-all duration-500 ease-out transform ${
        visible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
      } ${
        theme === 'sepia'
          ? 'bg-[#F4ECD8]/95 border-[#E4D5B2] text-[#5C4033] shadow-amber-900/10'
          : theme === 'midnight'
          ? 'bg-[#030712]/95 border-[#1F2937] text-white shadow-black/60'
          : isDark 
          ? 'bg-neutral-900/90 border-neutral-800 text-white shadow-black/40' 
          : 'bg-white/90 border-gray-200/80 text-neutral-900 shadow-gray-200/40'
      } backdrop-blur-lg`}
    >
      {isDark ? (
        <>
          <Moon className="w-4 h-4 text-brand-azure fill-brand-azure/20 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide uppercase">{themeLabel}</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-brand-orange animate-spin-slow" />
          <span className="text-xs font-semibold tracking-wide uppercase">{themeLabel}</span>
        </>
      )}
      
      <style>{`
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
