import React from 'react';

interface Tab {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  savedContent: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onReorderTabs: (draggedIndex: number, targetIndex: number) => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReorderTabs
}: TabBarProps) {

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

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button === 1) { // Middle-click
      e.preventDefault();
      onCloseTab(id);
    }
  };

  const handleRightClick = (e: React.MouseEvent, id: string, index: number) => {
    e.preventDefault();
    // Build context menu callback programmatically or trigger an inline dropdown.
    // For tabs, we'll implement a clean custom inline context menu that shows:
    // Close, Close Others, Close All.
    const x = e.clientX;
    const y = e.clientY;
    
    // Dispatch a custom event or trigger state. Let's make it super neat by passing tab actions to a custom context menu handler.
    // In our design, we can trigger this directly in App.tsx by raising a contextmenu event
    // or showing a standard context menu. 
    // Wait! Let's pass the event to a global handler or render it locally in the tab bar.
    // Let's render the tab context menu right in App.tsx or inside TabBar itself.
    // Let's implement it inside the TabBar state!
    setContextMenu({
      visible: true,
      x,
      y,
      tabId: id,
      tabIndex: index
    });
  };

  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string;
    tabIndex: number;
  } | null>(null);

  React.useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleCloseOthers = (tabId: string) => {
    tabs.forEach(t => {
      if (t.id !== tabId) {
        onCloseTab(t.id);
      }
    });
  };

  const handleCloseAll = () => {
    tabs.forEach(t => {
      onCloseTab(t.id);
    });
  };

  return (
    <div className="tabbar-container">
      <div className="tab-list">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isModified = tab.content !== tab.savedContent;
          return (
            <div
              key={tab.id}
              className={`tab-item ${isActive ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelectTab(tab.id)}
              onMouseDown={(e) => handleMouseDown(e, tab.id)}
              onContextMenu={(e) => handleRightClick(e, tab.id, index)}
            >
              <span className="tab-title-text" title={tab.filePath || 'Untitled'}>
                {tab.title}
              </span>
              
              {isModified && <span className="tab-modified-indicator" title="Unsaved changes" />}
              
              <span
                className="tab-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
              >
                ×
              </span>
            </div>
          );
        })}
      </div>

      <div className="new-tab-btn" onClick={onNewTab} title="New Tab">
        +
      </div>

      {contextMenu && contextMenu.visible && (
        <div
          className="custom-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="menu-item"
            onClick={() => {
              onCloseTab(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close
          </div>
          <div 
            className="menu-item"
            onClick={() => {
              handleCloseOthers(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close Others
          </div>
          <div 
            className="menu-item"
            onClick={() => {
              handleCloseAll();
              setContextMenu(null);
            }}
          >
            Close All
          </div>
        </div>
      )}
    </div>
  );
}
