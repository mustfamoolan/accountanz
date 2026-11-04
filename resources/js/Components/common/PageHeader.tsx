import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    badge?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    badge,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background p-4 sm:p-6 rounded-xl border border-border shadow-xs',
                className
            )}
            dir="rtl"
        >
            <div className="flex items-center gap-3 min-w-0">
                {Icon && (
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                            {title}
                        </h1>
                        {badge}
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none">
                    {actions}
                </div>
            )}
        </div>
    );
}

