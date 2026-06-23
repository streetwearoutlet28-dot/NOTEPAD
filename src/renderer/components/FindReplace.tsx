import React, { useEffect, useRef } from 'react';

interface FindReplaceProps {
  findState: {
    visible: boolean;
    searchQuery: string;
    replaceQuery: string;
    showReplace: boolean;
    matchCase: boolean;
    wrapAround: boolean;
    currentIndex: number;
    totalMatches: number;
  };
  onUpdateState: (updates: any) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

export default function FindReplace({
  findState,
  onUpdateState,
  onFindNext,
  onFindPrev,
  onReplace,
  onReplaceAll,
  onClose
}: FindReplaceProps) {
  const findInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus find input when it becomes visible
  useEffect(() => {
    if (findState.visible && findInputRef.current) {
      findInputRef.current.focus();
      findInputRef.current.select();
    }
  }, [findState.visible, findState.showReplace]);

  if (!findState.visible) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onFindPrev();
      } else {
        onFindNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const hasMatches = findState.totalMatches > 0;
  const matchIndicatorText = findState.searchQuery
    ? hasMatches
      ? `${findState.currentIndex + 1} of ${findState.totalMatches}`
      : 'No results'
    : '';

  return (
    <div className="find-replace-bar">
      <div className="find-replace-row">
        {/* Find Section */}
        <div className="find-input-group">
          <input
            ref={findInputRef}
            type="text"
            className="find-text-input"
            placeholder="Find"
            value={findState.searchQuery}
            onChange={(e) => onUpdateState({ searchQuery: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          {matchIndicatorText && (
            <span className={`match-count-indicator ${!hasMatches ? 'no-matches' : ''}`}>
              {matchIndicatorText}
            </span>
          )}
        </div>

        <button className="find-btn" onClick={onFindNext} disabled={!findState.searchQuery}>
          Find Next (Enter)
        </button>
        <button className="find-btn" onClick={onFindPrev} disabled={!findState.searchQuery}>
          Find Prev
        </button>

        {/* Toggles */}
        <div className="toggle-group">
          <label className="toggle-label" title="Match Case">
            <input
              type="checkbox"
              checked={findState.matchCase}
              onChange={(e) => onUpdateState({ matchCase: e.target.checked })}
            />
            Match Case
          </label>
          <label className="toggle-label" title="Wrap Around">
            <input
              type="checkbox"
              checked={findState.wrapAround}
              onChange={(e) => onUpdateState({ wrapAround: e.target.checked })}
            />
            Wrap
          </label>
        </div>

        <button className="close-find-btn" onClick={onClose} title="Close Search (Esc)">
          ×
        </button>
      </div>

      {findState.showReplace && (
        <div className="find-replace-row replace-row">
          <div className="find-input-group">
            <input
              type="text"
              className="find-text-input"
              placeholder="Replace with"
              value={findState.replaceQuery}
              onChange={(e) => onUpdateState({ replaceQuery: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="find-btn" onClick={onReplace} disabled={!findState.searchQuery}>
            Replace
          </button>
          <button className="find-btn" onClick={onReplaceAll} disabled={!findState.searchQuery}>
            Replace All
          </button>
          {/* Alignment spacer */}
          <div style={{ flexGrow: 1 }} />
        </div>
      )}

      {/* Styled inline helper CSS */}
      <style>{`
        .find-replace-bar {
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          padding: 8px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          z-index: 150;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .find-replace-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .replace-row {
          margin-top: 4px;
          padding-left: 0px;
        }
        .find-input-group {
          position: relative;
          display: flex;
          align-items: center;
          width: 250px;
        }
        .find-text-input {
          width: 100%;
          padding: 4px 80px 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-ui);
          font-size: 12px;
          outline: none;
        }
        .find-text-input:focus {
          border-color: var(--accent-color);
        }
        .match-count-indicator {
          position: absolute;
          right: 8px;
          font-size: 11px;
          color: var(--text-secondary);
          pointer-events: none;
        }
        .match-count-indicator.no-matches {
          color: #ff5252;
        }
        .find-btn {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11.5px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
        }
        .find-btn:hover:not(:disabled) {
          background-color: var(--bg-inactive-tab);
        }
        .find-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .toggle-group {
          display: flex;
          gap: 10px;
          margin-left: 8px;
          font-size: 11.5px;
          color: var(--text-secondary);
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }
        .close-find-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
          padding: 0 4px;
        }
        .close-find-btn:hover {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
