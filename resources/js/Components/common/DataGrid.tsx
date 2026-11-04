import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T, index: number) => ReactNode;
    className?: string;
    headerClassName?: string;
    align?: 'right' | 'center' | 'left';
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface DataGridProps<T> {
    title?: string;
    description?: string;
    icon?: LucideIcon;
    columns: Column<T>[];
    data: T[];
    total?: number;
    links?: PaginationLink[];
    headerActions?: ReactNode;
    emptyMessage?: string;
    renderMobileCard?: (item: T, index: number) => ReactNode;
    className?: string;
}

export function DataGrid<T extends { id?: number | string }>({
    title,
    description,
    icon: Icon,
    columns,
    data,
    total,
    links,
    headerActions,
    emptyMessage = 'لا توجد بيانات مسجلة حالياً.',
    renderMobileCard,
    className,
}: DataGridProps<T>) {
    return (
        <Card className={cn('shadow-xs overflow-hidden', className)} dir="rtl">
            {(title || headerActions) && (
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-border/80">
                    <div>
                        {title && (
                            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                                {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
                                <span>{title}</span>
                                {total !== undefined && (
                                    <span className="text-xs font-mono font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {total}
                                    </span>
                                )}
                            </CardTitle>
                        )}
                        {description && (
                            <CardDescription className="text-xs mt-0.5 text-muted-foreground">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    {headerActions && (
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                            {headerActions}
                        </div>
                    )}
                </CardHeader>
            )}

            <CardContent className="p-0">
                {/* 1. Mobile Cards view (if custom renderer provided, otherwise fallback to table) */}
                {renderMobileCard && data.length > 0 && (
                    <div className="block md:hidden divide-y divide-border">
                        {data.map((item, index) => (
                            <div key={item.id ?? index} className="p-4 space-y-2 hover:bg-muted/30 transition-colors">
                                {renderMobileCard(item, index)}
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Desktop Table view (or general table) */}
                <div className={cn('overflow-x-auto scrollbar-thin', renderMobileCard ? 'hidden md:block' : 'block')}>
                    <table className="w-full text-sm text-right min-w-[650px] md:min-w-0">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-border">
                            <tr>
                                {columns.map((col, idx) => {
                                    const alignClass = {
                                        right: 'text-right',
                                        center: 'text-center',
                                        left: 'text-left',
                                    }[col.align || 'right'];

                                    return (
                                        <th
                                            key={idx}
                                            className={cn('px-4 py-3 font-semibold whitespace-nowrap', alignClass, col.headerClassName)}
                                        >
                                            {col.header}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-10">
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <Inbox className="h-8 w-8 text-muted-foreground/40 stroke-1" />
                                            <p className="text-xs">{emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, rowIdx) => (
                                    <tr key={item.id ?? rowIdx} className="hover:bg-muted/30 transition-colors">
                                        {columns.map((col, colIdx) => {
                                            const alignClass = {
                                                right: 'text-right',
                                                center: 'text-center',
                                                left: 'text-left',
                                            }[col.align || 'right'];

                                            const content = col.cell
                                                ? col.cell(item, rowIdx)
                                                : col.accessorKey
                                                ? (item[col.accessorKey] as ReactNode)
                                                : null;

                                            return (
                                                <td
                                                    key={colIdx}
                                                    className={cn('px-4 py-3 text-xs', alignClass, col.className)}
                                                >
                                                    {content}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {links && links.length > 3 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 sm:p-4 border-t border-border bg-background/50">
                        <div className="text-xs text-muted-foreground order-2 sm:order-1">
                            {total !== undefined ? (
                                <span>إجمالي السجلات: <strong className="font-mono text-foreground">{total}</strong></span>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
                            {links.map((link, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={cn(
                                        'px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer',
                                        link.active
                                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                                            : 'border-border text-muted-foreground hover:bg-muted',
                                        !link.url ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

