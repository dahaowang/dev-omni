import React, { useState, useEffect, useRef } from 'react';
import { 
  PanelLeft, 
  Copy, 
  CheckCircle2, 
  Palette,
  RefreshCw,
  Pipette
} from 'lucide-react';

interface ColorPickerToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
}

interface ColorFormat {
  label: string;
  value: string;
}

// --- Color Utils ---

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const rgbToCmyk = (r: number, g: number, b: number) => {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));

  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);

  c = Math.round(c * 10000) / 100;
  m = Math.round(m * 10000) / 100;
  y = Math.round(y * 10000) / 100;
  k = Math.round(k * 10000) / 100;

  c = isNaN(c) ? 0 : c;
  m = isNaN(m) ? 0 : m;
  y = isNaN(y) ? 0 : y;
  k = isNaN(k) ? 0 : k;

  return { c, m, y, k };
};

export const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel }) => {
  const [color, setColor] = useState<string>('#6366f1'); // Default to Accent Color
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Derived values
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  const formats: ColorFormat[] = [
    { label: 'HEX', value: color.toUpperCase() },
    { label: 'HEX (No Hash)', value: color.substring(1).toUpperCase() },
    { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { label: 'RGBA', value: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)` },
    { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { label: 'CMYK', value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const handleManualHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Basic hex validation to allow typing
    if (/^#?([0-9A-F]{0,6})$/i.test(val)) {
        // If strict validity needed, check length, but usually we just let them type
        // For sync with color picker, we need a valid 6 char hex
        if (/^#([0-9A-F]{6})$/i.test(val)) {
             setColor(val);
        } else if (/^([0-9A-F]{6})$/i.test(val)) {
             setColor('#' + val);
        }
    }
  };

  const triggerColorPicker = () => {
    colorInputRef.current?.click();
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
          <h2 className="text-sm font-semibold text-text-primary tracking-wide mr-6">{toolLabel}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
          
          {/* Left Column: Visual Picker */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
             <div 
               className="aspect-square rounded-2xl shadow-lg border border-border-base relative group overflow-hidden cursor-pointer transition-transform active:scale-[0.99]"
               style={{ backgroundColor: color }}
               onClick={triggerColorPicker}
             >
                {/* Overlay Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                   <Pipette className="text-white mb-2" size={32} />
                   <span className="text-white font-medium text-sm drop-shadow-md">Click to Change</span>
                </div>
                
                {/* Hidden Native Picker */}
                <input 
                  ref={colorInputRef}
                  type="color" 
                  value={color} 
                  onChange={handleColorChange} 
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                />
             </div>

             {/* Manual Hex Input */}
             <div className="bg-panel-bg rounded-lg border border-border-base p-4">
               <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Manual Hex</label>
               <div className="flex items-center space-x-2">
                 <div className="w-4 h-4 rounded-full border border-border-base" style={{backgroundColor: color}}></div>
                 <input 
                   type="text" 
                   defaultValue={color}
                   // Use key to force re-render if color changes externally
                   key={color}
                   onBlur={handleManualHexChange}
                   onKeyDown={(e) => {
                       if (e.key === 'Enter') handleManualHexChange(e as any);
                   }}
                   placeholder="#RRGGBB"
                   className="flex-1 bg-transparent text-text-primary font-mono text-sm focus:outline-none uppercase"
                 />
               </div>
             </div>
          </div>

          {/* Right Column: Formats & Codes */}
          <div className="flex-1 flex flex-col gap-4">
            
             <div className="grid grid-cols-1 gap-3">
               {formats.map((fmt, idx) => (
                 <div 
                   key={idx} 
                   className="group bg-panel-bg border border-border-base rounded-lg p-4 flex items-center justify-between hover:border-accent/50 transition-colors"
                 >
                   <div className="min-w-0 flex-1 mr-4">
                      <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">
                        {fmt.label}
                      </div>
                      <div className="font-mono text-base text-text-primary truncate select-all">
                        {fmt.value}
                      </div>
                   </div>
                   
                   <button
                     onClick={() => handleCopy(fmt.value, fmt.label)}
                     className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-element-bg border border-transparent hover:border-border-base transition-all active:scale-95 shrink-0"
                     title="Copy"
                   >
                     {copyFeedback === fmt.label ? (
                       <CheckCircle2 size={18} className="text-green-500" />
                     ) : (
                       <Copy size={18} />
                     )}
                   </button>
                 </div>
               ))}
             </div>

             {/* Simple Palette Preview */}
             <div className="bg-panel-bg border border-border-base rounded-lg p-4">
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Variations (Lightness)</div>
                <div className="flex h-12 rounded-md overflow-hidden border border-border-base">
                  {[10, 30, 50, 70, 90].map((l) => (
                     <div 
                       key={l}
                       className="flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                       style={{ backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${l}%)` }}
                       title={`hsl(${hsl.h}, ${hsl.s}%, ${l}%)`}
                       onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${l}%)`, `l-${l}`)}
                     />
                  ))}
                </div>
                <div className="text-[10px] text-text-secondary mt-2 text-center">Click swatch to copy HSL</div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
};