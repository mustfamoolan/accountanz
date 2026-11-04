import React from 'react';
import { cn } from '@/lib/utils';

interface MoneyDisplayProps {
    amount: number | string;
    currency?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'positive' | 'negative' | 'purple' | 'blue' | 'emerald' | 'muted';
    className?: string;
    showSign?: boolean;
}

export function MoneyDisplay({
    amount,
    currency = 'د.ع',
    size = 'md',
    variant = 'default',
    className,
    showSign = false,
}: MoneyDisplayProps) {
    const num = Number(amount) || 0;
    const isNegative = num < 0;
    const formatted = Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm font-semibold',
        lg: 'text-lg sm:text-xl font-bold',
        xl: 'text-xl sm:text-2xl font-bold',
    }[size];

    const variantClasses = {
        default: 'text-foreground',
        positive: 'text-emerald-600 dark:text-emerald-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        negative: 'text-rose-600 dark:text-rose-400',
        purple: 'text-purple-600 dark:text-purple-400',
        blue: 'text-blue-600 dark:text-blue-400',
        muted: 'text-muted-foreground',
    }[variant];

    return (
        <span className={cn('inline-flex items-baseline gap-1 font-mono tracking-tight', sizeClasses, variantClasses, className)} dir="ltr">
            <span>
                {showSign && num > 0 ? '+' : ''}
                {isNegative ? '-' : ''}
                {formatted}
            </span>
            {currency && (
                <span className="font-sans text-[0.7em] font-normal text-muted-foreground mr-1" dir="rtl">
                    {currency}
                </span>
            )}
        </span>
    );
}

