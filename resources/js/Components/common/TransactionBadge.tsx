import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TransactionType =
    | 'deposit'
    | 'withdrawal'
    | 'transfer'
    | 'capital_deposit'
    | 'capital_withdrawal'
    | 'profit_distribution'
    | 'profit_withdrawal'
    | 'expense'
    | string;

interface TransactionBadgeProps {
    type: TransactionType;
    className?: string;
}

export function TransactionBadge({ type, className }: TransactionBadgeProps) {
    const config: Record<string, { label: string; className: string }> = {
        deposit: {
            label: 'إيداع نقدي',
            className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
        },
        withdrawal: {
            label: 'سحب نقدي',
            className: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
        },
        transfer: {
            label: 'تحويل مالي',
            className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
        },
        capital_deposit: {
            label: 'إيداع رأس مال',
            className: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
        },
        capital_withdrawal: {
            label: 'سحب رأس مال',
            className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
        },
        profit_distribution: {
            label: 'إثبات أرباح',
            className: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
        },
        profit_withdrawal: {
            label: 'صرف أرباح',
            className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
        },
        expense: {
            label: 'مصروف تشغيلي',
            className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
        },
    };

    const current = config[type] || {
        label: type,
        className: 'bg-muted text-muted-foreground border-border',
    };

    return (
        <Badge
            variant="outline"
            className={cn('text-[10px] sm:text-[11px] font-medium px-2 py-0.5 whitespace-nowrap', current.className, className)}
        >
            {current.label}
        </Badge>
    );
}

