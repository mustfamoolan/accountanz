import { useState, FormEventHandler, useMemo } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
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
    PlusCircle,
    Eye,
    TrendingUp,
    DollarSign,
    Coins,
    Users,
    ShoppingCart,
    ArrowUpRight,
    Landmark,
    Wallet,
    Info,
    Trash2,
} from 'lucide-react';

interface Investor {
    id: number;
    name: string;
    code: string;
    capital_balance: number | string;
    profit_rate: number | string;
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

interface Customer {
    id: number;
    name: string;
    phone?: string;
    company_name?: string;
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
    funds: Fund[];
    banks: Bank[];
    customers: Customer[];
}

export default function InvoicesIndex({
    invoices,
    stats,
    filters,
    investors,
    funds,
    banks,
    customers,
}: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [sellOpen, setSellOpen] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [selectedInvoiceForSale, setSelectedInvoiceForSale] = useState<Invoice | null>(null);

    // Create Invoice Form
    const createForm = useForm({
        invoice_number: '',
        amount_usd: '',
        exchange_rate: '1500',
        tax_percentage: '0',
        paid_from_type: '',
        paid_from_id: '',
        investor_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Create Customer Form
    const customerForm = useForm({
        name: '',
        phone: '',
        company_name: '',
        notes: '',
    });

    // Sell Invoice Form (Multiple customers support)
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentDestType, setPaymentDestType] = useState<'fund' | 'bank'>('fund');
    const [paymentDestId, setPaymentDestId] = useState<number>(funds[0]?.id || 1);
    const [customerItems, setCustomerItems] = useState<
        Array<{ customer_id: number; amount_usd: string; exchange_rate: string; customs_percentage: string; notes: string }>
    >([
        {
            customer_id: customers[0]?.id || 1,
            amount_usd: '',
            exchange_rate: '1530',
            customs_percentage: '0',
            notes: '',
        },
    ]);

    // Live calculations for Create Form
    const createAmounts = useMemo(() => {
        const usd = parseFloat(createForm.data.amount_usd) || 0;
        const rate = parseFloat(createForm.data.exchange_rate) || 0;
        const taxRate = parseFloat(createForm.data.tax_percentage) || 0;
        const amountIqd = usd * rate;
        const taxIqd = amountIqd * (taxRate / 100);
        const totalIqd = amountIqd + taxIqd;
        return { usd, rate, amountIqd, taxIqd, totalIqd };
    }, [createForm.data.amount_usd, createForm.data.exchange_rate, createForm.data.tax_percentage]);

    // Live calculations for Sell Form
    const saleSummary = useMemo(() => {
        if (!selectedInvoiceForSale) return { totalUsd: 0, totalIqd: 0, costIqd: 0, profitIqd: 0 };
        let totalUsd = 0;
        let totalIqd = 0;
        customerItems.forEach((item) => {
            const u = parseFloat(item.amount_usd) || 0;
            const r = parseFloat(item.exchange_rate) || 0;
            totalUsd += u;
            totalIqd += u * r;
        });
        const costIqd = totalUsd * Number(selectedInvoiceForSale.exchange_rate);
        const profitIqd = totalIqd - costIqd;
        return { totalUsd, totalIqd, costIqd, profitIqd };
    }, [selectedInvoiceForSale, customerItems]);

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post('/invoices', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleCustomerCreate: FormEventHandler = (e) => {
        e.preventDefault();
        customerForm.post('/customers', {
            onSuccess: () => {
                setCustomerOpen(false);
                customerForm.reset();
            },
        });
    };

    const openSellModal = (invoice: Invoice, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedInvoiceForSale(invoice);
        const available = Number(invoice.available_amount_usd);
        setCustomerItems([
            {
                customer_id: customers[0]?.id || 1,
                amount_usd: available > 0 ? String(available) : '',
                exchange_rate: String(Number(invoice.exchange_rate) + 30),
                customs_percentage: '0',
                notes: '',
            },
        ]);
        setSellOpen(true);
    };

    const addCustomerRow = () => {
        setCustomerItems((prev) => [
            ...prev,
            {
                customer_id: customers[0]?.id || 1,
                amount_usd: '',
                exchange_rate: selectedInvoiceForSale
                    ? String(Number(selectedInvoiceForSale.exchange_rate) + 30)
                    : '1530',
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
        if (!selectedInvoiceForSale) return;

        router.post(
            `/invoices/${selectedInvoiceForSale.id}/sell`,
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
                        <Button
                            size="sm"
                            onClick={(e) => openSellModal(inv, e)}
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <ShoppingCart className="h-3 w-3" />
                            <span>بيع</span>
                        </Button>
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
                    <Button
                        size="sm"
                        onClick={() => openSellModal(inv)}
                        className="flex-1 text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>بيع الفاتورة</span>
                    </Button>
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
                    description="شراء الفواتير بالدولار، بيعها وتجزئتها للعملاء بالدينار، وتوزيع الأرباح آلياً على حصص المستثمرين"
                    icon={Receipt}
                    badge={
                        <Badge variant="secondary" className="font-mono text-xs">
                            {stats.totalInvoicesCount} فاتورة
                        </Badge>
                    }
                    actions={
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setCustomerOpen(true)}
                                className="gap-1.5 h-9 text-xs"
                            >
                                <Users className="h-4 w-4 text-primary" />
                                <span>إضافة عميل جديد</span>
                            </Button>
                            <Button
                                onClick={() => setCreateOpen(true)}
                                className="gap-1.5 h-9 text-xs"
                            >
                                <PlusCircle className="h-4 w-4" />
                                <span>شراء فاتورة جديدة ($)</span>
                            </Button>
                        </>
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
                    description="اضغط على زر (بيع) لتجزئة الفاتورة على العملاء وتوزيع الأرباح فورياً على الشركاء"
                    icon={Receipt}
                    columns={columns}
                    data={invoices.data}
                    total={invoices.total}
                    links={invoices.links}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا توجد فواتير مسجلة حالياً. اضغط على 'شراء فاتورة جديدة' للبدء."
                />
            </div>

            {/* Modal: Purchase New Invoice */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-primary" />
                            <span>شراء وتسجيل فاتورة استيرادية جديدة</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            سجل بيانات الفاتورة بالدولار وسعر الصرف وخطة توزيع الأرباح على المستثمرين
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-no" className="text-xs font-semibold">
                                    رقم الفاتورة / الشحنة <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="inv-no"
                                    placeholder="مثال: INV-2026-001"
                                    dir="ltr"
                                    className="font-mono text-xs"
                                    value={createForm.data.invoice_number}
                                    onChange={(e) => createForm.setData('invoice_number', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-date" className="text-xs font-semibold">
                                    تاريخ الشراء <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="inv-date"
                                    type="date"
                                    value={createForm.data.purchase_date}
                                    onChange={(e) => createForm.setData('purchase_date', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-amt" className="text-xs font-semibold">
                                    مبلغ الفاتورة بالدولار ($) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="inv-amt"
                                    type="number"
                                    step="any"
                                    min="1"
                                    placeholder="مثال: 50000"
                                    dir="ltr"
                                    className="text-base font-mono font-bold"
                                    value={createForm.data.amount_usd}
                                    onChange={(e) => createForm.setData('amount_usd', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-rate" className="text-xs font-semibold">
                                    سعر صرف الشراء (د.ع / $) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="inv-rate"
                                    type="number"
                                    step="any"
                                    placeholder="1500"
                                    dir="ltr"
                                    className="text-base font-mono font-bold"
                                    value={createForm.data.exchange_rate}
                                    onChange={(e) => createForm.setData('exchange_rate', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="inv-tax" className="text-xs font-semibold">
                                    نسبة الرسوم / الضريبة (%)
                                </Label>
                                <Input
                                    id="inv-tax"
                                    type="number"
                                    step="0.1"
                                    placeholder="0"
                                    dir="ltr"
                                    className="font-mono text-xs"
                                    value={createForm.data.tax_percentage}
                                    onChange={(e) => createForm.setData('tax_percentage', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    قيمة الرسوم المحتسبة
                                </Label>
                                <div className="h-9 px-3 rounded-md bg-muted/60 border border-border flex items-center font-mono text-xs text-foreground">
                                    {createAmounts.taxIqd.toLocaleString()} د.ع
                                </div>
                            </div>
                        </div>

                        {/* Live Cost Summary Banner */}
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                            <div className="flex justify-between items-center text-purple-900 dark:text-purple-300">
                                <span>التكلفة الإجمالية للشراء بالدينار:</span>
                                <strong className="font-mono text-sm text-purple-700 dark:text-purple-300">
                                    {createAmounts.totalIqd.toLocaleString()} د.ع
                                </strong>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                التكلفة الأصلية: {createAmounts.amountIqd.toLocaleString()} د.ع + رسوم: {createAmounts.taxIqd.toLocaleString()} د.ع
                            </p>
                        </div>

                        {/* Profit Allocation Choice (Scenario 1 vs Specific Investor) */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                                خطة تخصيص وتوزيع أرباح الفاتورة <span className="text-destructive">*</span>
                            </Label>
                            <select
                                className="w-full text-xs rounded-md border border-input bg-background p-2"
                                value={createForm.data.investor_id}
                                onChange={(e) => createForm.setData('investor_id', e.target.value)}
                            >
                                <option value="">
                                    استثمار عام (توزيع الأرباح تلقائياً على جميع المستثمرين حسب نسبة رأس المال)
                                </option>
                                {investors.map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                        تخصيص الفاتورة للمستثمر: {inv.name} ({inv.code})
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-muted-foreground">
                                في الخيار العام، يتم توزيع الأرباح آلياً بنسبة مساهمة كل شريك في رأس مال الشركة.
                            </p>
                        </div>

                        {/* Payment Source (Optional Deduction) */}
                        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2 text-xs">
                            <Label className="font-semibold text-foreground">
                                تمويل وشراء الفاتورة من الخزينة (اختياري):
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground">جهة الخصم:</span>
                                    <select
                                        className="w-full text-xs rounded-md border border-input bg-background p-1.5"
                                        value={createForm.data.paid_from_type}
                                        onChange={(e) => {
                                            createForm.setData((prev) => ({
                                                ...prev,
                                                paid_from_type: e.target.value,
                                                paid_from_id: e.target.value === 'bank' ? banks[0]?.id || '' : funds[0]?.id || '',
                                            }));
                                        }}
                                    >
                                        <option value="">بدون خصم تلقائي (تمويل خارجي)</option>
                                        <option value="fund">صندوق نقدي (كاش)</option>
                                        <option value="bank">حساب بنكي</option>
                                    </select>
                                </div>

                                {createForm.data.paid_from_type && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground">اختر الحساب:</span>
                                        <select
                                            className="w-full text-xs rounded-md border border-input bg-background p-1.5"
                                            value={createForm.data.paid_from_id}
                                            onChange={(e) => createForm.setData('paid_from_id', e.target.value)}
                                        >
                                            {createForm.data.paid_from_type === 'fund'
                                                ? funds.map((f) => (
                                                      <option key={f.id} value={f.id}>
                                                          {f.name} ({Number(f.balance).toLocaleString()} {f.currency})
                                                      </option>
                                                  ))
                                                : banks.map((b) => (
                                                      <option key={b.id} value={b.id}>
                                                          {b.name} ({Number(b.balance).toLocaleString()} {b.currency})
                                                      </option>
                                                  ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="inv-notes" className="text-xs font-semibold">ملاحظات إضافية</Label>
                            <Input
                                id="inv-notes"
                                placeholder="تفاصيل الشحنة أو بوليصة الشحن"
                                value={createForm.data.notes}
                                onChange={(e) => createForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'جاري الحفظ...' : 'تأكيد شراء الفاتورة'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Sell Invoice to Customers */}
            <Dialog open={sellOpen} onOpenChange={setSellOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <ShoppingCart className="h-5 w-5" />
                            <span>بيع وتجزئة الفاتورة [{selectedInvoiceForSale?.invoice_number}]</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            حدد العملاء والكميات وسعر الصرف لكل عميل؛ سيتم احتساب الأرباح وتوزيعها على المستثمرين فورياً
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInvoiceForSale && (
                        <form onSubmit={handleSellSubmit} className="space-y-4">
                            {/* Invoice Quick Summary Banner */}
                            <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div>
                                    <span className="text-[10px] text-muted-foreground block">إجمالي الفاتورة:</span>
                                    <strong className="font-mono text-sm">
                                        ${Number(selectedInvoiceForSale.amount_usd).toLocaleString()}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block">سعر الشراء:</span>
                                    <strong className="font-mono text-sm">
                                        {Number(selectedInvoiceForSale.exchange_rate).toLocaleString()} د.ع
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block">المباع سابقاً:</span>
                                    <strong className="font-mono text-sm text-blue-600">
                                        ${Number(selectedInvoiceForSale.sold_amount_usd).toLocaleString()}
                                    </strong>
                                </div>
                                <div>
                                    <span className="text-[10px] text-muted-foreground block">المتاح للبيع حالياً:</span>
                                    <strong className="font-mono text-sm text-emerald-600">
                                        ${Number(selectedInvoiceForSale.available_amount_usd).toLocaleString()}
                                    </strong>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">تاريخ عملية البيع</Label>
                                    <Input
                                        type="date"
                                        value={saleDate}
                                        onChange={(e) => setSaleDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">جهة توريد المبلغ المحصل (دينار)</Label>
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

                            {/* Customer Sale Rows */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-foreground">
                                        توزيع الكميات على العملاء:
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={addCustomerRow}
                                        className="h-7 text-xs gap-1"
                                    >
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        <span>إضافة عميل آخر</span>
                                    </Button>
                                </div>

                                <div className="space-y-2.5">
                                    {customerItems.map((item, idx) => {
                                        const rowTotal =
                                            (parseFloat(item.amount_usd) || 0) * (parseFloat(item.exchange_rate) || 0);
                                        return (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-lg border border-border bg-card/60 space-y-2"
                                            >
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-muted-foreground">
                                                        العميل #{idx + 1}
                                                    </span>
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
                                                        <span className="text-[10px] text-muted-foreground block mb-1">
                                                            اسم العميل
                                                        </span>
                                                        <select
                                                            className="w-full text-xs rounded-md border border-input bg-background p-2"
                                                            value={item.customer_id}
                                                            onChange={(e) =>
                                                                updateCustomerItem(idx, 'customer_id', Number(e.target.value))
                                                            }
                                                        >
                                                            {customers.map((c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block mb-1">
                                                            الكمية ($)
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="1"
                                                            placeholder="0.00"
                                                            dir="ltr"
                                                            className="font-mono text-xs font-bold"
                                                            value={item.amount_usd}
                                                            onChange={(e) =>
                                                                updateCustomerItem(idx, 'amount_usd', e.target.value)
                                                            }
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block mb-1">
                                                            سعر الصرف (د.ع)
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            placeholder="1530"
                                                            dir="ltr"
                                                            className="font-mono text-xs font-bold"
                                                            value={item.exchange_rate}
                                                            onChange={(e) =>
                                                                updateCustomerItem(idx, 'exchange_rate', e.target.value)
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-[11px] pt-1 text-muted-foreground border-t border-border/40">
                                                    <span>المطلوب من هذا العميل بالدينار:</span>
                                                    <span className="font-mono font-bold text-foreground">
                                                        {rowTotal.toLocaleString()} د.ع
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Calculations Summary Box */}
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">إجمالي الكمية المباعة:</span>
                                        <strong className="font-mono text-sm text-foreground">
                                            ${saleSummary.totalUsd.toLocaleString()}
                                        </strong>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">إجمالي سعر البيع:</span>
                                        <strong className="font-mono text-sm text-foreground">
                                            {saleSummary.totalIqd.toLocaleString()} د.ع
                                        </strong>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">التكلفة الأصلية:</span>
                                        <strong className="font-mono text-sm text-muted-foreground">
                                            {saleSummary.costIqd.toLocaleString()} د.ع
                                        </strong>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">الربح الصافي:</span>
                                        <strong className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                                            {saleSummary.profitIqd.toLocaleString()} د.ع
                                        </strong>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                    <Info className="h-4 w-4 shrink-0 text-emerald-600" />
                                    <span>
                                        {selectedInvoiceForSale.investor ? (
                                            <>
                                                سيتم إيداع الربح ({saleSummary.profitIqd.toLocaleString()} د.ع) مباشرة في محفظة المستثمر المخصص:{' '}
                                                <strong>{selectedInvoiceForSale.investor.name}</strong>.
                                            </>
                                        ) : (
                                            <>
                                                سيتم توزيع الربح ({saleSummary.profitIqd.toLocaleString()} د.ع) آلياً على جميع الشركاء والمستثمرين النشطين وفق نسبة رأس مال كل شريك.
                                            </>
                                        )}
                                    </span>
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
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal: Quick Add Customer */}
            <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <span>إضافة عميل جديد</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            سجل بيانات العميل ليظهر في قائمة المشترين للفواتير
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCustomerCreate} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="cust-name" className="text-xs font-semibold">
                                اسم العميل / المفوض <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="cust-name"
                                placeholder="مثال: محمد جاسم"
                                value={customerForm.data.name}
                                onChange={(e) => customerForm.setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="cust-phone" className="text-xs font-semibold">
                                    رقم الهاتف
                                </Label>
                                <Input
                                    id="cust-phone"
                                    placeholder="07XXXXXXXXX"
                                    dir="ltr"
                                    className="font-mono text-xs"
                                    value={customerForm.data.phone}
                                    onChange={(e) => customerForm.setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="cust-comp" className="text-xs font-semibold">
                                    اسم الشركة / المكتب
                                </Label>
                                <Input
                                    id="cust-comp"
                                    placeholder="شركة الأفق"
                                    value={customerForm.data.company_name}
                                    onChange={(e) => customerForm.setData('company_name', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="cust-notes" className="text-xs font-semibold">ملاحظات</Label>
                            <Input
                                id="cust-notes"
                                placeholder="ملاحظات حول العميل"
                                value={customerForm.data.notes}
                                onChange={(e) => customerForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCustomerOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={customerForm.processing}>
                                {customerForm.processing ? 'جاري الحفظ...' : 'حفظ العميل'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
