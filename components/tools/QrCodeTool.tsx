import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Download,
  Image as ImageIcon,
  Palette,
  QrCode as QrCodeIcon,
  RefreshCw,
  ScanLine,
  Trash2,
  Upload
} from 'lucide-react';
// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import jsQR from 'jsqr';
import {
  CheckerboardSurface,
  Field,
  FieldInput,
  GroupTitle,
  IconButton,
  PaneHeader,
  PresetPills,
  SegmentedControl,
  StatusBadge,
  StatusBar,
  ToolBody,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface QrCodeToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'generate' | 'read';
type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

const QR_TEMPLATES = [
  { label: 'URL', value: 'https://example.com' },
  { label: 'WiFi WPA', value: 'WIFI:T:WPA;S:NetworkName;P:password;;' },
  { label: 'vCard', value: 'BEGIN:VCARD\nVERSION:3.0\nFN:Dev Omni\nORG:DevOmni\nEND:VCARD' },
  { label: 'Email', value: 'mailto:hello@example.com' },
  { label: 'SMS', value: 'SMSTO:+15550123:Hello from DevOmni' },
  { label: 'Geo', value: 'geo:37.7749,-122.4194' }
];

const FG_SWATCHES = ['#000000', '#1f1f26', '#4f46e5', '#16a34a', '#dd5a1f', '#c8364a'];
const BG_SWATCHES = ['#ffffff', '#f6f5f2', '#fff4e0', '#e6efff', '#f3f0ff', '#0b0b0d'];

const estimateDataUrlBytes = (dataUrl: string) => {
  const payload = dataUrl.split(',')[1] || dataUrl;
  return Math.round((payload.length * 3) / 4);
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const ColorPicker: React.FC<{
  label: string;
  value: string;
  swatches: string[];
  onChange: (value: string) => void;
}> = ({ label, value, swatches, onChange }) => (
  <Field label={label} hint={value.toUpperCase()}>
    <div className="flex flex-wrap gap-1.5">
      {swatches.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-6 w-6 rounded-[var(--radius-sm)] border border-border-base ${
            color === value ? 'shadow-[0_0_0_2px_var(--accent)]' : ''
          }`}
          style={{ background: color }}
          aria-label={`${label} ${color}`}
        />
      ))}
      <div className="relative min-w-[96px] flex-1">
        <FieldInput
          value={value.replace('#', '')}
          onChange={(event) => onChange(`#${event.target.value.replace(/^#/, '')}`)}
          icon={<Palette />}
          spellCheck={false}
        />
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`${label} color`}
        />
      </div>
    </div>
  </Field>
);

export const QrCodeTool: React.FC<QrCodeToolProps> = ({ toolLabel }) => {
  const [mode, setMode] = useState<Mode>('generate');
  const [inputText, setInputText] = useState('https://example.com');
  const [qrImage, setQrImage] = useState<string>('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrection>('M');
  const [scannedText, setScannedText] = useState('');
  const [readerError, setReaderError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== 'generate') return;
    generateQR(inputText);
  }, [inputText, mode, fgColor, bgColor, size, margin, errorCorrection]);

  const generateQR = async (text: string) => {
    if (!text.trim()) {
      setQrImage('');
      return;
    }

    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: fgColor,
          light: bgColor
        }
      });
      setQrImage(url);
    } catch (err) {
      console.error(err);
      setQrImage('');
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = '';
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => scanImage(image);
      image.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const scanImage = (image: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      setScannedText(code.data);
      setReaderError(null);
    } else {
      setScannedText('');
      setReaderError('No QR code found in image.');
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (mode !== 'read') return;
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let index = 0; index < items.length; index += 1) {
        if (items[index].type.includes('image')) {
          const file = items[index].getAsFile();
          if (file) processFile(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [mode]);

  const payloadType = inputText.startsWith('http') ? 'URL' : inputText.includes('\n') ? 'Multiline' : 'Plain text';
  const estimatedSize = qrImage ? formatBytes(estimateDataUrlBytes(qrImage)) : '0 B';

  return (
    <ToolShell>
      <ToolHeader icon={<QrCodeIcon />} title={toolLabel} subtitle="generate · read · processed locally">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'generate', label: 'Generate', icon: <QrCodeIcon /> },
            { value: 'read', label: 'Read', icon: <ScanLine /> }
          ]}
        />
        {mode === 'generate' ? (
          <>
            <StatusBadge tone={qrImage ? 'ok' : 'neutral'}>{qrImage ? 'READY' : 'EMPTY'}</StatusBadge>
            <ToolButton icon={<Download />} onClick={downloadQR} disabled={!qrImage}>
              PNG
            </ToolButton>
          </>
        ) : (
          <ToolButton icon={<Upload />} onClick={() => fileInputRef.current?.click()}>
            Choose Image
          </ToolButton>
        )}
      </ToolHeader>

      {mode === 'generate' ? (
        <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px_320px]">
          <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
            <PaneHeader
              title="Content"
              meta={`${inputText.length} chars`}
              actions={
                <>
                  <IconButton icon={<Trash2 />} onClick={() => setInputText('')} title="Clear" />
                  <IconButton icon={<ClipboardPaste />} onClick={() => navigator.clipboard.readText().then(setInputText)} title="Paste" />
                </>
              }
            />
            <div className="min-h-0 flex-1 overflow-auto p-[18px]">
              <Field label="Encoded value" hint={`${payloadType} payload`}>
                <textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder="Enter text, URL, WiFi data, vCard, or anything else..."
                  className="min-h-[132px] w-full resize-y rounded-[var(--radius-sm)] border border-border-base bg-input-bg p-3 font-mono text-[12.5px] leading-5 text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-border-hover focus:shadow-[0_0_0_2px_var(--selection)]"
                  spellCheck={false}
                />
              </Field>

              <GroupTitle>Templates</GroupTitle>
              <PresetPills items={QR_TEMPLATES} onSelect={(item) => item.value && setInputText(item.value)} />

              <GroupTitle>Live preview · raw payload</GroupTitle>
              <div className="rounded-[var(--radius-sm)] border border-border-base bg-input-bg p-3 font-mono text-[11.5px] leading-5 text-text-secondary break-all">
                {inputText || <span className="text-[var(--fg-3)]">QR payload will appear here.</span>}
              </div>
            </div>
          </ToolPane>

          <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
            <PaneHeader title="Preview" meta={`${size} x ${size}`} actions={<IconButton icon={<RefreshCw />} onClick={() => generateQR(inputText)} title="Refresh" />} />
            <CheckerboardSurface>
              {qrImage ? (
                <div className="rounded-[var(--radius-lg)] border border-border-base bg-white p-4 shadow-[var(--shadow-md)]">
                  <img src={qrImage} alt="Generated QR code" className="h-[260px] w-[260px] object-contain" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-secondary opacity-50">
                  <ScanLine size={46} strokeWidth={1.2} />
                  <span className="text-sm font-medium">Preview</span>
                </div>
              )}
            </CheckerboardSurface>
            <StatusBar>
              <span>format <b className="font-medium text-text-primary">PNG</b></span>
              <span>error correction <b className="font-medium text-text-primary">{errorCorrection}</b></span>
              <span>estimated <b className="font-medium text-text-primary">{estimatedSize}</b></span>
            </StatusBar>
          </ToolPane>

          <ToolPane className="bg-sidebar-bg">
            <PaneHeader title="Style" />
            <div className="min-h-0 flex-1 overflow-auto p-[18px]">
              <div className="space-y-4">
                <ColorPicker label="Foreground" value={fgColor} swatches={FG_SWATCHES} onChange={setFgColor} />
                <ColorPicker label="Background" value={bgColor} swatches={BG_SWATCHES} onChange={setBgColor} />
              </div>

              <GroupTitle>Encoding</GroupTitle>
              <Field label="Error correction" hint="recovery">
                <SegmentedControl<ErrorCorrection>
                  value={errorCorrection}
                  onChange={setErrorCorrection}
                  className="w-full [&_button]:flex-1 [&_button]:justify-center"
                  options={[
                    { value: 'L', label: 'L' },
                    { value: 'M', label: 'M' },
                    { value: 'Q', label: 'Q' },
                    { value: 'H', label: 'H' }
                  ]}
                />
                <span className="text-[10.5px] text-[var(--fg-3)]">L 7% · M 15% · Q 25% · H 30%</span>
              </Field>
              <Field label="Output size" hint={`${size}px`} className="mt-4">
                <input
                  type="range"
                  min="128"
                  max="1024"
                  step="32"
                  value={size}
                  onChange={(event) => setSize(Number(event.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </Field>
              <Field label="Quiet zone" hint={`${margin} modules`} className="mt-4">
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={margin}
                  onChange={(event) => setMargin(Number(event.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </Field>
            </div>
          </ToolPane>
        </ToolBody>
      ) : (
        <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
          <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
            <PaneHeader title="Source image" actions={<ToolButton icon={<Upload />} onClick={() => fileInputRef.current?.click()}>Choose</ToolButton>} />
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              className="m-[18px] flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-hover bg-sidebar-bg p-6 text-center text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
            >
              <ImageIcon size={34} strokeWidth={1.4} />
              <div>
                <div className="text-sm font-semibold text-text-primary">Drop or choose a QR image</div>
                <div className="mt-1 text-xs text-text-secondary">PNG, JPG, JPEG, or paste image from clipboard.</div>
              </div>
            </button>
          </ToolPane>

          <ToolPane className="bg-sidebar-bg">
            <PaneHeader
              title="Decoded result"
              actions={
                scannedText && (
                  <IconButton
                    icon={copyFeedback === 'scan' ? <CheckCircle2 /> : <Copy />}
                    onClick={() => copyText(scannedText, 'scan')}
                    title="Copy decoded text"
                  />
                )
              }
            />
            <div className="min-h-0 flex-1 overflow-auto p-[18px]">
              <div
                className={`min-h-[160px] rounded-[var(--radius-sm)] border p-4 font-mono text-sm leading-6 break-all ${
                  readerError
                    ? 'border-[color-mix(in_oklab,var(--red)_35%,var(--line))] bg-[color-mix(in_oklab,var(--red)_8%,transparent)] text-[var(--red)]'
                    : 'border-border-base bg-input-bg text-text-primary'
                }`}
              >
                {readerError || scannedText || <span className="text-text-secondary">Decoded QR content will appear here.</span>}
              </div>
            </div>
          </ToolPane>
        </ToolBody>
      )}
    </ToolShell>
  );
};
