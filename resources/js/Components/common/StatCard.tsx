import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MoneyDisplay } from './MoneyDisplay';

export interface StatCardProps {
    title: string;
    value: number | string;
    currency?: string;
    description?: ReactNode;
    icon?: LucideIcon;
    color?: 'primary' | 'emerald' | 'blue' | 'purple' | 'amber' | 'muted';
    onClick?: () => void;
    isSelected?: boolean;
    actions?: ReactNode;
    className?: string;
}

export function StatCard({
    title,
    value,
    currency = 'د.ع',
    description,
    icon: Icon,
    color = 'primary',
    onClick,
    isSelected = false,
    actions,
    className,
}: StatCardProps) {
    const colorStyles = {
        primary: {
            iconBox: 'bg-primary/10 text-primary',
            cardBg: 'from-background to-primary/5 border-primary/20',
            text: 'text-primary',
        },
        emerald: {
            iconBox: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
            cardBg: 'from-background to-emerald-500/5 border-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
        blue: {
            iconBox: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
            cardBg: 'from-background to-blue-500/5 border-blue-500/20',
            text: 'text-blue-600 dark:text-blue-400',
        },
        purple: {
            iconBox: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
            cardBg: 'from-background to-purple-500/5 border-purple-500/20',
            text: 'text-purple-600 dark:text-purple-400',
        },
        amber: {
            iconBox: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
            cardBg: 'from-background to-amber-500/5 border-amber-500/20',
            text: 'text-amber-600 dark:text-amber-400',
        },
        muted: {
            iconBox: 'bg-muted text-muted-foreground',
            cardBg: 'bg-background border-border',
            text: 'text-foreground',
        },
    }[color];

    const isNumeric = typeof value === 'number' || (!isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '');

    return (
        <Card
            onClick={onClick}
            className={cn(
                'shadow-xs transition-all relative overflow-hidden bg-gradient-to-br',
                colorStyles.cardBg,
                onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : '',
                isSelected ? 'ring-2 ring-primary border-primary shadow-md' : '',
                className
            )}
            dir="rtl"
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-5">
                <CardTitle className="text-xs font-semibold text-muted-foreground truncate">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className={cn('p-2 rounded-lg shrink-0', colorStyles.iconBox)}>
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                    {isNumeric ? (
                        <MoneyDisplay
                            amount={value}
                            currency={currency}
                            size="xl"
                            className={cn('tracking-tight', colorStyles.text)}
                        />
                    ) : (
                        <div className={cn('text-xl sm:text-2xl font-bold font-mono tracking-tight', colorStyles.text)}>
                            {value}
                        </div>
                    )}
                </div>

                {description && (
                    <div className="text-[11px] text-muted-foreground leading-normal">
                        {description}
                    </div>
                )}

                {actions && <div className="pt-2 border-t border-border/60">{actions}</div>}
            </CardContent>
        </Card>
    );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4', className)}>
            {children}
        </div>
    );
}

