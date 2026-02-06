export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'favorites' | 'converters' | 'generators' | 'text' | 'all';
}

export type ToolType = 'json' | 'sql' | 'url' | 'hash' | 'diff' | 'dedupe' | 'base64' | 'number' | 'yaml' | 'timestamp' | 'color' | 'random-string' | 'qrcode' | 'text-joiner' | 'image-base64';