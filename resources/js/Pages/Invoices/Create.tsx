import { useState, useMemo, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Receipt,
    ArrowLeft,
    DollarSign,
    Coins,
    Calendar,
    Save,
    Info,
    Wallet,
    Landmark,
    Users,
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

interface Props {
    investors: Investor[];
    funds: Fund[];
    banks: Bank[];
}

interface CreateInvoiceForm {
    invoice_number: string;
    purchase_date: string;
    amount_usd: string;
    exchange_rate: string;
    tax_percentage: string;
    paid_from_type: string;
    paid_from_id: string;
    investor_id: string;
    notes: string;
}

export default function InvoiceCreate({ investors, funds, banks }: Props) {
    const { data, setData, post, processing, errors } = useForm<CreateInvoiceForm>({
        invoice_number: '',
        purchase_date: new Date().toISOString().split('T')[0],
        amount_usd: '',
        exchange_rate: '',
        tax_percentage: '0',
        paid_from_type: '',
        paid_from_id: '',
        investor_id: '',
        notes: '',
    });

    // Exact calculations as in Lahomes
    const calculated = useMemo(() => {
        const usd = parseFloat(data.amount_usd) || 0;
        const rate = parseFloat(data.exchange_rate) || 0;
        const taxPct = parseFloat(data.tax_percentage) || 0;

        const amountIqd = usd * rate;
        const taxAmountIqd = amountIqd * (taxPct / 100);
        const totalIqd = amountIqd + taxAmountIqd;

        return {
            usd,
            rate,
            amountIqd,
            taxAmountIqd,
            totalIqd,
        };
    }, [data.amount_usd, data.exchange_rate, data.tax_percentage]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/invoices');
    };

    return (
        <AuthenticatedLayout header="شراء فاتورة جديدة" activeNav="invoices">
            <Head title="شراء فاتورة جديدة" />

            <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title="شراء وتسجيل فاتورة استيرادية جديدة"
                    description="أدخل تفاصيل الفاتورة بالدولار الأمريكي وسعر الصرف والرسوم لاحتساب التكلفة الإجمالية"
                    icon={Receipt}
                    actions={
                        <Link href="/invoices">
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>العودة لقائمة الفواتير</span>
                            </Button>
                        </Link>
                    }
                />

                {/* 2. Purchase Form Card */}
                <Card className="shadow-xs border-border">
                    <CardHeader className="pb-4 border-b border-border">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            <span>بيانات وتكلفة الفاتورة الأصلية</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                            الحقول المؤشرة بعلامة (*) إلزامية؛ الحسابات تتم تلقائياً ومطابقة لمعادلات الصرف المعتمدة
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Row 1: Invoice Number & Purchase Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="invoice_number" className="text-xs font-semibold">
                                        رقم الفاتورة <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="invoice_number"
                                        placeholder="مثال: INV-2026-001"
                                        dir="ltr"
                                        className="font-mono text-xs h-9"
                                        value={data.invoice_number}
                                        onChange={(e) => setData('invoice_number', e.target.value)}
                                        required
                                    />
                                    {errors.invoice_number && (
                                        <p className="text-[11px] text-destructive">{errors.invoice_number}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="purchase_date" className="text-xs font-semibold">
                                        تاريخ الشراء <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="purchase_date"
                                        type="date"
                                        className="h-9 text-xs"
                                        value={data.purchase_date}
                                        onChange={(e) => setData('purchase_date', e.target.value)}
                                        required
                                    />
                                    {errors.purchase_date && (
                                        <p className="text-[11px] text-destructive">{errors.purchase_date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Amount USD & Exchange Rate */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="amount_usd" className="text-xs font-semibold">
                                        مبلغ الفاتورة بالدولار ($) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="amount_usd"
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        placeholder="مثال: 50000"
                                        dir="ltr"
                                        className="text-base font-mono font-bold h-10"
                                        value={data.amount_usd}
                                        onChange={(e) => setData('amount_usd', e.target.value)}
                                        required
                                    />
                                    {errors.amount_usd && (
                                        <p className="text-[11px] text-destructive">{errors.amount_usd}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="exchange_rate" className="text-xs font-semibold">
                                        سعر الصرف (د.ع لكل دولار) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="exchange_rate"
                                        type="number"
                                        step="any"
                                        min="0.0001"
                                        placeholder="مثال: 1500"
                                        dir="ltr"
                                        className="text-base font-mono font-bold h-10"
                                        value={data.exchange_rate}
                                        onChange={(e) => setData('exchange_rate', e.target.value)}
                                        required
                                    />
                                    {errors.exchange_rate && (
                                        <p className="text-[11px] text-destructive">{errors.exchange_rate}</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 3: Amount IQD (Calculated) & Tax Percentage */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        المبلغ بالدينار العراقي (قبل الرسوم)
                                    </Label>
                                    <div className="h-9 px-3 rounded-md bg-muted/60 border border-border flex items-center font-mono text-sm font-bold text-foreground" dir="ltr">
                                        {calculated.amountIqd.toLocaleString()} IQD
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="tax_percentage" className="text-xs font-semibold">
                                        نسبة الضريبة / الرسوم (%) <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="tax_percentage"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        dir="ltr"
                                        className="font-mono text-xs h-9"
                                        value={data.tax_percentage}
                                        onChange={(e) => setData('tax_percentage', e.target.value)}
                                        required
                                    />
                                    {errors.tax_percentage && (
                                        <p className="text-[11px] text-destructive">{errors.tax_percentage}</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 4: Tax Amount IQD & Total IQD with Tax */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        مبلغ الضريبة بالدينار العراقي
                                    </Label>
                                    <div className="h-9 px-3 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center font-mono text-sm font-bold text-amber-700 dark:text-amber-400" dir="ltr">
                                        {calculated.taxAmountIqd.toLocaleString()} IQD
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        المبلغ الكلي النهائي مع الضريبة
                                    </Label>
                                    <div className="h-9 px-3 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center font-mono text-base font-bold text-purple-700 dark:text-purple-300" dir="ltr">
                                        {calculated.totalIqd.toLocaleString()} IQD
                                    </div>
                                </div>
                            </div>

                            {/* Profit Allocation Choice */}
                            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <Label className="text-xs font-bold text-foreground">
                                        تخصيص أرباح الفاتورة للمستثمرين:
                                    </Label>
                                </div>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2.5"
                                    value={data.investor_id}
                                    onChange={(e) => setData('investor_id', e.target.value)}
                                >
                                    <option value="">
                                        استثمار عام (توزيع أرباح البيع تلقائياً على كافة الشركاء النشطين حسب رأس المال)
                                    </option>
                                    {investors.map((inv) => (
                                        <option key={inv.id} value={inv.id}>
                                            تخصيص الفاتورة للمستثمر: {inv.name} ({inv.code})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-muted-foreground">
                                    إذا اخترت (عام)، فإن أرباح بيع هذه الفاتورة تُوزع آلياً في صناديق أرباح الشركاء بنسبة حصصهم في رأس المال.
                                </p>
                            </div>

                            {/* Payment Source (Optional Deduction) */}
                            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-emerald-600" />
                                    <Label className="text-xs font-bold text-foreground">
                                        مصدر تمويل ودفع شراء الفاتورة (اختياري):
                                    </Label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-muted-foreground">طريقة الدفع:</span>
                                        <select
                                            className="w-full text-xs rounded-md border border-input bg-background p-2"
                                            value={data.paid_from_type}
                                            onChange={(e) => {
                                                const t = e.target.value;
                                                setData((prev) => ({
                                                    ...prev,
                                                    paid_from_type: t,
                                                    paid_from_id: t === 'bank' ? String(banks[0]?.id || '') : String(funds[0]?.id || ''),
                                                }));
                                            }}
                                        >
                                            <option value="">بدون خصم تلقائي (تمويل خارجي)</option>
                                            <option value="fund">صندوق نقدي (كاش)</option>
                                            <option value="bank">حساب بنكي</option>
                                        </select>
                                    </div>

                                    {data.paid_from_type && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground">الحساب الممول:</span>
                                            <select
                                                className="w-full text-xs rounded-md border border-input bg-background p-2"
                                                value={data.paid_from_id}
                                                onChange={(e) => setData('paid_from_id', e.target.value)}
                                            >
                                                {data.paid_from_type === 'fund'
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
                                <Label htmlFor="notes" className="text-xs font-semibold">ملاحظات إضافية</Label>
                                <Input
                                    id="notes"
                                    placeholder="أي تفاصيل تتعلق بالفاتورة، المورد، أو الحاوية"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* Submit & Cancel Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                <Link href="/invoices">
                                    <Button type="button" variant="outline" className="text-xs h-9">
                                        إلغاء
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{processing ? 'جاري الحفظ...' : 'حفظ وتسجيل الفاتورة'}</span>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

