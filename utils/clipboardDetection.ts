import { ToolType } from '../types';

interface DetectionResult {
  tool: ToolType;
  content: string;
  label: string;
}

export const analyzeClipboard = (text: string): DetectionResult | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. JWT (3 parts, dot separated, base64ish)
  // Regex: start, base64url chars, dot, base64url chars, dot, base64url chars, end
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  if (trimmed.length > 20 && jwtRegex.test(trimmed)) {
    return { tool: 'jwt', content: trimmed, label: 'JWT Token' };
  }

  // 2. JSON (Try parsing)
  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return { tool: 'json', content: trimmed, label: 'JSON Data' };
    } catch (e) {
      // Not valid JSON
    }
  }

  // 3. SQL (Common keywords at start)
  const sqlKeywords = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|BEGIN|COMMIT)/i;
  if (sqlKeywords.test(trimmed)) {
    return { tool: 'sql', content: trimmed, label: 'SQL Query' };
  }

  // 4. Hex Color
  if (/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(trimmed)) {
    // Ensure it has hash for consistency
    const content = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    return { tool: 'color', content, label: 'Hex Color' };
  }

  // 5. URL
  if (/^https?:\/\//i.test(trimmed)) {
    return { tool: 'url', content: trimmed, label: 'URL' };
  }

  // 6. Timestamp (10 digits (seconds) or 13 digits (ms))
  // Range check: 1973 (100000000) to 2286 (9999999999) roughly for seconds
  // Or larger for MS.
  if (/^\d{10}$/.test(trimmed) || /^\d{13}$/.test(trimmed)) {
    return { tool: 'timestamp', content: trimmed, label: 'Timestamp' };
  }

  // 7. Cron (5 or 6 parts)
  // Basic check: split by space, check length, check common chars
  const cronParts = trimmed.split(/\s+/);
  if (cronParts.length >= 5 && cronParts.length <= 6) {
    // Check if parts contain only valid cron chars (*, 0-9, /, -, ,)
    const isValidCron = cronParts.every(part => /^[\d*\/,\-]+$/.test(part));
    if (isValidCron) {
        return { tool: 'cron', content: trimmed, label: 'Cron Expression' };
    }
  }

  return null;
};