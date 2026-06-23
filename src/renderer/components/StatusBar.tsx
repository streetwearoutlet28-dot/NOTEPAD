
interface StatusBarProps {
  visible: boolean;
  cursorLine: number;
  cursorCol: number;
  charCount: number;
  zoomLevel: number;
  lineEnding: 'LF' | 'CRLF';
}

export default function StatusBar({
  visible,
  cursorLine,
  cursorCol,
  charCount,
  zoomLevel,
  lineEnding
}: StatusBarProps) {
  if (!visible) return null;

  return (
    <div className="status-bar">
      <div className="status-bar-item">
        Ln {cursorLine}, Col {cursorCol}
      </div>
      <div className="status-bar-divider" />
      
      <div className="status-bar-item">
        {charCount} chars
      </div>
      <div className="status-bar-divider" />
      
      <div className="status-bar-item">
        {zoomLevel}%
      </div>
      <div className="status-bar-divider" />
      
      <div className="status-bar-item">
        Windows (CRLF)
      </div>
      <div className="status-bar-divider" />
      
      <div className="status-bar-item">
        {lineEnding === 'CRLF' ? 'Windows (CRLF)' : 'Unix (LF)'}
      </div>
      <div className="status-bar-divider" />
      
      <div className="status-bar-item">
        UTF-8
      </div>
    </div>
  );
}
