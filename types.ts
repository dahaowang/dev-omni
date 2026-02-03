export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'favorites' | 'converters' | 'generators' | 'text' | 'all';
}

export type ToolType = 'json' | 'sql' | 'url' | 'hash' | 'diff' | 'dedupe' | 'base64' | 'number';