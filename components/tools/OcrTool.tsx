import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  RefreshCw,
  Settings2,
  Play,
  AlertCircle
} from 'lucide-react';
import { LineNumberTextarea } from '../common/LineNumberTextarea';

interface OcrToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface AIModel {
  id: string;
  name: string;
}

type ProviderType = 'ollama' | 'lm-studio';

const PROVIDERS: Record<ProviderType, { label: string, defaultHost: string }> = {
  'ollama': { label: 'Ollama', defaultHost: 'http://localhost:11434' },
  'lm-studio': { label: 'LM Studio', defaultHost: 'http://localhost:1234' }
};

export const OcrTool: React.FC<OcrToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  // Config State
  const [provider, setProvider] = useState<ProviderType>('ollama');
  const [host, setHost] = useState(PROVIDERS['ollama'].defaultHost);
  const [showConfig, setShowConfig] = useState(true);
  
  // Model State
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // Data State
  const [imageData, setImageData] = useState<string | null>(null);
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [copyFeedback, setCopyFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]); // Refresh when provider changes

  // Update default host when provider changes (optional UX)
  const handleProviderChange = (newProvider: ProviderType) => {
    setProvider(newProvider);
    setHost(PROVIDERS[newProvider].defaultHost);
    setOutputText('');
    setError(null);
  };

  // Fetch Models
  const fetchModels = async () => {
    setError(null);
    setModels([]);
    setSelectedModel('');
    
    try {
      if (provider === 'ollama') {
        const response = await fetch(`${host}/api/tags`);
        if (!response.ok) throw new Error(`Failed to connect to Ollama at ${host}`);
        
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          const mappedModels = data.models.map((m: any) => ({ id: m.name, name: m.name }));
          setModels(mappedModels);
          autoSelectModel(mappedModels);
        }
      } else if (provider === 'lm-studio') {
        const response = await fetch(`${host}/v1/models`);
        if (!response.ok) throw new Error(`Failed to connect to LM Studio at ${host}`);
        
        const data = await response.json();
        // LM Studio / OpenAI format: { data: [{ id: "model-name", ... }] }
        if (data.data && Array.isArray(data.data)) {
           const mappedModels = data.data.map((m: any) => ({ id: m.id, name: m.id }));
           setModels(mappedModels);
           autoSelectModel(mappedModels);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const autoSelectModel = (availableModels: AIModel[]) => {
    if (availableModels.length === 0) return;
    
    // Simple heuristic to prefer vision/ocr models if present
    const visionModel = availableModels.find(m => 
        m.name.toLowerCase().includes('ocr') || 
        m.name.toLowerCase().includes('vision') || 
        m.name.toLowerCase().includes('llava')
    );
    setSelectedModel(visionModel ? visionModel.id : availableModels[0].id);
  };

  // Image Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = ''; // Reset
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      setImageData(evt.target?.result as string);
      setOutputText(''); // Clear previous result
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) processFile(file);
        break;
      }
    }
  };

  // Run OCR
  const handleOcr = async () => {
    if (!imageData || !selectedModel) return;
    
    setIsLoading(true);
    setError(null);
    setOutputText('');

    try {
      let resultText = '';
      
      if (provider === 'ollama') {
         // Ollama Native API
         // Requires raw base64 without data uri prefix
         const base64Image = imageData.split(',')[1];
         
         const payload = {
            model: selectedModel,
            messages: [
               {
                  role: 'user',
                  content: 'Please recognize and extract all text from this image. Output only the text content.',
                  images: [base64Image]
               }
            ],
            stream: false
         };

         const response = await fetch(`${host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         });
         
         if (!response.ok) throw new Error(`Ollama API Error: ${response.statusText}`);
         const data = await response.json();
         resultText = data.message?.content || '';

      } else if (provider === 'lm-studio') {
         // OpenAI Compatible API
         // Supports passing Data URI directly
         const payload = {
            model: selectedModel,
            messages: [
               {
                  role: 'user',
                  content: [
                     { type: 'text', text: 'Please recognize and extract all text from this image. Output only the text content.' },
                     { 
                        type: 'image_url', 
                        image_url: { 
                           url: imageData // Data URI is supported
                        } 
                     }
                  ]
               }
            ],
            stream: false
         };

         const response = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         });

         if (!response.ok) throw new Error(`LM Studio API Error: ${response.statusText}`);
         const data = await response.json();
         resultText = data.choices?.[0]?.message?.content || '';
      }

      if (resultText) {
        setOutputText(resultText);
      } else {
        setOutputText('(No text returned)');
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary" onPaste={handlePaste}>
      {/* Header */}
      <div className="h-12 border-b border-border-base flex items-center px-4 bg-app-bg electron-drag select-none shrink-0 justify-between">
        <div className="flex items-center">
          {!isSidebarOpen && (
            <>
              <div className="w-[70px] h-full shrink-0 electron-drag" />
              <button 
                onClick={toggleSidebar} 
                className="electron-no-drag p-1 mr-3 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover-overlay transition-colors"
                title="Open Sidebar"
              >
                <PanelLeft size={18} />
              </button>
            </>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <button 
              onClick={() => setShowConfig(!showConfig)}
              className={`p-1.5 rounded transition-colors ${showConfig ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text-primary hover:bg-hover-overlay'}`}
              title="Toggle Configuration"
           >
              <Settings2 size={16} />
           </button>
        </div>
      </div>

      {/* Configuration Bar */}
      {showConfig && (
        <div className="p-4 border-b border-border-base bg-sidebar-bg/50 shrink-0 flex flex-wrap gap-4 items-end animate-fade-in">
           
           <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Provider</label>
              <select 
                   value={provider}
                   onChange={(e) => handleProviderChange(e.target.value as ProviderType)}
                   className="w-full appearance-none bg-input-bg border border-border-base rounded px-3 py-1.5 text-sm focus:border-accent outline-none cursor-pointer"
               >
                  {Object.entries(PROVIDERS).map(([key, val]) => (
                     <option key={key} value={key}>{val.label}</option>
                  ))}
               </select>
           </div>

           <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">API Host</label>
              <input 
                 type="text" 
                 value={host}
                 onChange={(e) => setHost(e.target.value)}
                 className="w-full bg-input-bg border border-border-base rounded px-3 py-1.5 text-sm focus:border-accent outline-none font-mono"
                 placeholder="http://localhost:..."
              />
           </div>
           
           <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex justify-between">
                 <span>Model</span>
                 <button onClick={fetchModels} title="Refresh Models" className="hover:text-accent transition-colors">
                    <RefreshCw size={10} />
                 </button>
              </label>
              <div className="relative">
                 <select 
                   value={selectedModel}
                   onChange={(e) => setSelectedModel(e.target.value)}
                   className="w-full appearance-none bg-input-bg border border-border-base rounded px-3 py-1.5 text-sm focus:border-accent outline-none cursor-pointer"
                   disabled={models.length === 0}
                 >
                    {models.length === 0 && <option value="">No models found</option>}
                    {models.map(m => (
                       <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                 </select>
              </div>
           </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        
        {/* Left: Image Input */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg border border-border-base rounded-lg shadow-sm">
           <div className="flex items-center justify-between p-3 border-b border-border-base bg-sidebar-bg/30">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Input Image</span>
              <button onClick={() => { setImageData(null); setOutputText(''); }} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
                <Trash2 size={12} /> Clear
              </button>
           </div>
           
           <div className="flex-1 relative bg-panel-bg flex flex-col">
              {imageData ? (
                 <div className="flex-1 p-4 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ib3BhY2l0eSI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzIiBmaWxsLW9wYWNpdHk9IjAuMDUiIC8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iMC4wNSIgLz48L3N2Zz4=')]">
                    <img src={imageData} alt="Input" className="max-w-full max-h-full object-contain rounded shadow-lg" />
                 </div>
              ) : (
                 <div 
                   className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-hover-overlay transition-colors group border-2 border-transparent hover:border-accent/30 m-4 border-dashed rounded-xl"
                   onClick={() => fileInputRef.current?.click()}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={(e) => {
                     e.preventDefault();
                     const file = e.dataTransfer.files?.[0];
                     if (file) processFile(file);
                   }}
                 >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <div className="mb-4 p-4 rounded-full bg-element-bg group-hover:bg-accent/10 transition-colors">
                       <ImageIcon size={32} className="text-text-secondary group-hover:text-accent transition-colors" />
                    </div>
                    <div className="text-center">
                       <h3 className="text-sm font-medium text-text-primary">Click or Drag Image Here</h3>
                       <p className="text-xs text-text-secondary mt-1">Supports pasting from clipboard (Ctrl+V)</p>
                    </div>
                 </div>
              )}
           </div>

           <div className="p-4 border-t border-border-base bg-app-bg shrink-0">
              <button
                onClick={handleOcr}
                disabled={!imageData || isLoading || !selectedModel}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isLoading ? (
                    <>
                       <RefreshCw size={16} className="animate-spin" />
                       <span>Processing...</span>
                    </>
                 ) : (
                    <>
                       <Play size={16} />
                       <span>Run OCR</span>
                    </>
                 )}
              </button>
              {error && (
                 <div className="mt-2 text-xs text-red-400 flex items-center gap-1.5 justify-center">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                 </div>
              )}
           </div>
        </div>

        {/* Right: Text Output */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg border border-border-base rounded-lg shadow-sm">
           <div className="flex items-center justify-between p-3 border-b border-border-base bg-sidebar-bg/30">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Output Text</span>
              {outputText && (
                 <button 
                   onClick={handleCopy}
                   className="flex items-center space-x-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                 >
                   {copyFeedback ? <CheckCircle2 size={12} className="text-green-500"/> : <Copy size={12} />}
                   <span>{copyFeedback ? 'Copied' : 'Copy'}</span>
                 </button>
              )}
           </div>
           
           <div className="flex-1 overflow-hidden relative group bg-panel-bg">
              <LineNumberTextarea
                readOnly
                value={outputText}
                placeholder="OCR result will appear here..."
                spellCheck={false}
                className="text-text-primary placeholder-text-secondary"
              />
           </div>
        </div>

      </div>
    </div>
  );
};