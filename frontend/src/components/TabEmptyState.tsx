import { LucideIcon } from 'lucide-react';

interface TabEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function TabEmptyState({ icon: Icon, title, description, action }: TabEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-dashed border-border rounded-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}
