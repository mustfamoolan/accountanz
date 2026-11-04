import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PageHeader,
    StatCard,
    StatGrid,
    DataGrid,
    Column,
    MoneyDisplay,
} from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Receipt,
    ArrowLeft,
    DollarSign,
    Coins,
    TrendingUp,
    Users,
    ShoppingCart,
    Calendar,
    CheckCircle2,
    Percent,
} from 'lucide-react';

interface Investor {
    id: number;
    name: string;
    code: string;
    profit_rate?: number | string;
}

interface InvoiceSaleItem {
    id: number;
    investor_id?: number | null;
    investor?: Investor | null;
    amount_usd: number | string;
    exchange_rate: number | string;
    amount_iqd: number | string;
    customs_percentage: number | string;
    amount_after_customs_usd: number | string;
    customs_exchange_rate: number | string;
    customs_amount_iqd: number | string;
    amount_after_customs_iqd: number | string;
    notes?: string;
}

interface InvoiceDistribution {
    id: number;
    investor_id: number;
    share_percentage: number | string;
    profit_amount: number | string;
    investor?: Investor;
}

interface InvoiceSale {
    id: number;
    sale_number: string;
    sale_date: string;
    total_amount_usd: number | string;
    total_amount_iqd: number | string;
    cost_iqd: number | string;
    profit_iqd: number | string;
    payment_destination_type: string;
    items?: InvoiceSaleItem[];
    distributions?: InvoiceDistribution[];
}

interface Invoice {
    id: number;
    invoice_number: string;
    amount_usd: number;
    exchange_rate: number;
    amount_iqd: number;
    tax_percentage: number;
    tax_iqd: number;
    total_iqd: number;
    status: 'available' | 'partial' | 'sold';
    purchase_date: string;
    notes?: string;
    sold_amount_usd: number;
    available_amount_usd: number;
    total_profit_iqd: number;
    investor?: Investor | null;
    sales: InvoiceSale[];
}

interface Props {
    invoice: Invoice;
}

export default function InvoiceShow({ invoice }: Props) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">متاحة للبيع</Badge>;
            case 'partial':
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">مباعة جزئياً</Badge>;
            case 'sold':
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">مباعة بالكامل</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Columns for Sales DataGrid
    const salesColumns: Column<InvoiceSale>[] = [
        {
            header: 'رقم عملية البيع',
            accessorKey: 'sale_number',
            className: 'font-mono font-bold text-xs text-primary whitespace-nowrap',
        },
        {
            header: 'تاريخ البيع',
            align: 'center',
            cell: (s) => (
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap" dir="ltr">
                    {new Date(s.sale_date).toLocaleDateString('ar-IQ')}
                </span>
            ),
        },
        {
            header: 'الكمية المباعة ($)',
            align: 'left',
            cell: (s) => (
                <span className="font-mono font-bold text-xs text-foreground">
                    ${Number(s.total_amount_usd).toLocaleString()}
                </span>
            ),
        },
        {
            header: 'إجمالي المحصّل (دينار)',
            align: 'left',
            cell: (s) => (
                <MoneyDisplay amount={s.total_amount_iqd} currency="د.ع" size="sm" />
            ),
        },
        {
            header: 'التكلفة الأصلية',
            align: 'left',
            cell: (s) => (
                <MoneyDisplay amount={s.cost_iqd} currency="د.ع" size="sm" variant="muted" />
            ),
        },
        {
            header: 'الربح المحقق',
            align: 'left',
            cell: (s) => (
                <MoneyDisplay amount={s.profit_iqd} currency="د.ع" size="sm" variant="emerald" />
            ),
        },
        {
            header: 'المستثمرون المشترون',
            cell: (s) => (
                <div className="space-y-1.5 py-1">
                    {s.items?.map((item, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-2 whitespace-nowrap">
                            <span className="font-bold text-foreground">{item.investor?.name || 'مستثمر'}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                                (${Number(item.amount_usd).toLocaleString()} @ {Number(item.exchange_rate).toLocaleString()})
                            </span>
                            {Number(item.customs_percentage) > 0 && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary">
                                    كمرك: {item.customs_percentage}%
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
            ),
        },
    ];

    const renderMobileSaleCard = (s: InvoiceSale) => (
        <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{s.sale_number}</span>
                <span className="font-mono text-muted-foreground" dir="ltr">
                    {new Date(s.sale_date).toLocaleDateString('ar-IQ')}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-muted/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground block">الكمية المباعة:</span>
                    <strong className="font-mono text-foreground">${Number(s.total_amount_usd).toLocaleString()}</strong>
                </div>
                <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-[10px] text-muted-foreground block">الربح الصافي:</span>
                    <MoneyDisplay amount={s.profit_iqd} currency="د.ع" size="sm" variant="emerald" />
                </div>
            </div>

            <div className="pt-1 text-xs space-y-1 border-t border-border/50">
                <span className="text-muted-foreground block text-[10px]">المستثمرون المشترون:</span>
                {s.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                        <span>{item.investor?.name}</span>
                        <span className="font-mono text-foreground font-semibold">
                            ${Number(item.amount_usd).toLocaleString()} ({Number(item.amount_after_customs_iqd || item.amount_iqd).toLocaleString()} د.ع)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header={`تفاصيل الفاتورة: ${invoice.invoice_number}`} activeNav="invoices">
            <Head title={`الفاتورة: ${invoice.invoice_number}`} />

            <div className="space-y-6" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title={`الفاتورة: ${invoice.invoice_number}`}
                    description={`تاريخ الشراء: ${invoice.purchase_date} | التخصيص: ${
                        invoice.investor ? `مخصصة للمستثمر [${invoice.investor.name}]` : 'عامة (موزعة على جميع الشركاء وفق رأس المال)'
                    }`}
                    icon={Receipt}
                    badge={getStatusBadge(invoice.status)}
                    actions={
                        <>
                            <Link href="/invoices">
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>العودة لقائمة الفواتير</span>
                                </Button>
                            </Link>
                            {invoice.status !== 'sold' && (
                                <Link href={`/invoices/${invoice.id}/sell`}>
                                    <Button className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <ShoppingCart className="h-4 w-4" />
                                        <span>بيع من الفاتورة</span>
                                    </Button>
                                </Link>
                            )}
                        </>
                    }
                />

                {/* 2. Financial StatGrid */}
                <StatGrid columns={4}>
                    <StatCard
                        title="مبلغ الفاتورة الأصلي"
                        value={invoice.amount_usd}
                        currency="$"
                        color="blue"
                        icon={DollarSign}
                        description={`سعر صرف الشراء: ${Number(invoice.exchange_rate).toLocaleString()} د.ع`}
                    />

                    <StatCard
                        title="التكلفة الإجمالية بالدينار"
                        value={invoice.total_iqd}
                        currency="د.ع"
                        color="purple"
                        icon={Coins}
                        description={`شاملة الرسوم: ${Number(invoice.tax_iqd).toLocaleString()} د.ع (${Number(invoice.tax_percentage)}%)`}
                    />

                    <StatCard
                        title="المتاح للبيع حالياً"
                        value={invoice.available_amount_usd}
                        currency="$"
                        color={invoice.available_amount_usd > 0 ? 'emerald' : 'muted'}
                        icon={Receipt}
                        description={`المباع حتى الآن: $${Number(invoice.sold_amount_usd).toLocaleString()}`}
                    />

                    <StatCard
                        title="إجمالي الأرباح المحققة"
                        value={invoice.total_profit_iqd}
                        currency="د.ع"
                        color="emerald"
                        icon={TrendingUp}
                        description="تم قيدها في صناديق أرباح المستثمرين"
                    />
                </StatGrid>

                {/* 3. Sales History DataGrid */}
                <DataGrid<InvoiceSale>
                    title="سجل عمليات بيع الفاتورة للمستثمرين"
                    description="العمليات المنفذة على هذه الفاتورة ومبالغ الشراء المحصلة والربح الصافي لكل عملية"
                    icon={ShoppingCart}
                    columns={salesColumns}
                    data={invoice.sales}
                    renderMobileCard={renderMobileSaleCard}
                    emptyMessage="لم يتم بيع أي جزء من هذه الفاتورة بعد."
                />

                {/* 4. Investor Profit Distribution Audit Table */}
                <Card className="shadow-xs border-border" dir="rtl">
                    <CardHeader className="p-4 sm:p-5 border-b border-border">
                        <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span>بيان توزيع الأرباح على حسابات وصناديق المستثمرين</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                            سجل شفاف يوضح كل دينار من أرباح الفاتورة تم إيداعه في محفظة أي شريك ومقدار نسبته المعتمدة
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-muted/50 text-muted-foreground uppercase border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">رقم عملية البيع</th>
                                        <th className="px-4 py-3 font-semibold">المستثمر الشريك</th>
                                        <th className="px-4 py-3 font-semibold text-center">النسبة المعتمدة</th>
                                        <th className="px-4 py-3 font-semibold text-left">مبلغ الربح المحصل</th>
                                        <th className="px-4 py-3 font-semibold text-center">حالة القيد في الصندوق</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {invoice.sales.flatMap((s) =>
                                        (s.distributions || []).map((d) => ({
                                            ...d,
                                            saleNumber: s.sale_number,
                                        }))
                                    ).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-6 text-muted-foreground">
                                                لا توجد توزيعات أرباح مسجلة بعد.
                                            </td>
                                        </tr>
                                    ) : (
                                        invoice.sales.flatMap((s) =>
                                            (s.distributions || []).map((d) => (
                                                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-bold text-primary">
                                                        {s.sale_number}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-foreground">
                                                        <Link
                                                            href={`/investors/${d.investor_id}`}
                                                            className="hover:underline hover:text-primary flex items-center gap-1.5"
                                                        >
                                                            <span>{d.investor?.name || 'مستثمر'}</span>
                                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                                ({d.investor?.code})
                                                            </span>
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-center">
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {Number(d.share_percentage)}%
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <MoneyDisplay
                                                            amount={d.profit_amount}
                                                            currency="د.ع"
                                                            size="sm"
                                                            variant="emerald"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            <span>تم الإيداع بمحفظة المستثمر</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
