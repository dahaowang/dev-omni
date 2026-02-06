import React, { useState, useRef, useEffect } from 'react';
import { 
  PanelLeft, 
  ArrowRightLeft,
  Image as ImageIcon,
  FileCode,
  Upload,
  Download,
  Copy,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface ImageBase64ToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'img2base64' | 'base642img';

export const ImageBase64Tool: React.FC<ImageBase64ToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [mode, setMode] = useState<Mode>('img2base64');
  
  // Img -> Base64 State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedBase64, setGeneratedBase64] = useState<string>('');
  const [includeScheme, setIncludeScheme] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Base64 -> Img State
  const [base64Input, setBase64Input] = useState<string>('');
  const [imgPreviewUrl, setImgPreviewUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // --- Image to Base64 Logic ---
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset to allow selecting same file again
    e.target.value = '';
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      setGeneratedBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const getFormattedOutput = () => {
    if (!generatedBase64) return '';
    if (includeScheme) return generatedBase64;
    return generatedBase64.split(',')[1] || generatedBase64; // Fallback if no comma
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const getHtmlTag = () => `<img src="${generatedBase64}" alt="Base64 Image" />`;
  const getCssBg = () => `background-image: url('${generatedBase64}');`;

  // --- Base64 to Image Logic ---

  useEffect(() => {
    if (!base64Input.trim()) {
      setImgPreviewUrl(null);
      setImgError(null);
      return;
    }

    const input = base64Input.trim();
    
    // Check if it has a scheme. If not, we might need to assume one for the <img> tag to work reliably in some contexts,
    // though browsers are often lenient. Let's try to construct a valid URI.
    let finalSrc = input;
    if (!input.startsWith('data:image/')) {
       // Heuristic: Try to detect mime type from first chars? 
       // For now, if no scheme, assume png if completely missing, or just let user fix it.
       // Actually, browsers usually require the data: scheme for src.
       
       // Simple fix: if it looks like raw base64, prepend generic png header?
       // Let's assume user might paste just the body.
       finalSrc = `data:image/png;base64,${input}`;
    }

    // Basic validation test by creating an image object
    const img = new Image();
    img.onload = () => {
      setImgPreviewUrl(finalSrc);
      setImgError(null);
    };
    img.onerror = () => {
      // Try original input just in case user pasted a full data uri that we messed up?
      // If we prepended, maybe try without?
      if (finalSrc !== input) {
          const img2 = new Image();
          img2.onload = () => {
             setImgPreviewUrl(input);
             setImgError(null);
          };
          img2.onerror = () => {
             setImgError("Invalid Image Data");
             setImgPreviewUrl(null);
          };
          img2.src = input;
      } else {
          setImgError("Invalid Image Data");
          setImgPreviewUrl(null);
      }
    };
    img.src = finalSrc;
    
  }, [base64Input]);

  const handleDownload = () => {
    if (!imgPreviewUrl) return;
    const link = document.createElement('a');
    link.href = imgPreviewUrl;
    link.download = 'downloaded-image.png'; // Default name, hard to guess ext from raw base64 without magic numbers
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-app-bg text-text-primary">
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

        {/* Mode Switcher */}
        <div className="flex items-center space-x-3 electron-no-drag">
           <div className="flex bg-panel-bg rounded-md p-1 border border-border-base">
             <button
               onClick={() => setMode('img2base64')}
               className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'img2base64'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               <ImageIcon size={14} />
               <span>Image → Base64</span>
             </button>
             <button
               onClick={() => setMode('base642img')}
               className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'base642img'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               <FileCode size={14} />
               <span>Base64 → Image</span>
             </button>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {mode === 'img2base64' ? (
          <div className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full">
            
            {/* Upload Section */}
            <div className="flex gap-6 h-64 shrink-0">
               {/* Drop Zone */}
               <div 
                 className="flex-1 bg-panel-bg border-2 border-dashed border-border-base rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-hover-overlay transition-all group relative overflow-hidden"
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
                 
                 {generatedBase64 ? (
                   <div className="absolute inset-0 flex items-center justify-center p-4 bg-app-bg/50 backdrop-blur-sm z-0">
                     <img src={generatedBase64} alt="Preview" className="max-w-full max-h-full object-contain rounded shadow-md" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-white font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full">
                          <Upload size={16} /> Change Image
                        </div>
                     </div>
                   </div>
                 ) : (
                   <div className="text-center p-6 z-10">
                     <div className="mb-4 p-4 rounded-full bg-element-bg inline-block group-hover:bg-accent/10 transition-colors">
                       <Upload size={32} className="text-text-secondary group-hover:text-accent transition-colors" />
                     </div>
                     <h3 className="text-lg font-medium text-text-primary mb-2">Upload Image</h3>
                     <p className="text-sm text-text-secondary">Drag & drop or click to browse</p>
                   </div>
                 )}
               </div>

               {/* File Info / Options */}
               <div className="w-80 bg-panel-bg border border-border-base rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Settings</h3>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-border-base bg-app-bg cursor-pointer hover:border-accent/50 transition-colors">
                       <input 
                         type="checkbox" 
                         checked={includeScheme} 
                         onChange={() => setIncludeScheme(!includeScheme)}
                         className="mt-0.5 rounded border-border-base bg-input-bg text-accent focus:ring-0 w-4 h-4"
                       />
                       <div>
                         <span className="text-sm font-medium text-text-primary block">Data URI Scheme</span>
                         <span className="text-xs text-text-secondary">Include 'data:image/...' prefix</span>
                       </div>
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-text-secondary">Name:</span>
                         <span className="text-text-primary truncate max-w-[150px]">{selectedFile.name}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-text-secondary">Size:</span>
                         <span className="text-text-primary">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-text-secondary">Type:</span>
                         <span className="text-text-primary">{selectedFile.type}</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Output Section */}
            <div className="flex-1 min-h-0 flex flex-col">
               <div className="flex items-center justify-between mb-2 px-1">
                 <div className="text-sm font-medium text-text-secondary">Base64 Output</div>
                 {generatedBase64 && (
                   <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(getHtmlTag(), 'html')} 
                        className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-hover-overlay transition-colors"
                      >
                         {copyFeedback === 'html' ? <CheckCircle2 size={12} className="text-green-500" /> : <FileCode size={12} />} 
                         <span>HTML Tag</span>
                      </button>
                      <button 
                        onClick={() => copyToClipboard(getCssBg(), 'css')} 
                        className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 px-2 py-1 rounded hover:bg-hover-overlay transition-colors"
                      >
                         {copyFeedback === 'css' ? <CheckCircle2 size={12} className="text-green-500" /> : <FileCode size={12} />} 
                         <span>CSS CSS</span>
                      </button>
                   </div>
                 )}
               </div>
               
               <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden relative group">
                  <textarea 
                    readOnly 
                    value={getFormattedOutput()}
                    className="w-full h-full bg-transparent resize-none p-4 font-mono text-xs leading-5 text-accent focus:outline-none placeholder-text-secondary"
                    placeholder="Base64 string will appear here..."
                  />
                  {generatedBase64 && (
                     <button 
                       onClick={() => copyToClipboard(getFormattedOutput(), 'main')}
                       className="absolute bottom-4 right-4 bg-element-bg hover:brightness-110 text-text-primary px-4 py-2 rounded-md shadow-lg border border-border-base flex items-center space-x-2 transition-all active:scale-95"
                     >
                        {copyFeedback === 'main' ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
                        <span className="text-sm font-medium">{copyFeedback === 'main' ? 'Copied' : 'Copy String'}</span>
                     </button>
                  )}
               </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-5xl mx-auto w-full h-full">
            
            {/* Input Side */}
            <div className="flex-1 flex flex-col min-w-0">
               <div className="flex items-center justify-between mb-2 px-1">
                 <div className="text-sm font-medium text-text-secondary">Base64 Input</div>
                 <button onClick={() => { setBase64Input(''); setImgPreviewUrl(null); }} className="text-xs text-text-secondary hover:text-red-400 flex items-center gap-1 transition-colors">
                   <Trash2 size={12} /> Clear
                 </button>
               </div>
               <div className="flex-1 bg-panel-bg rounded-lg border border-border-base overflow-hidden focus-within:border-accent transition-colors">
                  <textarea 
                    value={base64Input}
                    onChange={(e) => setBase64Input(e.target.value)}
                    className="w-full h-full bg-transparent resize-none p-4 font-mono text-xs leading-5 text-text-primary focus:outline-none placeholder-text-secondary"
                    placeholder="Paste Base64 string here..."
                  />
               </div>
            </div>

            {/* Preview Side */}
            <div className="flex-1 flex flex-col min-w-0">
               <div className="flex items-center justify-between mb-2 px-1">
                 <div className="text-sm font-medium text-text-secondary">Preview</div>
               </div>
               <div className="flex-1 bg-panel-bg border border-border-base rounded-lg p-6 flex items-center justify-center relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ib3BhY2l0eSI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzMzIiBmaWxsLW9wYWNpdHk9IjAuMDUiIC8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iMC4wNSIgLz48L3N2Zz4=')]">
                  
                  {imgPreviewUrl ? (
                    <>
                      <img src={imgPreviewUrl} alt="Decoded" className="max-w-full max-h-full object-contain shadow-lg rounded" />
                      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                         <button 
                           onClick={handleDownload}
                           className="flex items-center space-x-2 px-6 py-2 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-all shadow-lg active:scale-95"
                         >
                           <Download size={16} />
                           <span>Download</span>
                         </button>
                      </div>
                    </>
                  ) : imgError ? (
                    <div className="text-center text-red-400">
                      <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Invalid Base64 Image Data</p>
                    </div>
                  ) : (
                    <div className="text-center text-text-secondary opacity-40">
                      <ImageIcon size={48} className="mx-auto mb-2" />
                      <p>Preview will appear here</p>
                    </div>
                  )}

               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};