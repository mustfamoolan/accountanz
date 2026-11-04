import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Filter, X } from 'lucide-react';

export interface FilterItem {
    id: string | number | null;
    label: string;
    count?: number;
    badge?: ReactNode;
}

interface FilterBarProps {
    items: FilterItem[];
    selectedId: string | number | null;
    onSelect: (id: any) => void;
    title?: string;
    onClear?: () => void;
    className?: string;
}

export function FilterBar({
    items,
    selectedId,
    onSelect,
    title = 'تصفية حسب:',
    onClear,
    className,
}: FilterBarProps) {
    return (
        <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/40 border border-border/80 text-xs', className)} dir="rtl">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 sm:pb-0">
                <span className="text-muted-foreground font-semibold flex items-center gap-1 shrink-0 ml-1">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                    <span>{title}</span>
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                    {items.map((item) => {
                        const isSelected = selectedId === item.id;
                        return (
                            <button
                                key={String(item.id)}
                                type="button"
                                onClick={() => onSelect(item.id)}
                                className={cn(
                                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5',
                                    isSelected
                                        ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                                        : 'bg-background hover:bg-muted text-muted-foreground border border-border'
                                )}
                            >
                                <span>{item.label}</span>
                                {item.count !== undefined && (
                                    <span className={cn(
                                        'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                                        isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
                                    )}>
                                        {item.count}
                                    </span>
                                )}
                                {item.badge}
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedId && onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive shrink-0 self-end sm:self-auto cursor-pointer"
                >
                    <X className="h-3 w-3" />
                    <span>إلغاء التصفية</span>
                </button>
            )}
        </div>
    );
}

