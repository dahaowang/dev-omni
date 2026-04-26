import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  CheckCircle2, 
  Palette,
  Pipette,
  ChevronDown
} from 'lucide-react';
import {
  PaneHeader,
  StatusBadge,
  ToolButton,
  ToolHeader,
  ToolPane,
  ToolShell
} from '../common/ToolChrome';

interface ColorPickerToolProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  toolLabel: string;
  initialValue?: string;
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

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

type PaletteType = 'analogous' | 'monochromatic' | 'triadic' | 'complementary' | 'split-complementary';

export const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ isSidebarOpen, toggleSidebar, toolLabel, initialValue }) => {
  const [color, setColor] = useState<string>('#6366f1'); // Default to Accent Color
  const [paletteType, setPaletteType] = useState<PaletteType>('analogous');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setColor(initialValue);
    }
  }, [initialValue]);

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

  const getPalette = (): string[] => {
    const { h, s, l } = hsl;
    const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
    
    switch (paletteType) {
      case 'analogous':
        return [
          hslToHex((h - 30 + 360) % 360, s, l),
          hslToHex((h - 15 + 360) % 360, s, l),
          hslToHex(h, s, l),
          hslToHex((h + 15) % 360, s, l),
          hslToHex((h + 30) % 360, s, l),
        ];
      case 'monochromatic':
        return [
          hslToHex(h, s, clamp(l - 30)),
          hslToHex(h, s, clamp(l - 15)),
          hslToHex(h, s, l),
          hslToHex(h, s, clamp(l + 15)),
          hslToHex(h, s, clamp(l + 30)),
        ];
      case 'triadic':
        return [
          hslToHex(h, s, l),
          hslToHex((h + 120) % 360, s, l),
          hslToHex((h + 240) % 360, s, l),
          hslToHex(h, clamp(s - 30), clamp(l + 10)),
          hslToHex((h + 120) % 360, clamp(s - 30), clamp(l + 10)),
        ];
      case 'complementary':
        return [
           hslToHex(h, s, l),
           hslToHex((h + 180) % 360, s, l),
           hslToHex(h, s, clamp(l + 20)),
           hslToHex((h + 180) % 360, s, clamp(l + 20)),
           hslToHex(h, clamp(s - 20), l)
        ];
      case 'split-complementary':
        return [
           hslToHex(h, s, l),
           hslToHex((h + 150) % 360, s, l),
           hslToHex((h + 210) % 360, s, l),
           hslToHex((h + 150) % 360, clamp(s - 20), clamp(l + 10)),
           hslToHex((h + 210) % 360, clamp(s - 20), clamp(l + 10)),
        ];
      default:
        return [color];
    }
  };

  const paletteColors = getPalette();

  return (
    <ToolShell>
      <ToolHeader icon={<Palette />} title={toolLabel} subtitle="HEX · RGB · HSL · CMYK · palette">
        <StatusBadge>{color.toUpperCase()}</StatusBadge>
        <ToolButton onClick={triggerColorPicker} icon={<Pipette />}>
          Pick color
        </ToolButton>
      </ToolHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_320px]">
        <ToolPane className="border-b border-border-base lg:border-b-0 lg:border-r">
          <PaneHeader title="Canvas" meta={paletteType.replace('-', ' ')} />
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            <div
              className="group relative h-[220px] cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-border-base shadow-[var(--shadow-md)] transition-transform active:scale-[0.995]"
              style={{
                background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 50%, #000))`
              }}
              onClick={triggerColorPicker}
            >
              <div className="absolute left-[62%] top-[38%] h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)]" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 transition-opacity group-hover:opacity-100">
                <Pipette className="text-white drop-shadow" size={30} />
              </div>
              <input
                ref={colorInputRef}
                type="color"
                value={color}
                onChange={handleColorChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            <div className="grid grid-cols-5 gap-2">
              {paletteColors.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-border-base transition-transform hover:scale-[1.03]"
                  style={{ backgroundColor: c }}
                  onClick={() => handleCopy(c, `p-${i}`)}
                  title={c}
                >
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 font-mono text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {copyFeedback === `p-${i}` ? <CheckCircle2 size={15} /> : c}
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-[var(--radius)] border border-border-base bg-panel-bg p-4">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-3)]">Manual Hex</label>
              <div className="flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-border-base bg-input-bg px-2 font-mono text-sm">
                <span className="h-4 w-4 rounded-full border border-border-base" style={{ backgroundColor: color }} />
                <input
                  type="text"
                  defaultValue={color}
                  key={color}
                  onBlur={handleManualHexChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualHexChange(e as any);
                  }}
                  placeholder="#RRGGBB"
                  className="min-w-0 flex-1 bg-transparent uppercase outline-none"
                />
              </div>
            </div>
          </div>
        </ToolPane>

        <ToolPane className="bg-sidebar-bg">
          <PaneHeader
            title="Values"
            meta="copy formats"
            actions={
              <div className="relative">
                <select
                  value={paletteType}
                  onChange={(e) => setPaletteType(e.target.value as PaletteType)}
                  className="h-[24px] appearance-none rounded-[var(--radius-sm)] border border-border-base bg-element-bg pl-2 pr-7 text-[11px] font-medium outline-none focus:border-accent"
                >
                  <option value="analogous">Analogous</option>
                  <option value="monochromatic">Monochromatic</option>
                  <option value="complementary">Complementary</option>
                  <option value="split-complementary">Split Complementary</option>
                  <option value="triadic">Triadic</option>
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary" />
              </div>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
            {formats.map((fmt) => (
              <div
                key={fmt.label}
                className="grid grid-cols-[72px_1fr_auto] items-center gap-2 rounded-[var(--radius)] border border-border-base bg-panel-bg px-3 py-2"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-3)]">{fmt.label}</span>
                <span className="truncate font-mono text-xs text-text-primary" title={fmt.value}>{fmt.value}</span>
                <ToolButton
                  onClick={() => handleCopy(fmt.value, fmt.label)}
                  icon={copyFeedback === fmt.label ? <CheckCircle2 /> : <Copy />}
                  variant="ghost"
                  className="px-2"
                  title="Copy"
                />
              </div>
            ))}
          </div>
        </ToolPane>
      </div>
    </ToolShell>
  );
};
