import { useState, useMemo, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageHeader, MoneyDisplay } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    ShoppingCart,
    ArrowLeft,
    Users,
    DollarSign,
    Coins,
    Calendar,
    Save,
    Info,
    Wallet,
    Landmark,
    Trash2,
    PlusCircle,
    Percent,
} from 'lucide-react';

interface Investor {
    id: number;
    name: string;
    code: string;
    capital_balance: number | string;
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

interface Invoice {
    id: number;
    invoice_number: string;
    amount_usd: number;
    exchange_rate: number;
    sold_amount_usd: number;
    available_amount_usd: number;
    investor_id?: number | null;
    investor?: { id: number; name: string } | null;
}

interface InvestorSellRow {
    investor_id: number | '';
    amount_usd: string;
    exchange_rate: string;
    customs_percentage: string;
    customs_exchange_rate: string;
    notes: string;
}

interface Props {
    invoice: Invoice;
    investors: Investor[];
    funds: Fund[];
    banks: Bank[];
}

export default function InvoiceSell({ invoice, investors, funds, banks }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        sale_date: new Date().toISOString().split('T')[0],
        payment_destination_type: 'fund',
        payment_destination_id: funds[0]?.id || 1,
        investors: [
            {
                investor_id: investors[0]?.id || '',
                amount_usd: invoice.available_amount_usd > 0 ? String(invoice.available_amount_usd) : '',
                exchange_rate: String(Number(invoice.exchange_rate) + 30),
                customs_percentage: '0',
                customs_exchange_rate: String(Number(invoice.exchange_rate) + 30),
                notes: '',
            },
        ] as InvestorSellRow[],
    });

    const addInvestorRow = () => {
        setData('investors', [
            ...data.investors,
            {
                investor_id: investors[0]?.id || '',
                amount_usd: '',
                exchange_rate: String(Number(invoice.exchange_rate) + 30),
                customs_percentage: '0',
                customs_exchange_rate: String(Number(invoice.exchange_rate) + 30),
                notes: '',
            },
        ]);
    };

    const removeInvestorRow = (index: number) => {
        if (data.investors.length <= 1) return;
        setData('investors', data.investors.filter((_, i) => i !== index));
    };

    const updateRow = (index: number, field: keyof InvestorSellRow, value: any) => {
        setData(
            'investors',
            data.investors.map((row, i) => (i === index ? { ...row, [field]: value } : row))
        );
    };

    // Calculate details per row and overall totals
    const calculatedRows = useMemo(() => {
        return data.investors.map((row) => {
            const amountUsd = parseFloat(row.amount_usd) || 0;
            const rate = parseFloat(row.exchange_rate) || 0;
            const amountIqd = amountUsd * rate;

            const customsPct = parseFloat(row.customs_percentage) || 0;
            const customsAmountUsd = amountUsd * (customsPct / 100);
            const amountAfterCustomsUsd = amountUsd + customsAmountUsd;

            const customsRate = parseFloat(row.customs_exchange_rate) || rate;
            const customsAmountIqd = customsAmountUsd * customsRate;

            const totalFinalIqd = amountIqd + customsAmountIqd;

            return {
                amountUsd,
                rate,
                amountIqd,
                customsPct,
                customsAmountUsd,
                amountAfterCustomsUsd,
                customsRate,
                customsAmountIqd,
                totalFinalIqd,
            };
        });
    }, [data.investors]);

    const summary = useMemo(() => {
        let totalAmountUsd = 0;
        let totalSaleIqd = 0;

        calculatedRows.forEach((r) => {
            totalAmountUsd += r.amountUsd;
            totalSaleIqd += r.totalFinalIqd;
        });

        const costIqd = totalAmountUsd * Number(invoice.exchange_rate);
        const expectedProfitIqd = totalSaleIqd - costIqd;

        return {
            totalAmountUsd,
            totalSaleIqd,
            costIqd,
            expectedProfitIqd,
        };
    }, [calculatedRows, invoice.exchange_rate]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/invoices/${invoice.id}/sell`);
    };

    return (
        <AuthenticatedLayout header="بيع الفاتورة للمستثمرين" activeNav="invoices">
            <Head title={`بيع الفاتورة: ${invoice.invoice_number}`} />

            <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title={`بيع وتجزئة الفاتورة: ${invoice.invoice_number}`}
                    description="حدد المستثمرين والمبالغ بالدولار وسعر الصرف وحسابات الكمارك لتسجيل عملية البيع وتوزيع الأرباح"
                    icon={ShoppingCart}
                    actions={
                        <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>العودة لتفاصيل الفاتورة</span>
                            </Button>
                        </Link>
                    }
                />

                {/* 2. Original Invoice Summary Alert */}
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                    <div className="font-bold text-sm text-blue-900 dark:text-blue-300 mb-2">
                        تفاصيل الفاتورة الأصلية:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="text-muted-foreground block text-[11px]">المبلغ الأصلي:</span>
                            <strong className="font-mono text-sm text-foreground">
                                ${Number(invoice.amount_usd).toLocaleString()}
                            </strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-[11px]">سعر الصرف الأصلي:</span>
                            <strong className="font-mono text-sm text-foreground">
                                {Number(invoice.exchange_rate).toLocaleString()} د.ع
                            </strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-[11px]">المباع سابقاً:</span>
                            <strong className="font-mono text-sm text-blue-600">
                                ${Number(invoice.sold_amount_usd).toLocaleString()}
                            </strong>
                        </div>
                        <div>
                            <span className="text-muted-foreground block text-[11px]">المتبقي المتاح للبيع:</span>
                            <strong className="font-mono text-sm text-emerald-600 font-bold">
                                ${Number(invoice.available_amount_usd).toLocaleString()}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* 3. Sell Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Card className="shadow-xs border-border">
                        <CardHeader className="pb-4 border-b border-border">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>إعدادات عملية البيع ومقر استلام النقد</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="sale_date" className="text-xs font-semibold">
                                        تاريخ البيع <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="sale_date"
                                        type="date"
                                        className="h-9 text-xs"
                                        value={data.sale_date}
                                        onChange={(e) => setData('sale_date', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">
                                        جهة توريد واستلام النقد بالدينار <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            className="text-xs rounded-md border border-input bg-background p-2 h-9"
                                            value={data.payment_destination_type}
                                            onChange={(e) => {
                                                const t = e.target.value;
                                                setData((prev) => ({
                                                    ...prev,
                                                    payment_destination_type: t,
                                                    payment_destination_id:
                                                        t === 'bank' ? banks[0]?.id || 1 : funds[0]?.id || 1,
                                                }));
                                            }}
                                        >
                                            <option value="fund">صندوق نقدي (كاش)</option>
                                            <option value="bank">حساب بنكي</option>
                                        </select>

                                        <select
                                            className="text-xs rounded-md border border-input bg-background p-2 h-9"
                                            value={data.payment_destination_id}
                                            onChange={(e) => setData('payment_destination_id', Number(e.target.value))}
                                        >
                                            {data.payment_destination_type === 'fund'
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
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Investors Items Section */}
                    <Card className="shadow-xs border-border">
                        <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span>المستثمرون المشترون لحصص الفاتورة</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    يمكنك تجزئة الفاتورة وبيعها لأكثر من مستثمر في نفس العملية
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={addInvestorRow}
                                className="h-8 text-xs gap-1"
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span>إضافة مستثمر آخر</span>
                            </Button>
                        </CardHeader>

                        <CardContent className="pt-4 space-y-4">
                            {data.investors.map((row, idx) => {
                                const calc = calculatedRows[idx];
                                return (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl border border-border bg-card space-y-3.5 shadow-2xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                                                <span>المستثمر #{idx + 1}</span>
                                            </span>
                                            {data.investors.length > 1 && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeInvestorRow(idx)}
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                    title="حذف المستثمر"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Row Line 1: Investor, Amount USD, Exchange Rate */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold">
                                                    اختيار المستثمر <span className="text-destructive">*</span>
                                                </Label>
                                                <select
                                                    className="w-full text-xs rounded-md border border-input bg-background p-2 h-9"
                                                    value={row.investor_id}
                                                    onChange={(e) =>
                                                        updateRow(idx, 'investor_id', Number(e.target.value))
                                                    }
                                                    required
                                                >
                                                    <option value="">اختر مستثمر</option>
                                                    {investors.map((inv) => (
                                                        <option key={inv.id} value={inv.id}>
                                                            {inv.name} ({inv.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold">
                                                    المبلغ بالدولار ($) <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0.01"
                                                    placeholder="0.00"
                                                    dir="ltr"
                                                    className="font-mono text-sm font-bold h-9"
                                                    value={row.amount_usd}
                                                    onChange={(e) => updateRow(idx, 'amount_usd', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold">
                                                    سعر الصرف (د.ع) <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0.0001"
                                                    placeholder="مثال: 1530"
                                                    dir="ltr"
                                                    className="font-mono text-sm font-bold h-9"
                                                    value={row.exchange_rate}
                                                    onChange={(e) => updateRow(idx, 'exchange_rate', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Row Line 2: Customs Percentage, Amount After Customs USD, Amount IQD */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-primary">
                                                    قيمة الكمرك %
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0"
                                                    dir="ltr"
                                                    className="font-mono text-xs h-9"
                                                    value={row.customs_percentage}
                                                    onChange={(e) =>
                                                        updateRow(idx, 'customs_percentage', e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-primary">
                                                    المبلغ بعد الكمرك ($)
                                                </Label>
                                                <div className="h-9 px-3 rounded-md bg-muted/60 border border-border flex items-center font-mono text-xs text-foreground" dir="ltr">
                                                    ${calc.amountAfterCustomsUsd.toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-muted-foreground">
                                                    المبلغ بالدينار (قبل الكمرك)
                                                </Label>
                                                <div className="h-9 px-3 rounded-md bg-muted/60 border border-border flex items-center font-mono text-xs text-foreground" dir="ltr">
                                                    {calc.amountIqd.toLocaleString()} د.ع
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row Line 3: Customs Exchange Rate & Customs Amount IQD */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-primary">
                                                    سعر صرف الكمرك
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    placeholder="سعر صرف الكمرك"
                                                    dir="ltr"
                                                    className="font-mono text-xs h-9"
                                                    value={row.customs_exchange_rate}
                                                    onChange={(e) =>
                                                        updateRow(idx, 'customs_exchange_rate', e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-xs font-semibold text-primary">
                                                    قيمة الكمرك بالدينار
                                                </Label>
                                                <div className="h-9 px-3 rounded-md bg-muted/60 border border-border flex items-center font-mono text-xs text-foreground" dir="ltr">
                                                    {calc.customsAmountIqd.toLocaleString()} د.ع
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row Line 4: Final Total Amount IQD */}
                                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row justify-between sm:items-center gap-1 text-xs">
                                            <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                                                المبلغ الكلي النهائي المستحق على هذا المستثمر:
                                            </span>
                                            <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400" dir="ltr">
                                                {calc.totalFinalIqd.toLocaleString()} IQD
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Overall Summary Card */}
                    <Card className="shadow-xs border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
                        <CardHeader className="pb-3 border-b border-border/80">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Coins className="h-4 w-4 text-emerald-600" />
                                <span>مجاميع وأرباح عملية البيع</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block text-[11px]">إجمالي الكمية المباعة:</span>
                                    <strong className="font-mono text-base text-foreground">
                                        ${summary.totalAmountUsd.toLocaleString()}
                                    </strong>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block text-[11px]">إجمالي سعر البيع المحصل:</span>
                                    <strong className="font-mono text-base text-foreground">
                                        {summary.totalSaleIqd.toLocaleString()} د.ع
                                    </strong>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block text-[11px]">التكلفة الأصلية:</span>
                                    <strong className="font-mono text-base text-muted-foreground">
                                        {summary.costIqd.toLocaleString()} د.ع
                                    </strong>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block text-[11px]">صافي الربح المتولد:</span>
                                    <strong className="font-mono text-lg text-emerald-600 dark:text-emerald-400">
                                        {summary.expectedProfitIqd.toLocaleString()} د.ع
                                    </strong>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <Info className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span>
                                    {invoice.investor ? (
                                        <>
                                            سيتم قيد الربح الصافي ({summary.expectedProfitIqd.toLocaleString()} د.ع) في حساب المستثمر المخصص:{' '}
                                            <strong>{invoice.investor.name}</strong>.
                                        </>
                                    ) : (
                                        <>
                                            سيتم توزيع الربح الصافي ({summary.expectedProfitIqd.toLocaleString()} د.ع) تلقائياً على حسابات جميع الشركاء وفق نسبة رأس مال كل شريك.
                                        </>
                                    )}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href={`/invoices/${invoice.id}`}>
                            <Button type="button" variant="outline" className="text-xs h-9">
                                إلغاء
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || summary.totalAmountUsd <= 0}
                            className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Save className="h-4 w-4" />
                            <span>{processing ? 'جاري التنفيذ...' : 'حفظ عملية البيع وتوزيع الأرباح'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

