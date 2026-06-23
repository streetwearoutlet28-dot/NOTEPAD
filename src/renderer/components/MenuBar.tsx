import { useState, useEffect, useRef } from 'react';

interface MenuBarProps {
  spellCheck: boolean;
  wordWrap: boolean;
  statusBarVisible: boolean;
  theme: 'light' | 'dark' | 'system';
  onAction: (action: string) => void;
}

export default function MenuBar({
  spellCheck,
  wordWrap,
  statusBarVisible,
  theme,
  onAction
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMenuClick = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  const handleMenuMouseEnter = (menu: string) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const handleItemClick = (action: string) => {
    onAction(action);
    setActiveMenu(null);
  };

  const renderCheck = (checked: boolean) => {
    return checked ? <span className="menu-item-checked">✓</span> : <span className="menu-item-checked"></span>;
  };

  return (
    <div className="titlebar" ref={containerRef} style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="titlebar-spacer" />
      
      <div style={{ display: 'flex', gap: '4px', WebkitAppRegion: 'no-drag' } as any}>
        {/* FILE MENU */}
        <div className="menu-bar-btn-container" style={{ position: 'relative' }}>
          <div 
            className={`menu-bar-btn ${activeMenu === 'file' ? 'active' : ''}`}
            onClick={() => handleMenuClick('file')}
            onMouseEnter={() => handleMenuMouseEnter('file')}
          >
            File
          </div>
          {activeMenu === 'file' && (
            <div className="menu-dropdown">
              <div className="menu-item" onClick={() => handleItemClick('new-tab')}>
                <span>New Tab</span>
                <span className="menu-item-shortcut">⌘T</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('new-window')}>
                <span>New Window</span>
                <span className="menu-item-shortcut">⌘⇧N</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('open-file')}>
                <span>Open...</span>
                <span className="menu-item-shortcut">⌘O</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('save-file')}>
                <span>Save</span>
                <span className="menu-item-shortcut">⌘S</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('save-as-file')}>
                <span>Save As...</span>
                <span className="menu-item-shortcut">⌘⇧S</span>
              </div>
              <div className="menu-item-separator" />
              <div className="menu-item" onClick={() => handleItemClick('close-tab')}>
                <span>Close Tab</span>
                <span className="menu-item-shortcut">⌘W</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('exit-app')}>
                <span>Exit</span>
              </div>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="menu-bar-btn-container" style={{ position: 'relative' }}>
          <div 
            className={`menu-bar-btn ${activeMenu === 'edit' ? 'active' : ''}`}
            onClick={() => handleMenuClick('edit')}
            onMouseEnter={() => handleMenuMouseEnter('edit')}
          >
            Edit
          </div>
          {activeMenu === 'edit' && (
            <div className="menu-dropdown">
              <div className="menu-item" onClick={() => handleItemClick('undo')}>
                <span>Undo</span>
                <span className="menu-item-shortcut">⌘Z</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('redo')}>
                <span>Redo</span>
                <span className="menu-item-shortcut">⌘Y</span>
              </div>
              <div className="menu-item-separator" />
              <div className="menu-item" onClick={() => handleItemClick('cut')}>
                <span>Cut</span>
                <span className="menu-item-shortcut">⌘X</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('copy')}>
                <span>Copy</span>
                <span className="menu-item-shortcut">⌘C</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('paste')}>
                <span>Paste</span>
                <span className="menu-item-shortcut">⌘V</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('select-all')}>
                <span>Select All</span>
                <span className="menu-item-shortcut">⌘A</span>
              </div>
              <div className="menu-item-separator" />
              <div className="menu-item" onClick={() => handleItemClick('find')}>
                <span>Find</span>
                <span className="menu-item-shortcut">⌘F</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('replace')}>
                <span>Replace</span>
                <span className="menu-item-shortcut">⌘H</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('go-to-line')}>
                <span>Go To Line...</span>
                <span className="menu-item-shortcut">⌘G</span>
              </div>
              <div className="menu-item-separator" />
              <div className="menu-item" onClick={() => handleItemClick('toggle-spellcheck')}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderCheck(spellCheck)}
                  <span>Spell Check</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FORMAT MENU */}
        <div className="menu-bar-btn-container" style={{ position: 'relative' }}>
          <div 
            className={`menu-bar-btn ${activeMenu === 'format' ? 'active' : ''}`}
            onClick={() => handleMenuClick('format')}
            onMouseEnter={() => handleMenuMouseEnter('format')}
          >
            Format
          </div>
          {activeMenu === 'format' && (
            <div className="menu-dropdown">
              <div className="menu-item" onClick={() => handleItemClick('toggle-word-wrap')}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderCheck(wordWrap)}
                  <span>Word Wrap</span>
                </div>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('show-font-dialog')}>
                <span>Font...</span>
              </div>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="menu-bar-btn-container" style={{ position: 'relative' }}>
          <div 
            className={`menu-bar-btn ${activeMenu === 'view' ? 'active' : ''}`}
            onClick={() => handleMenuClick('view')}
            onMouseEnter={() => handleMenuMouseEnter('view')}
          >
            View
          </div>
          {activeMenu === 'view' && (
            <div className="menu-dropdown">
              <div className="menu-item" onClick={() => handleItemClick('zoom-in')}>
                <span>Zoom In</span>
                <span className="menu-item-shortcut">⌘+</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('zoom-out')}>
                <span>Zoom Out</span>
                <span className="menu-item-shortcut">⌘-</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('zoom-reset')}>
                <span>Reset Zoom</span>
                <span className="menu-item-shortcut">⌘0</span>
              </div>
              <div className="menu-item-separator" />
              <div className="menu-item" onClick={() => handleItemClick('toggle-status-bar')}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderCheck(statusBarVisible)}
                  <span>Status Bar</span>
                </div>
              </div>
              <div className="menu-item-separator" />
              <div className="menu-item" style={{ cursor: 'default' }}>
                <span style={{ fontWeight: '600', fontSize: '11px', color: 'var(--text-secondary)' }}>Theme</span>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('theme-light')} style={{ paddingLeft: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderCheck(theme === 'light')}
                  <span>Light</span>
                </div>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('theme-dark')} style={{ paddingLeft: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderCheck(theme === 'dark')}
                  <span>Dark</span>
                </div>
              </div>
              <div className="menu-item" onClick={() => handleItemClick('theme-system')} style={{ paddingLeft: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderCheck(theme === 'system')}
                  <span>System Theme</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
