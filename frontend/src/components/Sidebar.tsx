"use client";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Store,
  TrendingUp,
  Users, // Added Zap icon
  X // Added X icon
  ,

  Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react"; // Added useEffect
import { ThemeToggle } from "./ThemeToggle";

type MenuItem = {
  icon: any;
  label: string;
  href: string;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: CreditCard, label: "Transactions", href: "/transactions" },
      { icon: Users, label: "Users", href: "/users" },
      { icon: Store, label: "Merchants", href: "/merchants" },
      { icon: Zap, label: "Engagement", href: "/engagement" },
      { icon: TrendingUp, label: "Revenue", href: "/revenue" },
    ],
  },
  {
    label: "Management",
    items: [
      { icon: Users, label: "Users", href: "/admin/users" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: Bell, label: "Notifications", href: "/notifications" },
      { icon: Settings, label: "Settings", href: "/settings" },
      { icon: HelpCircle, label: "Help", href: "/help" },
    ],
  },
];

export function Sidebar({ 
  defaultCollapsed = false,
  isOpen = false,
  onClose
}: { 
  defaultCollapsed?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Tablet Rail Logic: Default to icons only on tablet screens
  useEffect(() => {
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    if (isTablet) {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    document.cookie = `sidebar:state=${newState}; path=/; max-age=31536000`;
  };

  return (
    <>
      {/* Tablet Overlay Backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-background/40 backdrop-blur-[2px] z-[90] hidden md:block lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside 
        className={`h-screen bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col fixed lg:sticky top-0 z-[100] lg:z-50
          ${isOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-64"}
          ${!isCollapsed && "shadow-2xl lg:shadow-none"}
        `}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border relative justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <img src="/logo.png" alt="FinPulse" className="h-8 w-8 rounded-lg" />
            {(!isCollapsed || isOpen) && (
              <span className="font-bold text-xl text-primary tracking-tight whitespace-nowrap">
                Fin<span className="text-foreground">Pulse</span>
              </span>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

         {/* Toggle Button - Circular on Border (Desktop & Tablet Only) */}
         <button 
            onClick={toggleSidebar}
            className="hidden md:flex absolute -right-3 top-14 h-6 w-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-[60] shadow-sm"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

        {/* Grouped Menu */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx} className="px-3">
              {(!isCollapsed || isOpen) && group.label && (
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  {group.label}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => (
                  <Link 
                    key={itemIdx} 
                    href={item.href}
                    onClick={onClose}
                    className="group relative flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all hover:z-50"
                  >
                    <item.icon size={20} />
                    
                    {(!isCollapsed || isOpen) ? (
                      <span className="font-medium text-sm">{item.label}</span>
                    ) : (
                      /* Tooltip for collapsed state */
                      <div className="absolute left-full ml-4 px-2 py-1.5 bg-popover border border-border rounded-md shadow-lg text-xs font-semibold text-popover-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] translate-x-1 group-hover:translate-x-0">
                        {item.label}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
              {(isCollapsed && !isOpen) && <div className="h-px bg-border mx-2 mt-4" />}
            </div>
          ))}
        </div>

        {/* Footer / User Profile & Theme */}
        <div className="p-3 border-t border-border mt-auto">
          {(isCollapsed && !isOpen) ? (
            <div className="flex flex-col items-center gap-4">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  JD
               </div>
               <ThemeToggle />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-1">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                  JD
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">Administrator</p>
               </div>
               <div className="scale-90">
                 <ThemeToggle />
               </div>
            </div>
          )}
        </div>
      </aside>

      {/* Layout Spacer - Keeps the content pushed by the rail width on tablet (md) */}
      <div className="hidden md:block lg:hidden w-20 shrink-0 transition-all duration-300 ease-in-out" />
    </>
  );
}
