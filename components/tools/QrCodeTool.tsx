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
          // --- Generator View ---
          <div className="max-w-4xl mx-auto w-full flex flex-col md:flex-row gap-8 h-full">
             <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                   <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Content</label>
                   <div className="flex-1 bg-panel-bg rounded-lg border border-border-base p-4 focus-within:border-accent transition-colors shadow-sm">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter text or URL to generate QR code..."
                        className="w-full h-48 bg-transparent resize-none outline-none text-text-primary placeholder-text-secondary font-mono text-sm"
                      />
                   </div>
                   <p className="text-xs text-text-secondary">Type to update QR code automatically.</p>
                </div>
             </div>

             <div className="w-full md:w-80 flex flex-col items-center justify-center">
                <div className="p-6 bg-panel-bg rounded-xl shadow-lg border border-border-base mb-6">
                   {qrImage ? (
                     <img src={qrImage} alt="QR Code" className="w-48 h-48 object-contain rounded-sm" />
                   ) : (
                     <div className="w-48 h-48 flex items-center justify-center text-text-secondary opacity-30">
                       <ScanLine size={48} />
                     </div>
                   )}
                </div>

                {/* Color Controls */}
                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Foreground</label>
                      <div className="flex items-center gap-2 bg-panel-bg border border-border-base rounded-lg p-1.5 hover:border-accent/50 transition-colors">
                         <input 
                           type="color" 
                           value={fgColor}
                           onChange={(e) => setFgColor(e.target.value)}
                           className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                           title="Select Foreground Color"
                         />
                         <span className="text-xs font-mono text-text-primary uppercase flex-1 truncate">{fgColor}</span>
                      </div>
                   </div>
                   <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Background</label>
                      <div className="flex items-center gap-2 bg-panel-bg border border-border-base rounded-lg p-1.5 hover:border-accent/50 transition-colors">
                         <input 
                           type="color" 
                           value={bgColor}
                           onChange={(e) => setBgColor(e.target.value)}
                           className="w-6 h-6 rounded cursor-pointer border-none p-0 bg-transparent"
                           title="Select Background Color"
                         />
                         <span className="text-xs font-mono text-text-primary uppercase flex-1 truncate">{bgColor}</span>
                      </div>
                   </div>
                </div>
                
                <button
                  onClick={downloadQR}
                  disabled={!qrImage}
                  className="flex items-center space-x-2 px-6 py-2 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <Download size={16} />
                   <span>Download PNG</span>
                </button>
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