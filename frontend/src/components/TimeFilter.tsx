"use client";

import { Calendar } from "lucide-react";

interface TimeFilterProps {
  value: string;
  onChange: (value: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  className?: string;
}

export const TIME_OPTIONS = [
  { value: "15m", label: "Last 15 Minutes" },
  { value: "1h", label: "Last Hour" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "365d", label: "Last Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

export default function TimeFilter({ 
  value, 
  onChange, 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  className = "" 
}: TimeFilterProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 shadow-sm">
        <Calendar size={16} className="text-muted-foreground" />
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-foreground font-semibold text-sm focus:outline-none cursor-pointer h-7"
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {value === 'custom' && (
        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="bg-card border border-border rounded-xl px-2 py-1.5 shadow-sm flex items-center h-10">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer w-[110px]"
            />
          </div>
          <span className="text-muted-foreground opacity-30">→</span>
          <div className="bg-card border border-border rounded-xl px-2 py-1.5 shadow-sm flex items-center h-10">
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer w-[110px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
