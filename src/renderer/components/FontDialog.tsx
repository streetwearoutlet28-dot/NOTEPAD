import { useState } from 'react';

interface FontDialogProps {
  visible: boolean;
  initialFamily: string;
  initialSize: number;
  onApply: (family: string, size: number) => void;
  onClose: () => void;
}

const fontFamilies = [
  'SF Mono',
  'Courier New',
  'Courier',
  'Menlo',
  'Monaco',
  'Consolas',
  'JetBrains Mono',
  'Andale Mono',
  'monospace'
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

const fontStyles = [
  { id: 'regular', label: 'Regular', weight: 'normal', style: 'normal' },
  { id: 'italic', label: 'Italic', weight: 'normal', style: 'italic' },
  { id: 'bold', label: 'Bold', weight: 'bold', style: 'normal' },
  { id: 'bold-italic', label: 'Bold Italic', weight: 'bold', style: 'italic' }
];

export default function FontDialog({
  visible,
  initialFamily,
  initialSize,
  onApply,
  onClose
}: FontDialogProps) {
  const [selectedFamily, setSelectedFamily] = useState(initialFamily);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [selectedStyle, setSelectedStyle] = useState(fontStyles[0]); // Default to regular for plain editor, style represents preview

  if (!visible) return null;

  const handleOk = () => {
    onApply(selectedFamily, selectedSize);
    onClose();
  };

  const previewStyle = {
    fontFamily: selectedFamily.includes(' ') ? `"${selectedFamily}", monospace` : `${selectedFamily}, monospace`,
    fontSize: `${selectedSize}px`,
    fontWeight: selectedStyle.weight as any,
    fontStyle: selectedStyle.style,
    height: '80px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '12px',
    backgroundColor: 'var(--bg-secondary)',
    overflow: 'hidden',
    color: 'var(--text-primary)'
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-box font-dialog-box">
        <div className="dialog-title">Font</div>
        
        <div className="font-dialog-columns">
          {/* Family selection */}
          <div className="font-dialog-col">
            <label className="font-col-label">Font:</label>
            <input
              type="text"
              className="font-col-input"
              value={selectedFamily}
              readOnly
            />
            <div className="font-col-list">
              {fontFamilies.map((f) => (
                <div
                  key={f}
                  className={`font-list-item ${selectedFamily === f ? 'active' : ''}`}
                  onClick={() => setSelectedFamily(f)}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Style selection */}
          <div className="font-dialog-col">
            <label className="font-col-label">Font style:</label>
            <input
              type="text"
              className="font-col-input"
              value={selectedStyle.label}
              readOnly
            />
            <div className="font-col-list">
              {fontStyles.map((s) => (
                <div
                  key={s.id}
                  className={`font-list-item ${selectedStyle.id === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(s)}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Size selection */}
          <div className="font-dialog-col size-col">
            <label className="font-col-label">Size:</label>
            <input
              type="text"
              className="font-col-input"
              value={selectedSize}
              readOnly
            />
            <div className="font-col-list">
              {fontSizes.map((sz) => (
                <div
                  key={sz}
                  className={`font-list-item ${selectedSize === sz ? 'active' : ''}`}
                  onClick={() => setSelectedSize(sz)}
                >
                  {sz}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="font-preview-label" style={{ marginTop: '16px', fontSize: '12px', fontWeight: '500' }}>
          Preview
        </div>
        <div style={previewStyle}>
          AaBbYyZz 123
        </div>

        <div className="dialog-footer" style={{ marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={handleOk}>
            OK
          </button>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        .font-dialog-box {
          width: 480px;
        }
        .font-dialog-columns {
          display: flex;
          gap: 12px;
        }
        .font-dialog-col {
          display: flex;
          flex-direction: column;
          flex: 1.5;
        }
        .font-dialog-col.size-col {
          flex: 1;
        }
        .font-col-label {
          font-size: 11.5px;
          margin-bottom: 4px;
          color: var(--text-secondary);
        }
        .font-col-input {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
          margin-bottom: 4px;
        }
        .font-col-list {
          border: 1px solid var(--border-color);
          border-radius: 4px;
          height: 140px;
          overflow-y: auto;
          background-color: var(--bg-primary);
        }
        .font-list-item {
          padding: 4px 8px;
          font-size: 12px;
          cursor: default;
          color: var(--text-primary);
        }
        .font-list-item:hover {
          background-color: var(--bg-secondary);
        }
        .font-list-item.active {
          background-color: var(--accent-color);
          color: white;
        }
      `}</style>
    </div>
  );
}
