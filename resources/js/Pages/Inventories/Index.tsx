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
import { Badge } from '@/components/ui/badge';
import {
    FileSpreadsheet,
    PlusCircle,
    TrendingUp,
    Scale,
    Wallet,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    User,
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
    mohammed_cash_present: number | string;
    mohammed_difference: number | string;
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
        latestNetWorth: number;
        latestProfit: number;
        latestAssets: number;
    };
}

export default function InventoriesIndex({ inventories, filters, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get('/inventories', { search }, { preserveState: true, replace: true });
    };

    const handleClear = () => {
        setSearch('');
        router.get('/inventories', {}, { preserveState: true, replace: true });
    };

    const columns: Column<PeriodicInventoryItem>[] = [
        {
            header: 'عنوان الكشف',
            accessorKey: 'title',
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
                        <span className="text-[10px] text-muted-foreground truncate max-w-[220px]">
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
                    {new Date(inv.inventory_date).toLocaleDateString('ar-IQ')}
                </span>
            ),
        },
        {
            header: 'م/ الموجودات',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay amount={inv.total_assets} currency="د.ع" size="sm" />
            ),
        },
        {
            header: 'م/ المطلوبات',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay amount={inv.total_liabilities} currency="د.ع" size="sm" variant="negative" />
            ),
        },
        {
            header: 'الموجود الكلي (الصافي)',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay amount={inv.net_worth} currency="د.ع" size="sm" variant="positive" />
            ),
        },
        {
            header: 'ربح آخر جرد',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay
                    amount={inv.inventory_profit}
                    currency="د.ع"
                    size="sm"
                    variant={Number(inv.inventory_profit) >= 0 ? 'emerald' : 'negative'}
                    showSign
                />
            ),
        },
        {
            header: 'خاص محمد (كاش)',
            align: 'left',
            cell: (inv) => (
                <div className="flex flex-col items-start gap-0.5">
                    <MoneyDisplay amount={inv.mohammed_cash_present} currency="د.ع" size="sm" />
                    {Number(inv.mohammed_difference) !== 0 && (
                        <span className={`text-[10px] font-mono font-bold ${Number(inv.mohammed_difference) > 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                            {Number(inv.mohammed_difference) > 0 ? '+' : ''}{Number(inv.mohammed_difference).toLocaleString()} فرق
                        </span>
                    )}
                </div>
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
                <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1">
                    <Link href={`/inventories/${inv.id}`}>
                        <span>عرض الكشف</span>
                        <ArrowLeft className="h-3 w-3" />
                    </Link>
                </Button>
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
                    <span className="text-muted-foreground block text-[10px]">م/ الموجودات:</span>
                    <MoneyDisplay amount={inv.total_assets} currency="د.ع" size="sm" />
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px]">م/ المطلوبات:</span>
                    <MoneyDisplay amount={inv.total_liabilities} currency="د.ع" size="sm" variant="negative" />
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px]">الموجود الكلي (الصافي):</span>
                    <MoneyDisplay amount={inv.net_worth} currency="د.ع" size="sm" variant="positive" />
                </div>
                <div>
                    <span className="text-muted-foreground block text-[10px]">ربح آخر جرد:</span>
                    <MoneyDisplay
                        amount={inv.inventory_profit}
                        currency="د.ع"
                        size="sm"
                        variant={Number(inv.inventory_profit) >= 0 ? 'emerald' : 'negative'}
                        showSign
                    />
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>خاص محمد: <strong className="font-mono text-foreground">{Number(inv.mohammed_cash_present).toLocaleString()} د.ع</strong></span>
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
        <AuthenticatedLayout header="الجرد والميزانية العمومية" activeNav="inventories">
            <Head title="الجرد والميزانية العمومية" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title="سجل كشوفات الجرد والميزانية العمومية"
                    description="إدارة الجرودات الدورية، حساب الموجود الكلي، صافي الأرباح، وحساب خاص محمد طبق معادلات المحاسبة المعتمدة"
                    icon={FileSpreadsheet}
                    actions={
                        <Link href="/inventories/create">
                            <Button size="sm" className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90">
                                <PlusCircle className="h-4 w-4" />
                                <span>إجراء جرد وميزانية جديدة</span>
                            </Button>
                        </Link>
                    }
                />

                {/* 2. Top Stats Grid */}
                <StatGrid columns={4}>
                    <StatCard
                        title="الموجود الكلي لآخر جرد"
                        value={stats.latestNetWorth}
                        currency="د.ع"
                        color="primary"
                        icon={Scale}
                        description="صافي ثروة رأس المال والميزانية العامة"
                    />
                    <StatCard
                        title="ربح آخر جرد دوري"
                        value={stats.latestProfit}
                        currency="د.ع"
                        color={stats.latestProfit >= 0 ? 'emerald' : 'muted'}
                        icon={TrendingUp}
                        description="النمو في الموجود الكلي مقارنة بالجرد السابق"
                    />
                    <StatCard
                        title="إجمالي الموجودات المسجلة"
                        value={stats.latestAssets}
                        currency="د.ع"
                        color="blue"
                        icon={Wallet}
                        description="مجموع النقد + المصارف + نطلب من الزبائن"
                    />
                    <StatCard
                        title="إجمالي كشوفات الجرد"
                        value={stats.totalCount}
                        color="purple"
                        icon={FileSpreadsheet}
                        description="عدد الكشوفات الدورية المحفوظة بالنظام"
                    />
                </StatGrid>

                {/* 3. Unified DataGrid */}
                <DataGrid<PeriodicInventoryItem>
                    title="كشوفات الجرد والميزانية السابقة"
                    description="أرشيف كامل لكافة الجرودات الدورية مع كافة المعادلات والبيانات المالية"
                    icon={FileSpreadsheet}
                    columns={columns}
                    data={inventories.data}
                    total={inventories.total}
                    links={inventories.links}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا توجد كشوفات جرد مسجلة حتى الآن. يمكنك بدء جرد جديد عبر الزر أعلاه."
                    headerActions={
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearch();
                            }}
                            className="flex items-center gap-2"
                        >
                            <Input
                                placeholder="بحث في عنوان الكشف أو الملاحظات..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 text-xs w-56 sm:w-64"
                            />
                            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs px-2.5">
                                بحث
                            </Button>
                            {search && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleClear}
                                    className="h-8 text-xs px-2 text-muted-foreground"
                                >
                                    إلغاء
                                </Button>
                            )}
                        </form>
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}
