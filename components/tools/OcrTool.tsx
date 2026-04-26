import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  Image as ImageIcon,
  Play,
  RefreshCw,
  ScanText,
  Trash2,
  Upload
} from 'lucide-react';
// @ts-ignore
import { createWorker, PSM } from 'tesseract.js';
import { LineNumberTextarea } from '../common/LineNumberTextarea';
import {
  CheckerboardSurface,
  GroupTitle,
  IconButton,
  MetricCard,
  PaneHeader,
  StatusBadge,
  StatusBar,
  ToolBody,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface OcrToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;
type OcrLanguageMode = 'auto' | 'eng' | 'chi_sim';

const OCR_LANG_VERSION = '4.0.0_best_int';
const OCR_WORKER_TIMEOUT_MS = 180000;

const OCR_LANGUAGE_OPTIONS: Array<{
  id: OcrLanguageMode;
  label: string;
  workerLanguage: string;
  engineLabel: string;
  dataLabel: string;
}> = [
  { id: 'auto', label: 'Auto', workerLanguage: 'eng+chi_sim', engineLabel: 'Auto · eng+chi_sim', dataLabel: 'eng+chi_sim' },
  { id: 'eng', label: 'EN', workerLanguage: 'eng', engineLabel: 'English · eng', dataLabel: 'eng' },
  { id: 'chi_sim', label: '中文', workerLanguage: 'chi_sim', engineLabel: 'Chinese · chi_sim', dataLabel: 'chi_sim' }
];

const getOcrAssetUrl = (relativePath: string) => new URL(relativePath, window.location.href).href.replace(/\/$/, '');

const OCR_STAGES = [
  {
    key: 'starting-worker',
    label: 'Starting worker',
    description: 'Creating the browser Worker'
  },
  {
    key: 'loading tesseract core',
    label: 'Loading Tesseract core',
    description: 'Fetching or reading the WASM runtime'
  },
  {
    key: 'initializing tesseract',
    label: 'Initializing Tesseract',
    description: 'Booting the OCR runtime'
  },
  {
    key: 'loading language traineddata',
    label: 'Loading traineddata',
    description: 'Reading local language data'
  },
  {
    key: 'initializing api',
    label: 'Initializing OCR API',
    description: 'Preparing the language model'
  },
  {
    key: 'recognizing text',
    label: 'Recognizing text',
    description: 'Scanning the selected image'
  }
];

const OVERALL_PROGRESS: Record<string, { start: number; weight: number }> = {
  'starting-worker': { start: 0.03, weight: 0.04 },
  'loading tesseract core': { start: 0.08, weight: 0.18 },
  'initializing tesseract': { start: 0.28, weight: 0.08 },
  'loading language traineddata': { start: 0.38, weight: 0.3 },
  'initializing api': { start: 0.7, weight: 0.1 },
  'recognizing text': { start: 0.82, weight: 0.18 },
  'worker ready': { start: 0.8, weight: 0 },
  done: { start: 1, weight: 0 },
  failed: { start: 0, weight: 0 }
};

const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

const getOverallProgress = (key: string, stageProgress: number | null) => {
  const range = OVERALL_PROGRESS[key] || { start: 0.05, weight: 0 };
  return clampProgress(range.start + (stageProgress ?? 0) * range.weight);
};

const getStageMeta = (key: string, languageLabel: string) => {
  if (key === 'worker ready') {
    return {
      key,
      label: 'Worker ready',
      description: `${languageLabel} language data loaded`
    };
  }
  if (key === 'done') {
    return {
      key,
      label: 'Done',
      description: 'OCR completed'
    };
  }
  if (key === 'failed') {
    return {
      key,
      label: 'Failed',
      description: 'OCR stopped with an error'
    };
  }
  return OCR_STAGES.find((stage) => stage.key === key) || {
    key,
    label: key || 'Idle',
    description: ''
  };
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const nextPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, getMessage: () => string) => {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(getMessage())), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
};

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'OCR failed';
};

const getLanguageOption = (languageMode: OcrLanguageMode) =>
  OCR_LANGUAGE_OPTIONS.find((option) => option.id === languageMode) || OCR_LANGUAGE_OPTIONS[0];

interface StageEvent {
  progress: number | null;
  updatedAt: number;
}

export const OcrTool: React.FC<OcrToolProps> = ({ toolLabel }) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageDimensions, setImageDimensions] = useState<string | null>(null);
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageProgress, setStageProgress] = useState<number | null>(0);
  const [stageEvents, setStageEvents] = useState<Record<string, StageEvent>>({});
  const [status, setStatus] = useState('idle');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [languageMode, setLanguageMode] = useState<OcrLanguageMode>('auto');
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const workerLanguageRef = useRef<string | null>(null);
  const workerLoadErrorRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      workerLanguageRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isProcessing || !startedAt) return undefined;

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(interval);
  }, [isProcessing, startedAt]);

  const updateStage = (key: string, nextStageProgress: number | null) => {
    const normalizedProgress = typeof nextStageProgress === 'number' ? clampProgress(nextStageProgress) : null;
    setStatus(key);
    setStageProgress(normalizedProgress);
    setProgress(getOverallProgress(key, normalizedProgress));
    setStageEvents((current) => ({
      ...current,
      [key]: {
        progress: normalizedProgress,
        updatedAt: Date.now()
      }
    }));
  };

  const getWorker = async (workerLanguage: string) => {
    if (workerRef.current && workerLanguageRef.current === workerLanguage) {
      updateStage('worker ready', 1);
      return workerRef.current;
    }

    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
      workerLanguageRef.current = null;
    }

    updateStage('starting-worker', null);
    workerLoadErrorRef.current = null;
    const workerLanguages = workerLanguage.split('+');
    const initialWorkerLanguage = workerLanguages[0] || workerLanguage;
    const worker = await withTimeout(
      createWorker(initialWorkerLanguage, 1, {
        workerPath: getOcrAssetUrl('ocr/worker.min.js'),
        corePath: getOcrAssetUrl('ocr/core'),
        langPath: getOcrAssetUrl(`ocr/lang/${OCR_LANG_VERSION}`),
        cacheMethod: 'none',
        gzip: false,
        workerBlobURL: false,
        logger: (message) => {
          if (message.status) {
            updateStage(message.status, typeof message.progress === 'number' ? message.progress : null);
          }
        },
        errorHandler: (message) => {
          workerLoadErrorRef.current = getErrorMessage(message);
        }
      }),
      OCR_WORKER_TIMEOUT_MS,
      () => workerLoadErrorRef.current || `Timed out loading OCR language data from ${getOcrAssetUrl(`ocr/lang/${OCR_LANG_VERSION}`)}`
    );

    if (initialWorkerLanguage !== workerLanguage) {
      await withTimeout(
        worker.reinitialize(workerLanguage),
        OCR_WORKER_TIMEOUT_MS,
        () => workerLoadErrorRef.current || `Timed out loading OCR language data for ${workerLanguage}`
      );
    }

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1'
    });

    workerRef.current = worker;
    workerLanguageRef.current = workerLanguage;
    updateStage('worker ready', 1);
    return worker;
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const value = event.target?.result as string;
      setImageData(value);
      setSelectedFile(file);
      setOutputText('');
      setError(null);
      setConfidence(null);
      setProgress(0);
      setStageProgress(0);
      setStageEvents({});
      setStartedAt(null);
      startedAtRef.current = null;
      setElapsedMs(0);
      setStatus('ready');

      const image = new Image();
      image.onload = () => setImageDimensions(`${image.width} x ${image.height}`);
      image.src = value;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = '';
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData.items;
    for (let index = 0; index < items.length; index += 1) {
      if (items[index].type.includes('image')) {
        const file = items[index].getAsFile();
        if (file) processFile(file);
        break;
      }
    }
  };

  const clearImage = () => {
    setImageData(null);
    setSelectedFile(null);
    setImageDimensions(null);
    setOutputText('');
    setError(null);
    setConfidence(null);
    setProgress(0);
    setStageProgress(0);
    setStageEvents({});
    setStartedAt(null);
    startedAtRef.current = null;
    setElapsedMs(0);
    setStatus('idle');
  };

  const handleOcr = async () => {
    if (!imageData) return;

    setIsProcessing(true);
    setError(null);
    setOutputText('');
    setConfidence(null);
    setProgress(0);
    setStageProgress(0);
    setStageEvents({});
    startedAtRef.current = Date.now();
    setStartedAt(startedAtRef.current);
    setElapsedMs(0);
    updateStage('starting-worker', null);

    try {
      await nextPaint();
      const worker = await getWorker(getLanguageOption(languageMode).workerLanguage);
      updateStage('recognizing text', 0);
      const result = await worker.recognize(imageData, { rotateAuto: true });
      const text = result.data.text.trim();

      setOutputText(text || '(No text found)');
      setConfidence(typeof result.data.confidence === 'number' ? result.data.confidence : null);
      updateStage('done', 1);
    } catch (err) {
      setError(getErrorMessage(err));
      updateStage('failed', null);
    } finally {
      setIsProcessing(false);
      if (startedAtRef.current) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  const wordCount = getWordCount(outputText);
  const lineCount = outputText ? outputText.split('\n').length : 0;
  const progressPercent = Math.round(progress * 100);
  const stagePercent = stageProgress === null ? null : Math.round(stageProgress * 100);
  const selectedLanguage = getLanguageOption(languageMode);
  const currentStage = getStageMeta(status, selectedLanguage.dataLabel);
  const currentStageIndex = OCR_STAGES.findIndex((stage) => stage.key === status);
  const elapsedSeconds = (elapsedMs / 1000).toFixed(1);

  return (
    <ToolShell onPaste={handlePaste}>
      <ToolHeader icon={<ScanText />} title={toolLabel} subtitle="Tesseract.js · image to text">
        <StatusBadge tone={error ? 'bad' : outputText ? 'ok' : 'neutral'}>{error ? 'ERROR' : isProcessing ? `${progressPercent}%` : outputText ? 'DONE' : 'READY'}</StatusBadge>
        <ToolButton icon={isProcessing ? <RefreshCw className="animate-spin" /> : <Play />} onClick={handleOcr} disabled={!imageData || isProcessing} variant="primary">
          {isProcessing ? 'Processing' : 'Run OCR'}
        </ToolButton>
        <ToolButton icon={copyFeedback ? <CheckCircle2 /> : <Copy />} onClick={handleCopy} disabled={!outputText}>
          {copyFeedback ? 'Copied' : 'Copy'}
        </ToolButton>
      </ToolHeader>

      <ToolBody className="grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title="Source image"
            meta={selectedFile ? selectedFile.type || 'image' : 'waiting'}
            actions={
              <>
                <ToolButton icon={<Upload />} onClick={() => fileInputRef.current?.click()}>
                  Choose
                </ToolButton>
                <IconButton icon={<Trash2 />} onClick={clearImage} disabled={!imageData} title="Clear" />
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
              imageData
                ? 'border-border-base bg-app-bg'
                : 'items-center justify-center gap-3 border-dashed border-border-hover bg-sidebar-bg p-6 text-center hover:border-accent hover:text-text-primary'
            }`}
          >
            {imageData ? (
              <>
                <CheckerboardSurface className="w-full">
                  <img src={imageData} alt="OCR source" className="max-h-[320px] max-w-full rounded-lg object-contain shadow-[var(--shadow-sm)]" />
                </CheckerboardSurface>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border-base px-4 py-3 font-mono text-[11px] text-[var(--fg-3)]">
                  <span>name <b className="font-medium text-text-primary">{selectedFile?.name || 'pasted image'}</b></span>
                  {selectedFile && <span>size <b className="font-medium text-text-primary">{formatBytes(selectedFile.size)}</b></span>}
                  {imageDimensions && <span>dimensions <b className="font-medium text-text-primary">{imageDimensions}</b></span>}
                </div>
              </>
            ) : (
              <>
                <ImageIcon size={34} strokeWidth={1.4} />
                <div>
                  <div className="text-sm font-semibold text-text-primary">Drop or choose an image</div>
                  <div className="mt-1 text-xs text-text-secondary">Paste from clipboard is supported.</div>
                </div>
              </>
            )}
          </button>
        </ToolPane>

        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader
            title="Output text"
            meta={outputText ? `${wordCount} words` : 'empty'}
            actions={<ToolButton icon={copyFeedback ? <CheckCircle2 /> : <Copy />} onClick={handleCopy} disabled={!outputText}>Copy</ToolButton>}
          />
          <div className="min-h-0 flex-1 bg-app-bg">
            <LineNumberTextarea
              readOnly
              value={outputText}
              placeholder="OCR result will appear here..."
              spellCheck={false}
              className="text-text-primary placeholder-text-secondary"
            />
          </div>
          <StatusBar>
            <span>lines <b className="font-medium text-text-primary">{lineCount}</b></span>
            <span>words <b className="font-medium text-text-primary">{wordCount}</b></span>
            {confidence !== null && <span>confidence <b className="font-medium text-text-primary">{confidence.toFixed(1)}%</b></span>}
          </StatusBar>
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader title="Processing" />
          <div className="min-h-0 flex-1 overflow-auto p-[18px]">
            <GroupTitle className="mt-0">Engine</GroupTitle>
            <div className="rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <FileText size={15} className="text-accent" />
                Tesseract.js
              </div>
              <div className="mt-1 font-mono text-[11px] text-text-secondary">Language · {selectedLanguage.engineLabel}</div>
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-[var(--radius-sm)] bg-element-bg p-1">
                {OCR_LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLanguageMode(option.id)}
                    disabled={isProcessing}
                    className={`h-7 rounded-[var(--radius-sm)] px-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      languageMode === option.id
                        ? 'bg-panel-bg text-text-primary shadow-[var(--shadow-sm)]'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <GroupTitle>Status</GroupTitle>
            <div className="rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-3">
              <div className="flex items-center justify-between gap-3 font-mono text-[11px] text-text-secondary">
                <span>{currentStage.label}</span>
                <span>{isProcessing ? `${progressPercent}% · ${elapsedSeconds}s` : `${progressPercent}%`}</span>
              </div>
              {currentStage.description && (
                <div className="mt-1 text-[11px] leading-5 text-text-secondary">
                  {currentStage.description}
                  {stagePercent !== null && isProcessing && <span className="font-mono"> · step {stagePercent}%</span>}
                </div>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-element-bg">
                <div
                  className={`h-full rounded-full transition-all ${error ? 'bg-[var(--red)]' : 'bg-[var(--accent)]'} ${isProcessing && progressPercent < 10 ? 'animate-pulse' : ''}`}
                  style={{ width: `${Math.max(isProcessing ? 8 : 0, progressPercent)}%` }}
                />
              </div>
            </div>

            <GroupTitle>Resource loading</GroupTitle>
            <div className="space-y-1.5">
              {OCR_STAGES.map((stage, index) => {
                const event = stageEvents[stage.key];
                const isActive = status === stage.key;
                const isDone = status === 'done' || (currentStageIndex > index && currentStageIndex !== -1) || event?.progress === 1;
                const stageValue = event?.progress === null || event?.progress === undefined ? null : Math.round(event.progress * 100);

                return (
                  <div
                    key={stage.key}
                    className={`rounded-[var(--radius-sm)] border px-3 py-2 ${
                      isActive
                        ? 'border-[color-mix(in_oklab,var(--accent)_40%,var(--line))] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]'
                        : 'border-border-base bg-panel-bg'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 size={13} className="shrink-0 text-[var(--green)]" />
                        ) : isActive ? (
                          <RefreshCw size={13} className="shrink-0 animate-spin text-accent" />
                        ) : (
                          <span className="h-[13px] w-[13px] shrink-0 rounded-full border border-border-base" />
                        )}
                        <span className="truncate text-xs font-medium text-text-primary">{stage.label}</span>
                      </div>
                      <span className="shrink-0 font-mono text-[10.5px] text-text-secondary">
                        {isDone ? 'done' : stageValue === null ? (isActive ? 'working' : 'waiting') : `${stageValue}%`}
                      </span>
                    </div>
                    <div className="mt-1 pl-[21px] text-[10.5px] leading-4 text-[var(--fg-3)]">{stage.description}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-[var(--radius-sm)] border border-border-base bg-panel-bg p-3 text-[11px] leading-5 text-text-secondary">
              OCR resources are loaded from bundled assets. Selected data: <span className="font-mono text-text-primary">{selectedLanguage.dataLabel}</span>.
            </div>

            {error && (
              <div className="mt-3 flex gap-2 rounded-[var(--radius-sm)] border border-[color-mix(in_oklab,var(--red)_30%,var(--line))] bg-[color-mix(in_oklab,var(--red)_10%,transparent)] p-3 text-xs leading-5 text-[var(--red)]">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <GroupTitle>Result stats</GroupTitle>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Words" value={wordCount} />
              <MetricCard label="Lines" value={lineCount} />
              <MetricCard label="Chars" value={outputText.length} />
              <MetricCard label="Confidence" value={confidence === null ? 'n/a' : `${confidence.toFixed(0)}%`} />
            </div>
          </div>
        </ToolPane>
      </ToolBody>
    </ToolShell>
  );
};
