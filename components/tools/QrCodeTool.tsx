import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Download, 
  Upload, 
  Image as ImageIcon, 
  ArrowRightLeft,
  Copy,
  CheckCircle2,
  ScanLine,
  Palette
} from 'lucide-react';
// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import jsQR from 'jsqr';

interface QrCodeToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

type Mode = 'generate' | 'read';

export const QrCodeTool: React.FC<QrCodeToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [mode, setMode] = useState<Mode>('generate');
  
  // Generator State
  const [inputText, setInputText] = useState('https://example.com');
  const [qrImage, setQrImage] = useState<string>('');
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  
  // Reader State
  const [scannedText, setScannedText] = useState<string>('');
  const [readerError, setReaderError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // --- Generator Logic ---
  useEffect(() => {
    if (mode === 'generate') {
      generateQR(inputText);
    }
  }, [inputText, mode, fgColor, bgColor]);

  const generateQR = async (text: string) => {
    if (!text.trim()) {
      setQrImage('');
      return;
    }
    try {
      const url = await QRCode.toDataURL(text, {
        width: 800,
        margin: 2,
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

  // --- Reader Logic ---
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input
    e.target.value = '';
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const image = new Image();
      image.onload = () => {
        scanImage(image);
      };
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

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (mode !== 'read') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) processFile(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(scannedText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
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
               onClick={() => setMode('generate')}
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'generate'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               Generate
             </button>
             <button
               onClick={() => setMode('read')}
               className={`px-3 py-1 text-xs font-medium rounded-sm transition-all ${
                 mode === 'read'
                   ? 'bg-element-bg text-text-primary shadow-sm' 
                   : 'text-text-secondary hover:text-text-primary'
               }`}
             >
               Read
             </button>
           </div>
           
           <div className="w-px h-4 bg-border-base mx-1" />

           <button 
              onClick={() => setMode(mode === 'generate' ? 'read' : 'generate')}
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-hover-overlay rounded transition-colors"
              title="Switch Mode"
           >
              <ArrowRightLeft size={16} />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {mode === 'generate' ? (
          // --- Generator View (Vertical Layout) ---
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 h-full">
             
             {/* Input Section */}
             <div className="flex-1 flex flex-col min-h-0 bg-panel-bg border border-border-base rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-border-base bg-sidebar-bg/30">
                   <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Content</span>
                   <span className="text-[10px] text-text-secondary">Updates automatically</span>
                </div>
                <div className="flex-1 relative">
                   <textarea
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     placeholder="Enter text or URL to generate QR code..."
                     className="w-full h-full bg-app-bg resize-none outline-none text-text-primary placeholder-text-secondary font-mono text-sm p-4 leading-relaxed"
                     spellCheck={false}
                   />
                </div>
             </div>

             {/* Output & Controls Section */}
             <div className="shrink-0 flex flex-col md:flex-row gap-6">
                
                {/* QR Preview */}
                <div className="flex-1 bg-panel-bg border border-border-base rounded-lg p-6 flex items-center justify-center min-h-[240px] shadow-sm">
                   {qrImage ? (
                     <div className="bg-white p-3 rounded-lg shadow-sm">
                        <img src={qrImage} alt="QR Code" className="w-48 h-48 object-contain" />
                     </div>
                   ) : (
                     <div className="w-48 h-48 flex flex-col items-center justify-center text-text-secondary opacity-30">
                       <ScanLine size={48} strokeWidth={1} />
                       <span className="text-sm mt-2 font-medium">Preview</span>
                     </div>
                   )}
                </div>

                {/* Settings Panel */}
                <div className="w-full md:w-72 bg-panel-bg border border-border-base rounded-lg p-5 flex flex-col gap-5 shadow-sm">
                   <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Foreground</label>
                         <div className="flex items-center gap-3 bg-app-bg border border-border-base rounded-md p-2 px-3 hover:border-accent/50 transition-colors group cursor-pointer relative">
                            <div className="w-6 h-6 rounded border border-border-base shadow-sm" style={{ backgroundColor: fgColor }}></div>
                            <span className="text-xs font-mono text-text-primary">{fgColor}</span>
                            <input 
                              type="color" 
                              value={fgColor}
                              onChange={(e) => setFgColor(e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                         </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Background</label>
                         <div className="flex items-center gap-3 bg-app-bg border border-border-base rounded-md p-2 px-3 hover:border-accent/50 transition-colors group cursor-pointer relative">
                            <div className="w-6 h-6 rounded border border-border-base shadow-sm" style={{ backgroundColor: bgColor }}></div>
                            <span className="text-xs font-mono text-text-primary">{bgColor}</span>
                            <input 
                              type="color" 
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="h-px bg-border-base/50" />
                   
                   <button
                     onClick={downloadQR}
                     disabled={!qrImage}
                     className="mt-auto flex items-center justify-center space-x-2 px-4 py-2.5 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                   >
                      <Download size={16} />
                      <span>Download PNG</span>
                   </button>
                </div>

             </div>
          </div>
        ) : (
          // --- Reader View ---
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 h-full items-center justify-center">
             
             {/* Upload Area */}
             <div 
               className="w-full bg-panel-bg border-2 border-dashed border-border-base rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-hover-overlay transition-all group"
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
                  onChange={handleFileUpload}
                />
                <div className="mb-4 p-4 rounded-full bg-element-bg group-hover:bg-accent/10 transition-colors">
                   <ImageIcon size={32} className="text-text-secondary group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Click or Drop Image Here</h3>
                <p className="text-sm text-text-secondary text-center">
                  Supports .png, .jpg, .jpeg<br/>
                  Or paste image from clipboard (Ctrl+V)
                </p>
             </div>

             {/* Result Area */}
             <div className="w-full space-y-2">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Decoded Result</span>
                   {scannedText && (
                     <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                       <CheckCircle2 size={12} /> Success
                     </span>
                   )}
                </div>
                
                <div className={`w-full p-4 rounded-lg border ${
                   readerError ? 'bg-red-500/5 border-red-500/20' : 'bg-panel-bg border-border-base'
                } min-h-[5rem] relative`}>
                   
                   {readerError ? (
                     <div className="text-red-400 text-sm flex items-center gap-2">
                       <ScanLine size={16} />
                       {readerError}
                     </div>
                   ) : (
                     <div className="text-text-primary font-mono text-sm break-all pr-10">
                       {scannedText || <span className="text-text-secondary opacity-50 italic">Upload an image to see content...</span>}
                     </div>
                   )}

                   {scannedText && (
                      <button 
                        onClick={handleCopy}
                        className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary bg-element-bg hover:bg-border-base rounded-md transition-colors"
                        title="Copy text"
                      >
                         {copyFeedback ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                   )}
                </div>
             </div>

          </div>
        )}
      </div>
    </div>
  );
};