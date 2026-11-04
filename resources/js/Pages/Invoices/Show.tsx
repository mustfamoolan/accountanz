import { useState, FormEventHandler, useMemo } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Receipt,
    ArrowLeft,
    DollarSign,
    Coins,
    TrendingUp,
    Users,
    ShoppingCart,
    Calendar,
    Landmark,
    Wallet,
    Info,
    Trash2,
    CheckCircle2,
    FileText,
} from 'lucide-react';

interface Investor {
    id: number;
    name: string;
    code: string;
    profit_rate?: number | string;
}

interface Customer {
    id: number;
    name: string;
    company_name?: string;
    phone?: string;
}

interface InvoiceSaleItem {
    id: number;
    customer_id: number;
    amount_usd: number | string;
    exchange_rate: number | string;
    amount_iqd: number | string;
    customs_percentage: number | string;
    notes?: string;
    customer?: Customer;
}

interface InvoiceDistribution {
    id: number;
    investor_id: number;
    share_percentage: number | string;
    profit_amount: number | string;
    treasury_transaction_id?: number;
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
    payment_destination_id: number;
    items?: InvoiceSaleItem[];
    distributions?: InvoiceDistribution[];
    createdBy?: { name: string };
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
    notes?: string;
    paid_from_type?: string;
    paid_from_id?: number;
    investor_id?: number | null;
    investor?: Investor | null;
    sales: InvoiceSale[];
    sold_amount_usd: number;
    available_amount_usd: number;
    total_profit_iqd: number;
}

interface Fund {
    id: number;
    name: string;
    currency: string;
    balance: number | string;
}

interface Bank {
    id: number;
    name: string;
    currency: string;
    balance: number | string;
}

interface Props {
    invoice: Invoice;
    funds: Fund[];
    banks: Bank[];
    customers: Customer[];
}

export default function InvoiceShow({ invoice, funds, banks, customers }: Props) {
    const [sellOpen, setSellOpen] = useState(false);

    // Sell Form State
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentDestType, setPaymentDestType] = useState<'fund' | 'bank'>('fund');
    const [paymentDestId, setPaymentDestId] = useState<number>(funds[0]?.id || 1);
    const [customerItems, setCustomerItems] = useState<
        Array<{ customer_id: number; amount_usd: string; exchange_rate: string; customs_percentage: string; notes: string }>
    >([
        {
            customer_id: customers[0]?.id || 1,
            amount_usd: invoice.available_amount_usd > 0 ? String(invoice.available_amount_usd) : '',
            exchange_rate: String(Number(invoice.exchange_rate) + 30),
            customs_percentage: '0',
            notes: '',
        },
    ]);

    const saleSummary = useMemo(() => {
        let totalUsd = 0;
        let totalIqd = 0;
        customerItems.forEach((item) => {
            const u = parseFloat(item.amount_usd) || 0;
            const r = parseFloat(item.exchange_rate) || 0;
            totalUsd += u;
            totalIqd += u * r;
        });
        const costIqd = totalUsd * Number(invoice.exchange_rate);
        const profitIqd = totalIqd - costIqd;
        return { totalUsd, totalIqd, costIqd, profitIqd };
    }, [invoice, customerItems]);

    const addCustomerRow = () => {
        setCustomerItems((prev) => [
            ...prev,
            {
                customer_id: customers[0]?.id || 1,
                amount_usd: '',
                exchange_rate: String(Number(invoice.exchange_rate) + 30),
                customs_percentage: '0',
                notes: '',
            },
        ]);
    };

    const removeCustomerRow = (idx: number) => {
        if (customerItems.length <= 1) return;
        setCustomerItems((prev) => prev.filter((_, i) => i !== idx));
    };

    const updateCustomerItem = (index: number, field: string, value: any) => {
        setCustomerItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleSellSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        router.post(
            `/invoices/${invoice.id}/sell`,
            {
                sale_date: saleDate,
                payment_destination_type: paymentDestType,
                payment_destination_id: paymentDestId,
                customers: customerItems.map((c) => ({
                    customer_id: Number(c.customer_id),
                    amount_usd: parseFloat(c.amount_usd),
                    exchange_rate: parseFloat(c.exchange_rate),
                    customs_percentage: parseFloat(c.customs_percentage) || 0,
                    notes: c.notes || '',
                })),
            },
            {
                onSuccess: () => {
                    setSellOpen(false);
                },
            }
        );
    };

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
            header: 'العملاء والمشترين',
            cell: (s) => (
                <div className="space-y-1">
                    {s.items?.map((item, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-semibold text-foreground">{item.customer?.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                                (${Number(item.amount_usd).toLocaleString()} @ {Number(item.exchange_rate).toLocaleString()})
                            </span>
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
                <span className="text-muted-foreground block text-[10px]">العملاء:</span>
                {s.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                        <span>{item.customer?.name}</span>
                        <span className="font-mono text-muted-foreground">
                            ${Number(item.amount_usd).toLocaleString()} ({Number(item.amount_iqd).toLocaleString()} د.ع)
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
                                <Button
                                    onClick={() => setSellOpen(true)}
                                    className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    <span>بيع من الفاتورة</span>
                                </Button>
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
                        description={`شاملة الرسوم: ${Number(invoice.tax_iqd).toLocaleString()} د.ع`}
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
                        description="تم قيدها في محافظ المستثمرين"
                    />
                </StatGrid>

                {/* 3. Sales History DataGrid */}
                <DataGrid<InvoiceSale>
                    title="سجل عمليات البيع والتجزئة للعملاء"
                    description="العمليات المنفذة على هذه الفاتورة ومبالغ البيع المحصلة والربح الصافي لكل بيع"
                    icon={ShoppingCart}
                    columns={salesColumns}
                    data={invoice.sales}
                    renderMobileCard={renderMobileSaleCard}
                    emptyMessage="لم يتم بيع أي جزء من هذه الفاتورة بعد."
                />

                {/* 4. Investor Profit Distribution Audit Table */}
                <Card className="shadow-xs" dir="rtl">
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
                                            saleDate: s.sale_date,
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

            {/* Modal: Sell from Invoice */}
            <Dialog open={sellOpen} onOpenChange={setSellOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <ShoppingCart className="h-5 w-5" />
                            <span>بيع وتجزئة من الفاتورة [{invoice.invoice_number}]</span>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSellSubmit} className="space-y-4">
                        <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs flex justify-between">
                            <span>الكمية المتاحة للبيع حالياً:</span>
                            <strong className="font-mono text-emerald-600 text-sm">
                                ${Number(invoice.available_amount_usd).toLocaleString()}
                            </strong>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">تاريخ البيع</Label>
                                <Input
                                    type="date"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">جهة توريد النقد (دينار)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        className="text-xs rounded-md border border-input bg-background p-2"
                                        value={paymentDestType}
                                        onChange={(e) => {
                                            const t = e.target.value as 'fund' | 'bank';
                                            setPaymentDestType(t);
                                            setPaymentDestId(t === 'bank' ? banks[0]?.id || 1 : funds[0]?.id || 1);
                                        }}
                                    >
                                        <option value="fund">صندوق (كاش)</option>
                                        <option value="bank">حساب بنكي</option>
                                    </select>

                                    <select
                                        className="text-xs rounded-md border border-input bg-background p-2"
                                        value={paymentDestId}
                                        onChange={(e) => setPaymentDestId(Number(e.target.value))}
                                    >
                                        {paymentDestType === 'fund'
                                            ? funds.map((f) => (
                                                  <option key={f.id} value={f.id}>
                                                      {f.name}
                                                  </option>
                                              ))
                                            : banks.map((b) => (
                                                  <option key={b.id} value={b.id}>
                                                      {b.name}
                                                  </option>
                                              ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold">العملاء والكميات المباعة:</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addCustomerRow}
                                    className="h-7 text-xs gap-1"
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    <span>إضافة عميل</span>
                                </Button>
                            </div>

                            {customerItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-lg border border-border bg-card/60 space-y-2 text-xs"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-muted-foreground">عميل #{idx + 1}</span>
                                        {customerItems.length > 1 && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeCustomerRow(idx)}
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block mb-1">العميل</span>
                                            <select
                                                className="w-full text-xs rounded-md border border-input bg-background p-2"
                                                value={item.customer_id}
                                                onChange={(e) =>
                                                    updateCustomerItem(idx, 'customer_id', Number(e.target.value))
                                                }
                                            >
                                                {customers.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block mb-1">الكمية ($)</span>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="0.00"
                                                dir="ltr"
                                                className="font-mono text-xs font-bold"
                                                value={item.amount_usd}
                                                onChange={(e) => updateCustomerItem(idx, 'amount_usd', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block mb-1">سعر الصرف</span>
                                            <Input
                                                type="number"
                                                step="any"
                                                placeholder="1530"
                                                dir="ltr"
                                                className="font-mono text-xs font-bold"
                                                value={item.exchange_rate}
                                                onChange={(e) => updateCustomerItem(idx, 'exchange_rate', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                                <span className="text-[10px] text-muted-foreground block">إجمالي المباع:</span>
                                <strong className="font-mono text-sm">${saleSummary.totalUsd.toLocaleString()}</strong>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block">سعر البيع:</span>
                                <strong className="font-mono text-sm">{saleSummary.totalIqd.toLocaleString()} د.ع</strong>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block">التكلفة:</span>
                                <strong className="font-mono text-sm">{saleSummary.costIqd.toLocaleString()} د.ع</strong>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block">الربح الصافي:</span>
                                <strong className="font-mono text-base text-emerald-600">
                                    {saleSummary.profitIqd.toLocaleString()} د.ع
                                </strong>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setSellOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={saleSummary.totalUsd <= 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                تأكيد البيع وتوزيع الأرباح
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
