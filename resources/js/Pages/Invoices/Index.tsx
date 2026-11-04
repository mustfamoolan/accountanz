import { useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PageHeader,
    StatCard,
    StatGrid,
    DataGrid,
    Column,
    FilterBar,
    MoneyDisplay,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Receipt,
    PlusCircle,
    Eye,
    TrendingUp,
    DollarSign,
    Coins,
    ShoppingCart,
} from 'lucide-react';

interface Investor {
    id: number;
    name: string;
    code: string;
    capital_balance: number | string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    amount_usd: number | string;
    exchange_rate: number | string;
    amount_iqd: number | string;
    tax_percentage: number | string;
    tax_iqd: number | string;
    total_iqd: number | string;
    status: 'available' | 'partial' | 'sold';
    purchase_date: string;
    sold_amount_usd: number;
    available_amount_usd: number;
    total_profit_iqd: number;
    investor_id?: number | null;
    investor?: Investor | null;
    sales_count?: number;
}

interface Props {
    invoices: {
        data: Invoice[];
        links: any[];
        total: number;
    };
    stats: {
        totalInvoicesCount: number;
        totalAmountUsd: number;
        totalAmountIqd: number;
        totalProfitIqd: number;
        availableInvoicesCount: number;
    };
    filters: { status?: string; investor_id?: string; search?: string };
    investors: Investor[];
}

export default function InvoicesIndex({ invoices, stats, filters, investors }: Props) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                        متاحة للبيع
                    </Badge>
                );
            case 'partial':
                return (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                        مباعة جزئياً
                    </Badge>
                );
            case 'sold':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                        مباعة بالكامل
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Columns for DataGrid
    const columns: Column<Invoice>[] = [
        {
            header: 'رقم الفاتورة',
            cell: (inv) => (
                <Link
                    href={`/invoices/${inv.id}`}
                    className="font-mono font-bold text-xs text-primary hover:underline whitespace-nowrap"
                >
                    {inv.invoice_number}
                </Link>
            ),
        },
        {
            header: 'المبلغ ($)',
            align: 'left',
            cell: (inv) => (
                <div className="text-left font-mono text-xs font-bold text-foreground">
                    ${Number(inv.amount_usd).toLocaleString()}
                </div>
            ),
        },
        {
            header: 'سعر الشراء',
            align: 'center',
            cell: (inv) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {Number(inv.exchange_rate).toLocaleString()}
                </span>
            ),
        },
        {
            header: 'التكلفة بالدينار',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay amount={inv.total_iqd} currency="د.ع" size="sm" />
            ),
        },
        {
            header: 'المباع / المتبقي ($)',
            align: 'center',
            cell: (inv) => (
                <div className="text-xs font-mono space-y-0.5">
                    <div className="text-blue-600">
                        مباع: ${Number(inv.sold_amount_usd).toLocaleString()}
                    </div>
                    <div className="text-emerald-600 font-bold">
                        متبقي: ${Number(inv.available_amount_usd).toLocaleString()}
                    </div>
                </div>
            ),
        },
        {
            header: 'التخصيص والتمويل',
            align: 'center',
            cell: (inv) =>
                inv.investor ? (
                    <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-700 bg-purple-50 dark:bg-purple-950/30">
                        مخصصة: {inv.investor.name}
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="text-[10px]">
                        عام (لجميع المستثمرين)
                    </Badge>
                ),
        },
        {
            header: 'الربح المحقق',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay
                    amount={inv.total_profit_iqd}
                    currency="د.ع"
                    size="sm"
                    variant={Number(inv.total_profit_iqd) > 0 ? 'emerald' : 'muted'}
                />
            ),
        },
        {
            header: 'الحالة',
            align: 'center',
            cell: (inv) => getStatusBadge(inv.status),
        },
        {
            header: 'الإجراءات',
            align: 'center',
            cell: (inv) => (
                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                    {inv.status !== 'sold' && (
                        <Link href={`/invoices/${inv.id}/sell`}>
                            <Button
                                size="sm"
                                className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <ShoppingCart className="h-3 w-3" />
                                <span>بيع</span>
                            </Button>
                        </Link>
                    )}
                    <Link href={`/invoices/${inv.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" />
                            <span>التفاصيل</span>
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];

    // Mobile Card Renderer
    const renderMobileCard = (inv: Invoice) => (
        <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
                <Link
                    href={`/invoices/${inv.id}`}
                    className="font-mono font-bold text-sm text-primary hover:underline"
                >
                    {inv.invoice_number}
                </Link>
                {getStatusBadge(inv.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <span className="text-[10px] text-muted-foreground block">مبلغ الفاتورة</span>
                    <strong className="font-mono text-foreground text-sm">
                        ${Number(inv.amount_usd).toLocaleString()}
                    </strong>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                        صرف الشراء: {Number(inv.exchange_rate).toLocaleString()}
                    </div>
                </div>

                <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[10px] text-muted-foreground block">الربح المحقق</span>
                    <MoneyDisplay amount={inv.total_profit_iqd} currency="د.ع" size="sm" variant="emerald" />
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                        المتبقي: ${Number(inv.available_amount_usd).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                <span>
                    التخصيص:{' '}
                    {inv.investor ? (
                        <strong className="text-purple-600">{inv.investor.name}</strong>
                    ) : (
                        <strong className="text-foreground">عام (وفق رأس المال)</strong>
                    )}
                </span>
                <span dir="ltr">{new Date(inv.purchase_date).toLocaleDateString('ar-IQ')}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
                {inv.status !== 'sold' && (
                    <Link href={`/invoices/${inv.id}/sell`} className="flex-1">
                        <Button
                            size="sm"
                            className="w-full text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>بيع الفاتورة</span>
                        </Button>
                    </Link>
                )}
                <Link href={`/invoices/${inv.id}`} className={inv.status === 'sold' ? 'w-full' : 'flex-1'}>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span>كشف المبيعات والأرباح</span>
                    </Button>
                </Link>
            </div>
        </div>
    );

    // Filter Items
    const filterItems = [
        { id: null, label: 'جميع الفواتير', count: stats.totalInvoicesCount },
        { id: 'available', label: 'متاحة للبيع', count: stats.availableInvoicesCount },
        { id: 'partial', label: 'مباعة جزئياً' },
        { id: 'sold', label: 'مباعة بالكامل' },
    ];

    const filterByStatus = (statusId: any) => {
        router.get('/invoices', statusId ? { status: statusId } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout header="إدارة الفواتير والمبيعات" activeNav="invoices">
            <Head title="الفواتير والمبيعات" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Standard Page Header */}
                <PageHeader
                    title="الفواتير والمبيعات الاستيرادية"
                    description="شراء الفواتير بالدولار، بيعها للمستثمرين الشركاء، وتوزيع الأرباح آلياً على حساباتهم"
                    icon={Receipt}
                    badge={
                        <Badge variant="secondary" className="font-mono text-xs">
                            {stats.totalInvoicesCount} فاتورة
                        </Badge>
                    }
                    actions={
                        <Link href="/invoices/create">
                            <Button className="gap-1.5 h-9 text-xs">
                                <PlusCircle className="h-4 w-4" />
                                <span>شراء فاتورة جديدة ($)</span>
                            </Button>
                        </Link>
                    }
                />

                {/* 2. Responsive Filter Bar */}
                <FilterBar
                    title="تصفية حسب الحالة:"
                    items={filterItems}
                    selectedId={filters.status ?? null}
                    onSelect={(id) => filterByStatus(id)}
                    onClear={() => filterByStatus(null)}
                />

                {/* 3. Financial StatGrid */}
                <StatGrid columns={4}>
                    <StatCard
                        title="إجمالي المشتريات بالدولار"
                        value={stats.totalAmountUsd}
                        currency="$"
                        color="blue"
                        icon={DollarSign}
                        description="إجمالي كميات الفواتير المشتراة"
                    />

                    <StatCard
                        title="التكلفة الإجمالية بالدينار"
                        value={stats.totalAmountIqd}
                        currency="د.ع"
                        color="purple"
                        icon={Coins}
                        description="شاملة سعر الشراء والرسوم"
                    />

                    <StatCard
                        title="أرباح المبيعات المحققة"
                        value={stats.totalProfitIqd}
                        currency="د.ع"
                        color="emerald"
                        icon={TrendingUp}
                        description="موزعة تلقائياً على المستثمرين"
                    />

                    <StatCard
                        title="الفواتير المتاحة للبيع"
                        value={stats.availableInvoicesCount}
                        currency="فاتورة"
                        color="primary"
                        icon={Receipt}
                        description="جاهزة للتجزئة والبيع"
                    />
                </StatGrid>

                {/* 4. Unified DataGrid */}
                <DataGrid<Invoice>
                    title="سجل الفواتير ومتابعة المبيعات"
                    description="اضغط على زر (بيع) لتجزئة الفاتورة على المستثمرين وتوزيع الأرباح فورياً"
                    icon={Receipt}
                    columns={columns}
                    data={invoices.data}
                    total={invoices.total}
                    links={invoices.links}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا توجد فواتير مسجلة حالياً. اضغط على 'شراء فاتورة جديدة' للبدء."
                />
            </div>
        </AuthenticatedLayout>
    );
}
