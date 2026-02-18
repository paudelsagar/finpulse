'use client';

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border w-full md:w-auto overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-1.5 text-sm font-bold rounded-md transition-all whitespace-nowrap
            ${activeTab === tab.id 
              ? 'bg-background text-foreground shadow-sm border border-border/50' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TabsContentProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
}

export function TabsContent({ value, activeTab, children }: TabsContentProps) {
  if (value !== activeTab) return null;
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {children}
    </div>
  );
}
