import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PageHeader,
    StatCard,
    StatGrid,
    DataGrid,
    Column,
    MoneyDisplay,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    FileSpreadsheet,
    PlusCircle,
    TrendingUp,
    Scale,
    Wallet,
    Calendar,
    ArrowLeft,
    RotateCcw,
    Filter,
    CreditCard,
    Search,
    Trash2,
} from 'lucide-react';

interface PeriodicInventoryItem {
    id: number;
    title: string;
    inventory_date: string;
    total_receivables: number | string;
    total_payables: number | string;
    total_customs: number | string;
    total_expenses: number | string;
    actual_cash: number | string;
    bank_balance: number | string;
    total_assets: number | string;
    total_liabilities: number | string;
    net_worth: number | string;
    previous_net_worth: number | string;
    inventory_profit: number | string;
    notes?: string;
    creator?: { name: string };
    created_at: string;
}

interface Props {
    inventories: {
        data: PeriodicInventoryItem[];
        links: any[];
        total: number;
    };
    filters: {
        search?: string;
        from_date?: string;
        to_date?: string;
    };
    stats: {
        totalCount: number;
        periodProfitsSum: number;
        periodAssetsSum: number;
        latestProfit: number;
    };
}

export default function InventoriesIndex({ inventories, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    const applyFilters = () => {
        router.get(
            '/inventories',
            {
                search: search || undefined,
                from_date: fromDate || undefined,
                to_date: toDate || undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const resetFilters = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        router.get('/inventories', {}, { preserveState: true, replace: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('هل أنت متأكد من حذف كشف الجرد هذا؟')) {
            router.delete(`/inventories/${id}`);
        }
    };

    const columns: Column<PeriodicInventoryItem>[] = [
        {
            header: 'عنوان الكشف',
            cell: (inv) => (
                <div className="flex flex-col gap-0.5">
                    <Link
                        href={`/inventories/${inv.id}`}
                        className="font-bold text-xs text-primary hover:underline flex items-center gap-1.5"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{inv.title || `جرد #${inv.id}`}</span>
                    </Link>
                    {inv.notes && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={inv.notes}>
                            {inv.notes}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'تاريخ الجرد',
            align: 'center',
            cell: (inv) => (
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap" dir="ltr">
                    {new Date(inv.inventory_date).toLocaleDateString('ar-IQ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            ),
        },
        {
            header: 'الرصيد المتوفر',
            align: 'right',
            cell: (inv) => (
                <MoneyDisplay amount={inv.total_assets} currency="د.ع" size="sm" />
            ),
        },
        {
            header: 'الالتزامات (مطلوبين+كمرك)',
            align: 'right',
            cell: (inv) => (
                <MoneyDisplay amount={inv.total_liabilities} currency="د.ع" size="sm" variant="negative" />
            ),
        },
        {
            header: 'الربح السابق',
            align: 'right',
            cell: (inv) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {Number(inv.previous_net_worth || 0).toLocaleString()} د.ع
                </span>
            ),
        },
        {
            header: 'ربح الجرد الجديد',
            align: 'right',
            cell: (inv) => (
                <span
                    className={`font-mono text-xs font-bold ${
                        Number(inv.inventory_profit) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                    }`}
                    dir="ltr"
                >
                    {Number(inv.inventory_profit) >= 0 ? '+' : ''}
                    {Number(inv.inventory_profit).toLocaleString()} د.ع
                </span>
            ),
        },
        {
            header: 'نثريات (توثيق)',
            align: 'right',
            cell: (inv) => (
                <span className="font-mono text-[11px] text-muted-foreground">
                    {Number(inv.total_expenses || 0).toLocaleString()} د.ع
                </span>
            ),
        },
        {
            header: 'المسؤول',
            align: 'center',
            cell: (inv) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {inv.creator?.name || 'النظام'}
                </span>
            ),
        },
        {
            header: 'إجراءات',
            align: 'center',
            cell: (inv) => (
                <div className="flex items-center justify-center gap-1">
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1">
                        <Link href={`/inventories/${inv.id}`}>
                            <span>عرض</span>
                            <ArrowLeft className="h-3 w-3" />
                        </Link>
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(inv.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="حذف الجرد"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    const renderMobileCard = (inv: PeriodicInventoryItem) => (
        <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
                <Link
                    href={`/inventories/${inv.id}`}
                    className="font-bold text-primary flex items-center gap-1.5 hover:underline"
                >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                    <span>{inv.title || `جرد #${inv.id}`}</span>
                </Link>
                <span className="font-mono text-muted-foreground text-[11px]" dir="ltr">
                    {new Date(inv.inventory_date).toLocaleDateString('ar-IQ')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 bg-muted/40 rounded border border-border/50 text-[11px]">
                <div>
                    <span className="text-muted-foreground block text-[10px]">الرصيد المتوفر:</span>
                    <MoneyDisplay amount={inv.total_assets} currency="د.ع" size="sm" />
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px]">الالتزامات:</span>
                    <MoneyDisplay amount={inv.total_liabilities} currency="د.ع" size="sm" variant="negative" />
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px]">ربح آخر جرد سابق:</span>
                    <span className="font-mono font-semibold text-muted-foreground">
                        {Number(inv.previous_net_worth || 0).toLocaleString()} د.ع
                    </span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px]">ربح الجرد الجديد:</span>
                    <span
                        className={`font-mono font-bold ${
                            Number(inv.inventory_profit) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                        dir="ltr"
                    >
                        {Number(inv.inventory_profit) >= 0 ? '+' : ''}
                        {Number(inv.inventory_profit).toLocaleString()} د.ع
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>المسؤول: {inv.creator?.name || 'النظام'}</span>
                <Button asChild size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1">
                    <Link href={`/inventories/${inv.id}`}>
                        <span>فتح الكشف</span>
                        <ArrowLeft className="h-3 w-3" />
                    </Link>
                </Button>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header="الجرد" activeNav="inventories">
            <Head title="الجرد الدوري" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title="الجرد"
                    description="سجل عمليات الجرد الدورية واحتساب الأرباح التراكمية ومطابقة الأرصدة عبر الفترات."
                    icon={FileSpreadsheet}
                    actions={
                        <Link href="/inventories/create">
                            <Button size="sm" className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 font-bold">
                                <PlusCircle className="h-4 w-4" />
                                <span>إجراء جرد جديد</span>
                            </Button>
                        </Link>
                    }
                />

                {/* 2. Top Summary KPI Cards */}
                <StatGrid columns={4}>
                    <StatCard
                        title="ربح آخر جرد مسجل"
                        value={stats.latestProfit}
                        currency="د.ع"
                        color={stats.latestProfit >= 0 ? 'emerald' : 'muted'}
                        icon={TrendingUp}
                        description="آخر ربح دوري مخزن بالنظام"
                    />

                    <StatCard
                        title="مجموع أرباح الفترة المحددة"
                        value={stats.periodProfitsSum}
                        currency="د.ع"
                        color="primary"
                        icon={Scale}
                        description={`خلال فترة الفلتر الحالية`}
                    />

                    <StatCard
                        title="إجمالي الأرصدة المتوفرة"
                        value={stats.periodAssetsSum}
                        currency="د.ع"
                        color="blue"
                        icon={Wallet}
                        description="مجموع الأرصدة في عمليات الجرد"
                    />

                    <StatCard
                        title="عدد عمليات الجرد"
                        value={stats.totalCount}
                        color="amber"
                        icon={FileSpreadsheet}
                        description="إجمالي السجلات المسجلة"
                    />
                </StatGrid>

                {/* 3. Filter Bar (Date Range From - To + Search) */}
                <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-bold text-foreground">فلترة كشوفات الجرد حسب الفترة:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>من تاريخ</span>
                            </Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>إلى تاريخ</span>
                            </Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Search className="h-3.5 w-3.5" />
                                <span>بحث بالاسم أو الملاحظات</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="ابحث..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={applyFilters}
                                className="h-9 px-4 text-xs gap-1.5 flex-1"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                <span>تطبيق الفلتر</span>
                            </Button>

                            {(fromDate || toDate || search) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="h-9 px-3 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>مسح</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Unified DataGrid */}
                <DataGrid<PeriodicInventoryItem>
                    title="سجل كشوفات الجرد"
                    description={`إجمالي الكشوفات المسجلة: ${inventories.total} كشف`}
                    icon={FileSpreadsheet}
                    columns={columns}
                    data={inventories.data}
                    links={inventories.links}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا توجد كشوفات جرد مسجلة في هذه الفترة."
                />
            </div>
        </AuthenticatedLayout>
    );
}
