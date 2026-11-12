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
    Pencil,
    Printer,
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
    allInventories?: PeriodicInventoryItem[];
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

export default function InventoriesIndex({ inventories, allInventories, filters, stats }: Props) {
    const printItems = allInventories && allInventories.length > 0 ? allInventories : inventories.data;
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

    const handleRecalculate = () => {
        if (confirm('هل تريد إعادة احتساب وتحديث جميع سجلات الجرد السابقة بناءً على (الموجود الكلي السابق) لكل جرد؟')) {
            router.post('/inventories/recalculate');
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
            header: 'الموجود الكلي السابق',
            align: 'right',
            cell: (inv) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {Number(inv.previous_net_worth || 0).toLocaleString()} د.ع
                </span>
            ),
        },
        {
            header: 'الربح',
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
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1" title="عرض الكشف">
                        <Link href={`/inventories/${inv.id}`}>
                            <span>عرض</span>
                            <ArrowLeft className="h-3 w-3" />
                        </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary" title="تعديل الكشف">
                        <Link href={`/inventories/${inv.id}/edit`}>
                            <Pencil className="h-3 w-3" />
                            <span>تعديل</span>
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
                    <span className="text-muted-foreground block text-[10px]">الموجود الكلي السابق:</span>
                    <span className="font-mono font-semibold text-muted-foreground">
                        {Number(inv.previous_net_worth || 0).toLocaleString()} د.ع
                    </span>
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px]">الربح:</span>
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
                <div className="flex items-center gap-1.5">
                    <Button asChild size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1 text-primary">
                        <Link href={`/inventories/${inv.id}/edit`}>
                            <Pencil className="h-3 w-3" />
                            <span>تعديل</span>
                        </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1">
                        <Link href={`/inventories/${inv.id}`}>
                            <span>فتح الكشف</span>
                            <ArrowLeft className="h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header="الجرد" activeNav="inventories">
            <Head title="الجرد الدوري" />

            <div className="space-y-6 print:hidden" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title="الجرد"
                    description="سجل عمليات الجرد الدورية واحتساب الأرباح التراكمية ومطابقة الأرصدة عبر الفترات."
                    icon={FileSpreadsheet}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="gap-1.5 text-xs h-9 font-bold bg-muted/40 hover:bg-muted"
                                title="طباعة سجل الجرد العام شاملاً كافة الكشوفات بنمط إكسل"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span>طباعة سجل الجرد العام</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRecalculate}
                                className="gap-1.5 text-xs h-9"
                                title="إعادة احتساب كافة كشوفات الجرد السابقة بناءً على الموجود الكلي السابق"
                            >
                                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>إعادة احتساب السجلات القديمة</span>
                            </Button>
                            <Link href="/inventories/create">
                                <Button size="sm" className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 font-bold">
                                    <PlusCircle className="h-4 w-4" />
                                    <span>إجراء جرد جديد</span>
                                </Button>
                            </Link>
                        </div>
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

            {/* ========================================================================= */}
            {/* Dedicated Excel-Style Official Print Document for General Inventories Log */}
            {/* ========================================================================= */}
            <div className="hidden print:block text-black bg-white w-full text-xs" dir="rtl">
                {/* 1. Official Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4">
                    <div className="flex justify-between items-start">
                        <div className="text-right">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                نظام إدارة الحسابات المالية والجرد
                            </h1>
                            <p className="text-xs text-slate-600 font-semibold mt-0.5">
                                سجل الجرد العام الشامل ومطابقة الأرباح والموجودات
                            </p>
                        </div>
                        <div className="text-center bg-slate-100 border border-slate-700 px-5 py-2 rounded">
                            <h2 className="text-base font-black text-slate-900">
                                سجل كشوفات الجرد العام الشامل
                            </h2>
                            <span className="font-mono text-xs font-bold text-slate-700 block mt-0.5">
                                {filters.from_date || filters.to_date
                                    ? `الفترة: ${filters.from_date || 'البداية'} إلى ${filters.to_date || 'الآن'}`
                                    : 'كافة الفترات والعمليات المسجلة'}
                            </span>
                        </div>
                        <div className="text-left font-mono text-[11px] text-slate-600">
                            <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-IQ')}</div>
                            <div>الوقت: {new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>

                    {/* Metadata Summary Box */}
                    <table className="w-full mt-3 border-collapse border border-slate-700 text-xs">
                        <tbody>
                            <tr>
                                <td className="border border-slate-700 p-1.5 font-bold bg-slate-100 w-1/6">إجمالي عدد الكشوفات:</td>
                                <td className="border border-slate-700 p-1.5 font-mono font-bold w-2/6">{printItems.length} كشف جرد</td>
                                <td className="border border-slate-700 p-1.5 font-bold bg-emerald-100 w-1/6 text-emerald-950">إجمالي أرباح الفترة المحددة:</td>
                                <td className="border border-slate-700 p-1.5 font-mono font-black text-emerald-900 w-2/6 text-left" dir="ltr">
                                    {stats.periodProfitsSum >= 0 ? '+' : ''}{stats.periodProfitsSum.toLocaleString()} د.ع
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-slate-700 p-1.5 font-bold bg-slate-100">فترة التقرير:</td>
                                <td className="border border-slate-700 p-1.5 font-semibold">
                                    {filters.from_date || filters.to_date
                                        ? `من ${filters.from_date || 'البداية'} إلى ${filters.to_date || 'تاريخ اليوم'}`
                                        : 'كافة السجلات المسجلة'}
                                </td>
                                <td className="border border-slate-700 p-1.5 font-bold bg-blue-100 w-1/6 text-blue-950">إجمالي الأرصدة المتوفرة:</td>
                                <td className="border border-slate-700 p-1.5 font-mono font-black text-blue-900 w-2/6 text-left" dir="ltr">
                                    {stats.periodAssetsSum.toLocaleString()} د.ع
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 2. Main Master Excel Grid Table */}
                <div className="mb-4">
                    <table className="w-full border-collapse border border-slate-700 text-[10px] text-right">
                        <thead>
                            <tr className="bg-slate-200 border border-slate-700 font-bold text-slate-900 text-center">
                                <th className="border border-slate-700 p-1.5 w-7">#</th>
                                <th className="border border-slate-700 p-1.5 w-20">تاريخ الجرد</th>
                                <th className="border border-slate-700 p-1.5 text-right">عنوان الكشف</th>
                                <th className="border border-slate-700 p-1.5 w-20">كاش الصندوق</th>
                                <th className="border border-slate-700 p-1.5 w-20">المصارف</th>
                                <th className="border border-slate-700 p-1.5 w-20">نطلب</th>
                                <th className="border border-slate-700 p-1.5 w-24 bg-blue-100 text-blue-950 font-black">الرصيد المتوفر</th>
                                <th className="border border-slate-700 p-1.5 w-24 bg-amber-100 text-amber-950 font-black">الالتزامات</th>
                                <th className="border border-slate-700 p-1.5 w-24 bg-slate-300 font-black">الموجود الكلي</th>
                                <th className="border border-slate-700 p-1.5 w-24">الموجود السابق</th>
                                <th className="border border-slate-700 p-1.5 w-24 bg-emerald-100 text-emerald-950 font-black">الربح</th>
                                <th className="border border-slate-700 p-1.5 w-16">نثريات</th>
                                <th className="border border-slate-700 p-1.5 w-20">المسؤول</th>
                            </tr>
                        </thead>
                        <tbody>
                            {printItems.map((inv, idx) => (
                                <tr key={inv.id} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                                    <td className="border border-slate-700 p-1 text-center font-mono text-[9px] text-slate-600">{idx + 1}</td>
                                    <td className="border border-slate-700 p-1 text-center font-mono whitespace-nowrap" dir="ltr">
                                        {new Date(inv.inventory_date).toLocaleDateString('ar-IQ')}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-semibold truncate max-w-[150px]">
                                        {inv.title || `جرد #${inv.id}`}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left" dir="ltr">
                                        {Number(inv.actual_cash || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left" dir="ltr">
                                        {Number(inv.bank_balance || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left" dir="ltr">
                                        {Number(inv.total_receivables || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left font-bold bg-blue-50/40 text-blue-900" dir="ltr">
                                        {Number(inv.total_assets || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left font-bold bg-amber-50/40 text-amber-900" dir="ltr">
                                        {Number(inv.total_liabilities || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left font-bold bg-slate-100" dir="ltr">
                                        {Number(inv.net_worth || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left text-slate-600" dir="ltr">
                                        {Number(inv.previous_net_worth || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left font-black bg-emerald-50 text-emerald-900" dir="ltr">
                                        {Number(inv.inventory_profit) >= 0 ? '+' : ''}{Number(inv.inventory_profit || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 font-mono text-left text-slate-500" dir="ltr">
                                        {Number(inv.total_expenses || 0).toLocaleString()}
                                    </td>
                                    <td className="border border-slate-700 p-1 text-center whitespace-nowrap">{inv.creator?.name || 'النظام'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-200 border-2 border-slate-900 font-bold text-slate-900 text-[10px]">
                                <td colSpan={3} className="border border-slate-700 p-1.5 text-center font-black">
                                    الإجمالي العام ({printItems.length} كشف):
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono text-left" dir="ltr">
                                    {printItems.reduce((acc, i) => acc + Number(i.actual_cash || 0), 0).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono text-left" dir="ltr">
                                    {printItems.reduce((acc, i) => acc + Number(i.bank_balance || 0), 0).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono text-left" dir="ltr">
                                    {printItems.reduce((acc, i) => acc + Number(i.total_receivables || 0), 0).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono font-black text-left bg-blue-100 text-blue-950" dir="ltr">
                                    {printItems.reduce((acc, i) => acc + Number(i.total_assets || 0), 0).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono font-black text-left bg-amber-100 text-amber-950" dir="ltr">
                                    {printItems.reduce((acc, i) => acc + Number(i.total_liabilities || 0), 0).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono text-left bg-slate-300">
                                    —
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono text-left">
                                    —
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono font-black text-left bg-emerald-100 text-emerald-950 text-[11px]" dir="ltr">
                                    {stats.periodProfitsSum >= 0 ? '+' : ''}{stats.periodProfitsSum.toLocaleString()} د.ع
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono text-left" dir="ltr">
                                    {printItems.reduce((acc, i) => acc + Number(i.total_expenses || 0), 0).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 3. Official Signatures (Excel/Document Footer) */}
                <div className="mt-8 pt-4 border-t-2 border-slate-800 grid grid-cols-3 gap-8 text-center break-inside-avoid">
                    <div className="border border-slate-400 p-3 rounded">
                        <p className="font-black text-slate-800 text-xs">منظم السجل (المحاسب المالي)</p>
                        <p className="mt-7 text-slate-400 font-mono text-[10px]">................................................</p>
                        <p className="text-[11px] font-semibold text-slate-700 mt-1">التوقيع والتاريخ</p>
                    </div>
                    <div className="border border-slate-400 p-3 rounded">
                        <p className="font-black text-slate-800 text-xs">التدقيق المالي والرقابة</p>
                        <p className="mt-7 text-slate-400 font-mono text-[10px]">................................................</p>
                        <p className="text-[11px] text-slate-600 mt-1">التوقيع والختم المعتمد</p>
                    </div>
                    <div className="border border-slate-400 p-3 rounded">
                        <p className="font-black text-slate-800 text-xs">الإدارة العامة والمصادقة</p>
                        <p className="mt-7 text-slate-400 font-mono text-[10px]">................................................</p>
                        <p className="text-[11px] text-slate-600 mt-1">المصادقة والتاريخ</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
