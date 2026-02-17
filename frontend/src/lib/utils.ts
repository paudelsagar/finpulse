import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number, currency = 'USD', minimumFractionDigits = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number, minimumFractionDigits = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Formats a large number into a short string (e.g., 1.2M) IF requested,
 * coupled with the full value in tooltip or detailed view.
 * But user specifically asked for full precision ("remainder"), so we default to standard format.
 */
export const formatCompactNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(num);
}

export const formatSplitCurrency = (num: number, currency = 'USD') => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  
  // formatted is like "12,345,678.90"
  const parts = formatted.split(',');
  
  if (parts.length === 1) {
    return { major: '', remainder: formatCurrency(num, currency) };
  }
  
  // More than 1 part means >= 1,000
  // Determine unit based on number of commas
  // 1 comma: 1,000 (K) -> parts=[1, 234.56]
  // 2 commas: 1,000,000 (M) -> parts=[1, 234, 567.89]
  // 3 commas: 1,000,000,000 (B) -> parts=[1, 234, 567, 890.12]
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const unitIndex = parts.length - 1;
  const unit = units[unitIndex] || '';
  
  // Major is the first part + unit
  const symbol = currency === 'USD' ? '$' : ''; // simplified symbol logic
  const major = `${symbol}${parts[0]}${unit}`;
  
  // Remainder is the rest joined back
  const remainder = parts.slice(1).join(',');
  
  return { major, remainder };
};

export const formatRichCurrency = (num: number, currency = 'USD', decimals = 2) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
  
  // formatted: "13,602,363.95" -> parts: ["13", "602", "363.95"]
  const parts = formatted.split(',');
  
  // Mapping units from right to left: [base, K, M, B, T]
  const allUnits = ['', 'K', 'M', 'B', 'T'];
  
  // Calculate unit for the first part
  // if length is 3 (M), index 0 is M, index 1 is K, index 2 is base
  // logical index = parts.length - 1 - i
  
  return parts.map((part, i) => {
    const unitIndex = parts.length - 1 - i;
    const unit = allUnits[unitIndex] || '';
    
    // Add currency symbol to the very first part only
    const prefix = (i === 0 && currency === 'USD') ? '$' : '';
    
    return {
      value: `${prefix}${part}`,
      unit: unit
    };
  });
};
export const formatRichNumber = (num: number) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  
  const parts = formatted.split(',');
  const allUnits = ['', 'K', 'M', 'B', 'T'];
  
  return parts.map((part, i) => {
    const unitIndex = parts.length - 1 - i;
    const unit = allUnits[unitIndex] || '';
    
    return {
      value: part,
      unit: unit
    };
  });
};

export const formatRelativeTime = (date: string | number) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};
