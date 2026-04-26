import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileCode,
  Image as ImageIcon,
  Trash2,
  Upload
} from 'lucide-react';
import {
  CheckerboardSurface,
  GroupTitle,
  IconButton,
  MetricCard,
  OutputTabs,
  PaneHeader,
  SegmentedControl,
  StatusBadge,
  StatusBar,
  ToggleRow,
  ToolBody,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface ImageBase64ToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'img2base64' | 'base642img';
type OutputFormat = 'raw' | 'html' | 'css' | 'markdown';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const estimateBase64Bytes = (value: string) => Math.round((value.length * 3) / 4);

export const ImageBase64Tool: React.FC<ImageBase64ToolProps> = ({ toolLabel }) => {
  const [mode, setMode] = useState<Mode>('img2base64');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedBase64, setGeneratedBase64] = useState('');
  const [includeScheme, setIncludeScheme] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('raw');
  const [imageDimensions, setImageDimensions] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [base64Input, setBase64Input] = useState('');
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const processFile = (file: File) => {
    setSelectedFile(file);
    setImageDimensions(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setGeneratedBase64(result);

      const image = new Image();
      image.onload = () => setImageDimensions(`${image.width} x ${image.height}`);
      image.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = '';
  };

  const removeImage = () => {
    setSelectedFile(null);
    setGeneratedBase64('');
    setImageDimensions(null);
  };

  const getRawOutput = () => {
    if (!generatedBase64) return '';
    if (includeScheme) return generatedBase64;
    return generatedBase64.split(',')[1] || generatedBase64;
  };

  const getHtmlTag = () => (generatedBase64 ? `<img src="${generatedBase64}" alt="Base64 Image" />` : '');
  const getCssBg = () => (generatedBase64 ? `background-image: url('${generatedBase64}');` : '');
  const getMarkdown = () => (generatedBase64 ? `![Base64 Image](${generatedBase64})` : '');

  const getOutput = () => {
    if (outputFormat === 'html') return getHtmlTag();
    if (outputFormat === 'css') return getCssBg();
    if (outputFormat === 'markdown') return getMarkdown();
    return getRawOutput();
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  useEffect(() => {
    if (!base64Input.trim()) {
      setImgPreviewUrl(null);
      setImgError(null);
      return;
    }

    const input = base64Input.trim();
    const finalSrc = input.startsWith('data:image/') ? input : `data:image/png;base64,${input}`;
    const image = new Image();

    image.onload = () => {
      setImgPreviewUrl(finalSrc);
      setImgError(null);
    };
    image.onerror = () => {
      setImgPreviewUrl(null);
      setImgError('Invalid Image Data');
    };
    image.src = finalSrc;
  }, [base64Input]);

  const handleDownload = () => {
    if (!imgPreviewUrl) return;
    const link = document.createElement('a');
    link.href = imgPreviewUrl;
    link.download = 'downloaded-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const encodedBytes = generatedBase64 ? estimateBase64Bytes(getRawOutput()) : 0;
  const output = getOutput();

  return (
    <ToolShell>
      <ToolHeader icon={<ImageIcon />} title={toolLabel} subtitle="Data URI · processed locally">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'img2base64', label: 'Image -> Base64', icon: <Upload /> },
            { value: 'base642img', label: 'Base64 -> Image', icon: <Download /> }
          ]}
        />
        {mode === 'img2base64' ? (
          <ToolButton icon={copyFeedback === 'output' ? <CheckCircle2 /> : <Copy />} onClick={() => copyToClipboard(output, 'output')} disabled={!output}>
            Copy
          </ToolButton>
        ) : (
          <ToolButton icon={<Download />} onClick={handleDownload} disabled={!imgPreviewUrl}>
            Download
          </ToolButton>
        )}
      </ToolHeader>

      {mode === 'img2base64' ? (
        <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
          <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
            <PaneHeader
              title="Source image"
              actions={
                <>
                  <ToolButton icon={<Upload />} onClick={() => fileInputRef.current?.click()}>
                    Choose
                  </ToolButton>
                  <IconButton icon={<Trash2 />} onClick={removeImage} disabled={!generatedBase64} title="Remove" />
                </>
              }
            />
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
              className={`m-[18px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-lg)] border text-text-secondary transition-colors ${
                generatedBase64
                  ? 'border-border-base bg-app-bg'
                  : 'items-center justify-center gap-3 border-dashed border-border-hover bg-sidebar-bg p-6 text-center hover:border-accent hover:text-text-primary'
              }`}
            >
              {generatedBase64 ? (
                <>
                  <CheckerboardSurface className="w-full">
                    <img src={generatedBase64} alt="Selected preview" className="max-h-[280px] max-w-full rounded-lg object-contain shadow-[var(--shadow-sm)]" />
                  </CheckerboardSurface>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border-base px-4 py-3 font-mono text-[11px] text-[var(--fg-3)]">
                    <span>name <b className="font-medium text-text-primary">{selectedFile?.name}</b></span>
                    <span>type <b className="font-medium text-text-primary">{selectedFile?.type || 'image/*'}</b></span>
                    <span>size <b className="font-medium text-text-primary">{selectedFile ? formatBytes(selectedFile.size) : '0 B'}</b></span>
                    {imageDimensions && <span>dimensions <b className="font-medium text-text-primary">{imageDimensions}</b></span>}
                    <span>encoded <b className="font-medium text-text-primary">{formatBytes(encodedBytes)}</b></span>
                  </div>
                </>
              ) : (
                <>
                  <Upload size={34} strokeWidth={1.4} />
                  <div>
                    <div className="text-sm font-semibold text-text-primary">Drop or choose an image</div>
                    <div className="mt-1 text-xs text-text-secondary">PNG, JPG, GIF, SVG, WebP.</div>
                  </div>
                </>
              )}
            </button>
          </ToolPane>

          <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
            <OutputTabs<OutputFormat>
              value={outputFormat}
              onChange={setOutputFormat}
              options={[
                { value: 'raw', label: 'Data URI', icon: <FileCode /> },
                { value: 'html', label: 'HTML', icon: <Code2 /> },
                { value: 'css', label: 'CSS', icon: <Code2 /> },
                { value: 'markdown', label: 'Markdown', icon: <FileCode /> }
              ]}
              right={generatedBase64 ? `${output.length.toLocaleString()} chars` : 'empty'}
            />
            <div className="relative min-h-0 flex-1">
              <textarea
                readOnly
                value={output}
                className="h-full w-full resize-none bg-app-bg p-[18px] font-mono text-[11.5px] leading-6 text-text-secondary outline-none placeholder:text-text-secondary"
                placeholder="Base64 output will appear here."
              />
              {output && (
                <ToolButton
                  icon={copyFeedback === 'floating' ? <CheckCircle2 /> : <Copy />}
                  onClick={() => copyToClipboard(output, 'floating')}
                  className="absolute bottom-4 right-4 shadow-[var(--shadow-md)]"
                >
                  {copyFeedback === 'floating' ? 'Copied' : 'Copy'}
                </ToolButton>
              )}
            </div>
          </ToolPane>

          <ToolPane className="bg-sidebar-bg">
            <PaneHeader title="Options" />
            <div className="min-h-0 flex-1 overflow-auto p-[18px]">
              <GroupTitle>Encoding</GroupTitle>
              <ToggleRow
                label="Include data: scheme"
                description="Strip prefix for raw payload"
                checked={includeScheme}
                onChange={setIncludeScheme}
              />

              <GroupTitle>Output budget</GroupTitle>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Raw" value={selectedFile ? formatBytes(selectedFile.size) : '0 B'} />
                <MetricCard label="Encoded" value={generatedBase64 ? formatBytes(encodedBytes) : '0 B'} tone={encodedBytes > 240 * 1024 ? 'amber' : 'neutral'} />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-element-bg">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: generatedBase64 ? `${Math.min(100, (encodedBytes / (320 * 1024)) * 100)}%` : '0%' }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-text-secondary">
                Base64 usually adds about 33 percent to the binary file size.
              </p>
            </div>
          </ToolPane>
        </ToolBody>
      ) : (
        <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
            <PaneHeader title="Base64 input" actions={<IconButton icon={<Trash2 />} onClick={() => setBase64Input('')} title="Clear" />} />
            <textarea
              value={base64Input}
              onChange={(event) => setBase64Input(event.target.value)}
              className="min-h-0 flex-1 resize-none bg-app-bg p-[18px] font-mono text-xs leading-6 text-text-primary outline-none placeholder:text-text-secondary"
              placeholder="Paste a data URI or raw Base64 image payload here."
              spellCheck={false}
            />
          </ToolPane>

          <ToolPane className="bg-sidebar-bg">
            <PaneHeader title="Preview" meta={imgPreviewUrl ? 'decoded' : imgError ? 'invalid' : 'waiting'} />
            <CheckerboardSurface>
              {imgPreviewUrl ? (
                <img src={imgPreviewUrl} alt="Decoded" className="max-h-full max-w-full rounded-lg object-contain shadow-[var(--shadow-md)]" />
              ) : imgError ? (
                <div className="flex flex-col items-center gap-2 text-[var(--red)]">
                  <AlertCircle size={42} strokeWidth={1.4} />
                  <span className="text-sm font-medium">Invalid Base64 image data</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-secondary opacity-50">
                  <ImageIcon size={42} strokeWidth={1.4} />
                  <span className="text-sm font-medium">Preview will appear here</span>
                </div>
              )}
            </CheckerboardSurface>
            <StatusBar>
              <span>{base64Input.length.toLocaleString()} chars</span>
              {imgPreviewUrl && <StatusBadge tone="ok">VALID IMAGE</StatusBadge>}
            </StatusBar>
          </ToolPane>
        </ToolBody>
      )}
    </ToolShell>
  );
};
