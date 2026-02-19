import { LucideIcon } from 'lucide-react';

interface ConstructionPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  emoji?: string;
}

export function ConstructionPage({ 
  title, 
  description = "This section is currently under construction.", 
  icon: Icon,
  emoji
}: ConstructionPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-6 p-8 animate-in fade-in zoom-in-95 duration-500">
       <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20" />
          <div className="w-24 h-24 bg-card border border-border rounded-3xl shadow-xl flex items-center justify-center relative z-10 transform rotate-3 transition-transform hover:rotate-0 duration-300">
              {Icon ? (
                <Icon size={40} className="text-primary" />
              ) : (
                <span className="text-4xl">{emoji || '🚧'}</span>
              )}
          </div>
       </div>
       
       <div className="max-w-md space-y-2">
         <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
         <p className="text-muted-foreground text-lg">{description}</p>
       </div>

       <div className="flex gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" />
       </div>
    </div>
  );
}
