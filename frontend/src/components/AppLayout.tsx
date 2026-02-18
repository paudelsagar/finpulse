"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export default function AppLayout({ 
  children, 
  defaultCollapsed = false 
}: { 
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90] md:hidden cursor-pointer animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar 
        defaultCollapsed={defaultCollapsed} 
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
         {/* Top Header for Mobile */}
         <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center px-4 justify-between md:hidden shrink-0">
             <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-lg" />
                <span className="font-bold text-lg tracking-tight">FinPulse</span>
             </div>
             
             <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-all hover:bg-muted rounded-lg"
             >
                <Menu size={20} />
             </button>
         </header>
         
         <main className="flex-1 overflow-auto relative">
            {children}
         </main>
      </div>
    </div>
  );
}
