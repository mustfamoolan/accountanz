import { useState, useMemo, FormEventHandler } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageHeader, MoneyDisplay } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    FileSpreadsheet,
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Calculator,
    User,
    Wallet,
    Landmark,
    TrendingUp,
    Scale,
    AlertCircle,
    CheckCircle2,
    Info,
} from 'lucide-react';

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

interface Investor {
    id: number;
    name: string;
    code: string;
    capital_balance: number | string;
    profit_balance: number | string;
}

interface Props {
    systemActualCash: number;
    systemBankBalance: number;
    previousNetWorth: number;
    mohammedOpeningCash: number;
    mohammedInvestor?: Investor | null;
    funds: Fund[];
    banks: Bank[];
}

interface DynamicRow {
    receivable_amount: string;
    receivable_details: string;
    payable_amount: string;
    payable_details: string;
    custom_amount: string;
    custom_details: string;
    expense_amount: string;
    expense_details: string;
}

export default function InventoryCreate({
    systemActualCash,
    systemBankBalance,
    previousNetWorth,
    mohammedOpeningCash,
    mohammedInvestor,
    funds,
    banks,
}: Props) {
    // Generate 10 empty initial rows
    const createEmptyRow = (): DynamicRow => ({
        receivable_amount: '',
        receivable_details: '',
        payable_amount: '',
        payable_details: '',
        custom_amount: '',
        custom_details: '',
        expense_amount: '',
        expense_details: '',
    });

    const [rows, setRows] = useState<DynamicRow[]>(() =>
        Array.from({ length: 10 }, () => createEmptyRow())
    );

    const [formData, setFormData] = useState({
        title: `جرد وميزانية بتاريخ ${new Date().toISOString().split('T')[0]}`,
        inventory_date: new Date().toISOString().split('T')[0],
        actual_cash: String(systemActualCash || 0),
        bank_balance: String(systemBankBalance || 0),
        previous_net_worth: String(previousNetWorth || 0),
        mohammed_opening_cash: String(mohammedOpeningCash || 0),
        mohammed_outflow: '0',
        mohammed_inflow: '0',
        mohammed_expenses: '0',
        mohammed_assets: '0',
        mohammed_cash_present: '0',
        notes: '',
    });

    const [processing, setProcessing] = useState(false);

    const setData = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Row management
    const addRows = (count: number = 5) => {
        setRows((prev) => [...prev, ...Array.from({ length: count }, () => createEmptyRow())]);
    };

    const removeRow = (index: number) => {
        setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
    };

    const updateRow = (index: number, field: keyof DynamicRow, value: string) => {
        setRows((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Live Accounting Calculations (100% matching Lahomes excel formulas)
    const calculations = useMemo(() => {
        let totalReceivables = 0;
        let totalPayables = 0;
        let totalCustoms = 0;
        let totalExpenses = 0;

        rows.forEach((r) => {
            totalReceivables += parseFloat(r.receivable_amount) || 0;
            totalPayables += parseFloat(r.payable_amount) || 0;
            totalCustoms += parseFloat(r.custom_amount) || 0;
            totalExpenses += parseFloat(r.expense_amount) || 0;
        });

        const actualCash = parseFloat(data.actual_cash) || 0;
        const bankBalance = parseFloat(data.bank_balance) || 0;
        const prevNetWorth = parseFloat(data.previous_net_worth) || 0;

        // 1. م/ الموجودات = كاش حقيقي + رصيد مصارف + نطلب
        const totalAssets = actualCash + bankBalance + totalReceivables;

        // 2. م/ مطلوبات = مطلوبين + كمرك
        const totalLiabilities = totalPayables + totalCustoms;

        // 3. الموجود الكلي = م/ الموجودات - م/ مطلوبات
        const netWorth = totalAssets - totalLiabilities;

        // 4. ربح آخر جرد = الموجود الكلي - موجود كلي سابق
        const inventoryProfit = netWorth - prevNetWorth;

        // 5. قسم خاص محمد:
        const mohOpening = parseFloat(data.mohammed_opening_cash) || 0;
        const mohOutflow = parseFloat(data.mohammed_outflow) || 0;
        const mohInflow = parseFloat(data.mohammed_inflow) || 0;
        const mohExpenses = parseFloat(data.mohammed_expenses) || 0;
        const mohAssets = parseFloat(data.mohammed_assets) || 0;
        const mohCashPresent = parseFloat(data.mohammed_cash_present) || 0;

        // كاش محسوب = افتتاح + وارد - صادر - نثريات
        const mohCalculatedCash = (mohOpening + mohInflow) - (mohOutflow + mohExpenses);
        const mohDifference = mohCashPresent - mohCalculatedCash;

        return {
            totalReceivables,
            totalPayables,
            totalCustoms,
            totalExpenses,
            actualCash,
            bankBalance,
            totalAssets,
            totalLiabilities,
            netWorth,
            inventoryProfit,
            mohOpening,
            mohOutflow,
            mohInflow,
            mohExpenses,
            mohAssets,
            mohCashPresent,
            mohCalculatedCash,
            mohDifference,
        };
    }, [rows, data]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        // Transform dynamic rows to controller format
        const receivables = rows.map((r) => ({ amount: r.receivable_amount, details: r.receivable_details }));
        const payables = rows.map((r) => ({ amount: r.payable_amount, details: r.payable_details }));
        const customs = rows.map((r) => ({ amount: r.custom_amount, details: r.custom_details }));
        const expenses = rows.map((r) => ({ amount: r.expense_amount, details: r.expense_details }));

        post('/inventories', {
            // @ts-ignore
            data: {
                ...data,
                receivables,
                payables,
                customs,
                expenses,
            },
        });
    };

    return (
        <AuthenticatedLayout header="إجراء جرد وميزانية جديدة" activeNav="inventories">
            <Head title="إجراء جرد وميزانية جديدة" />

            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title="إجراء كشف جرد وميزانية دورية جديدة"
                    description="إدخال بنود الجرد وحساب الموجود الكلي والخصوم والأرباح، وتدقيق حساب خاص محمد آلياً"
                    icon={FileSpreadsheet}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href="/inventories">
                                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>إلغاء</span>
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                size="sm"
                                className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 font-bold"
                            >
                                <Save className="h-4 w-4" />
                                <span>{processing ? 'جاري الحفظ...' : 'حفظ وتأكيد كشف الجرد'}</span>
                            </Button>
                        </div>
                    }
                />

                {/* 2. Basic Info Bar */}
                <Card className="shadow-xs border-border">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="title" className="text-xs font-semibold">عنوان كشف الجرد</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="h-9 text-xs"
                                    placeholder="جرد شهر تشرين الأول..."
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="inventory_date" className="text-xs font-semibold">
                                    تاريخ الجرد <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="inventory_date"
                                    type="date"
                                    value={data.inventory_date}
                                    onChange={(e) => setData('inventory_date', e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="notes" className="text-xs font-semibold">ملاحظات الكشف</Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="h-9 text-xs"
                                    placeholder="أي ملاحظات تتعلق بظروف الجرد أو المطابقات"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Main Workspace: Table (Left/Top) + Side Panel (Right/Bottom) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    {/* Left: Excel-like Spreadsheet (7 or 8 columns on desktop) */}
                    <div className="xl:col-span-8 space-y-4">
                        <Card className="shadow-xs border-border overflow-hidden">
                            <CardHeader className="p-3.5 sm:p-4 bg-muted/40 border-b border-border flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                                    <div>
                                        <CardTitle className="text-sm font-bold">
                                            جدول بنود الجرد التفصيلية (نظام الإكسل)
                                        </CardTitle>
                                        <CardDescription className="text-[11px]">
                                            أدخل المبالغ والتفاصيل؛ يتم احتساب المجاميع آلياً في اللوحة الجانبية
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addRows(5)}
                                        className="h-7 text-xs gap-1 bg-background"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <span>إضافة 5 صفوف</span>
                                    </Button>
                                </div>
                            </CardHeader>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border text-[11px] font-bold">
                                            <th className="p-2 w-8 text-center bg-muted/60">#</th>
                                            <th className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-center min-w-[100px]">
                                                نطلب (د.ع)
                                            </th>
                                            <th className="p-2 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-center min-w-[130px]">
                                                تفاصيل المدين
                                            </th>
                                            <th className="p-2 bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-center min-w-[100px]">
                                                مطلوبين (د.ع)
                                            </th>
                                            <th className="p-2 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-center min-w-[130px]">
                                                تفاصيل الدائن
                                            </th>
                                            <th className="p-2 bg-blue-100/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-center min-w-[100px]">
                                                كمرك (د.ع)
                                            </th>
                                            <th className="p-2 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-center min-w-[130px]">
                                                تفاصيل الكمرك
                                            </th>
                                            <th className="p-2 bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 text-center min-w-[100px]">
                                                نثريات (د.ع)
                                            </th>
                                            <th className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-center min-w-[130px]">
                                                تفاصيل النثرية
                                            </th>
                                            <th className="p-2 w-8 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {rows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-1.5 text-center text-muted-foreground font-mono text-[11px] bg-muted/20">
                                                    {idx + 1}
                                                </td>

                                                {/* نطلب */}
                                                <td className="p-1 bg-slate-50/40 dark:bg-slate-900/20">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.receivable_amount}
                                                        onChange={(e) => updateRow(idx, 'receivable_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-semibold text-right border-border/70"
                                                    />
                                                </td>
                                                <td className="p-1">
                                                    <Input
                                                        type="text"
                                                        value={row.receivable_details}
                                                        onChange={(e) => updateRow(idx, 'receivable_details', e.target.value)}
                                                        placeholder="اسم العميل أو الجهة"
                                                        className="h-8 text-xs border-border/70"
                                                    />
                                                </td>

                                                {/* مطلوبين */}
                                                <td className="p-1 bg-amber-50/30 dark:bg-amber-950/10">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.payable_amount}
                                                        onChange={(e) => updateRow(idx, 'payable_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-semibold text-right border-border/70"
                                                    />
                                                </td>
                                                <td className="p-1">
                                                    <Input
                                                        type="text"
                                                        value={row.payable_details}
                                                        onChange={(e) => updateRow(idx, 'payable_details', e.target.value)}
                                                        placeholder="اسم التاجر أو المستحق"
                                                        className="h-8 text-xs border-border/70"
                                                    />
                                                </td>

                                                {/* كمرك */}
                                                <td className="p-1 bg-blue-50/30 dark:bg-blue-950/10">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.custom_amount}
                                                        onChange={(e) => updateRow(idx, 'custom_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-semibold text-right border-border/70"
                                                    />
                                                </td>
                                                <td className="p-1">
                                                    <Input
                                                        type="text"
                                                        value={row.custom_details}
                                                        onChange={(e) => updateRow(idx, 'custom_details', e.target.value)}
                                                        placeholder="رقم المعاملة أو الميناء"
                                                        className="h-8 text-xs border-border/70"
                                                    />
                                                </td>

                                                {/* نثريات */}
                                                <td className="p-1 bg-emerald-50/30 dark:bg-emerald-950/10">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.expense_amount}
                                                        onChange={(e) => updateRow(idx, 'expense_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-semibold text-right border-border/70"
                                                    />
                                                </td>
                                                <td className="p-1">
                                                    <Input
                                                        type="text"
                                                        value={row.expense_details}
                                                        onChange={(e) => updateRow(idx, 'expense_details', e.target.value)}
                                                        placeholder="بيان الصرف أو النثرية"
                                                        className="h-8 text-xs border-border/70"
                                                    />
                                                </td>

                                                <td className="p-1 text-center">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => removeRow(idx)}
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        title="حذف الصف"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-bold text-xs border-t-2 border-border">
                                            <td className="p-2 text-center">المجموع</td>
                                            <td className="p-2 text-right font-mono" dir="ltr">
                                                {calculations.totalReceivables.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-2 text-right font-mono text-amber-700 dark:text-amber-400" dir="ltr">
                                                {calculations.totalPayables.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-2 text-right font-mono text-blue-700 dark:text-blue-400" dir="ltr">
                                                {calculations.totalCustoms.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-2 text-right font-mono text-emerald-700 dark:text-emerald-400" dir="ltr">
                                                {calculations.totalExpenses.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Accounting Summary Panel (طبق لوحة الإكسل في Lahomes) */}
                    <div className="xl:col-span-4 space-y-4 sticky top-6">
                        {/* 1. لوحة المجاميع والميزانية العمومية */}
                        <Card className="shadow-xs border-2 border-slate-900 dark:border-slate-700 overflow-hidden">
                            <div className="bg-red-600 text-white font-bold text-center py-2 text-sm tracking-wide">
                                لوحة المجاميع والميزانية العمومية
                            </div>

                            <div className="divide-y divide-border text-xs">
                                {/* نطلب */}
                                <div className="flex justify-between items-center p-2.5 bg-slate-100 dark:bg-slate-900">
                                    <span className="font-mono font-bold" dir="ltr">
                                        {calculations.totalReceivables.toLocaleString()} د.ع
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">نطلب (المدينون)</span>
                                </div>

                                {/* مطلوبين */}
                                <div className="flex justify-between items-center p-2.5 bg-amber-50 dark:bg-amber-950/30">
                                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400" dir="ltr">
                                        {calculations.totalPayables.toLocaleString()} د.ع
                                    </span>
                                    <span className="font-bold text-amber-900 dark:text-amber-300">مطلوبين (الدائنون)</span>
                                </div>

                                {/* كمرك */}
                                <div className="flex justify-between items-center p-2.5 bg-blue-50 dark:bg-blue-950/30">
                                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400" dir="ltr">
                                        {calculations.totalCustoms.toLocaleString()} د.ع
                                    </span>
                                    <span className="font-bold text-blue-900 dark:text-blue-300">كمرك</span>
                                </div>

                                {/* نثريات */}
                                <div className="flex justify-between items-center p-2.5 bg-emerald-50 dark:bg-emerald-950/30">
                                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400" dir="ltr">
                                        {calculations.totalExpenses.toLocaleString()} د.ع
                                    </span>
                                    <span className="font-bold text-emerald-900 dark:text-emerald-300">نثريات تشغيلية</span>
                                </div>

                                {/* الفاصل الأسود */}
                                <div className="h-2 bg-slate-900 dark:bg-slate-800" />

                                {/* كاش حقيقي (الصناديق) */}
                                <div className="flex items-center justify-between p-2.5 bg-cyan-50 dark:bg-cyan-950/30 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.actual_cash}
                                            onChange={(e) => setData('actual_cash', e.target.value)}
                                            className="h-8 font-mono font-bold text-right text-xs bg-white dark:bg-background border-cyan-400"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-bold text-cyan-950 dark:text-cyan-200 text-xs shrink-0 w-28 text-left">
                                        كاش حقيقي (صناديق)
                                    </span>
                                </div>

                                {/* رصيد مصارف */}
                                <div className="flex items-center justify-between p-2.5 bg-cyan-50 dark:bg-cyan-950/30 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.bank_balance}
                                            onChange={(e) => setData('bank_balance', e.target.value)}
                                            className="h-8 font-mono font-bold text-right text-xs bg-white dark:bg-background border-cyan-400"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-bold text-cyan-950 dark:text-cyan-200 text-xs shrink-0 w-28 text-left">
                                        رصيد المصارف
                                    </span>
                                </div>

                                {/* م/ الموجودات */}
                                <div className="flex justify-between items-center p-2.5 font-bold bg-muted/60">
                                    <span className="font-mono text-sm text-foreground" dir="ltr">
                                        {calculations.totalAssets.toLocaleString()} د.ع
                                    </span>
                                    <span>م/ الموجودات (كاش + بنك + نطلب)</span>
                                </div>

                                {/* م/ مطلوبات */}
                                <div className="flex justify-between items-center p-2.5 font-bold text-rose-600 dark:text-rose-400">
                                    <span className="font-mono text-sm" dir="ltr">
                                        {calculations.totalLiabilities.toLocaleString()} د.ع
                                    </span>
                                    <span>م/ مطلوبات (مطلوبين + كمرك)</span>
                                </div>

                                {/* الموجود الكلي (الميزانية الصافية) */}
                                <div className="flex justify-between items-center p-3 bg-slate-900 text-white font-bold">
                                    <span className="font-mono text-base" dir="ltr">
                                        {calculations.netWorth.toLocaleString()} د.ع
                                    </span>
                                    <span className="text-sm">الموجود الكلي (الصافي)</span>
                                </div>

                                {/* موجود كلي سابق */}
                                <div className="flex items-center justify-between p-2.5 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.previous_net_worth}
                                            onChange={(e) => setData('previous_net_worth', e.target.value)}
                                            className="h-8 font-mono text-right text-xs"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="text-muted-foreground text-xs shrink-0 w-28 text-left">
                                        موجود كلي سابق
                                    </span>
                                </div>

                                {/* ربح آخر جرد */}
                                <div className="flex justify-between items-center p-3 bg-emerald-500/10 font-bold border-t">
                                    <span
                                        className={`font-mono text-base ${
                                            calculations.inventoryProfit >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                        }`}
                                        dir="ltr"
                                    >
                                        {calculations.inventoryProfit >= 0 ? '+' : ''}
                                        {calculations.inventoryProfit.toLocaleString()} د.ع
                                    </span>
                                    <span className="text-emerald-800 dark:text-emerald-300 text-xs">
                                        ربح آخر جرد دوري
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* 2. قسم "خاص محمد" */}
                        <Card className="shadow-xs border-2 border-red-600 overflow-hidden">
                            <div className="bg-red-600 text-white font-bold text-center py-2 text-sm flex items-center justify-center gap-1.5">
                                <User className="h-4 w-4" />
                                <span>قسم خاص محمد (العهدة والاستثمار)</span>
                            </div>

                            <div className="divide-y divide-border text-xs">
                                {/* كاش محمد آخر جرد */}
                                <div className="flex items-center justify-between p-2.5 bg-orange-50/50 dark:bg-orange-950/20 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.mohammed_opening_cash}
                                            onChange={(e) => setData('mohammed_opening_cash', e.target.value)}
                                            className="h-8 font-mono text-right text-xs bg-white dark:bg-background border-orange-300"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-semibold text-xs shrink-0 w-32 text-left">
                                        كاش محمد آخر جرد
                                    </span>
                                </div>

                                {/* م/ صادر */}
                                <div className="flex items-center justify-between p-2.5 bg-orange-50/50 dark:bg-orange-950/20 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.mohammed_outflow}
                                            onChange={(e) => setData('mohammed_outflow', e.target.value)}
                                            className="h-8 font-mono text-right text-xs bg-white dark:bg-background border-orange-300"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-semibold text-xs shrink-0 w-32 text-left">
                                        م/ صادر (مصروفات)
                                    </span>
                                </div>

                                {/* م/ وارد */}
                                <div className="flex items-center justify-between p-2.5 bg-orange-50/50 dark:bg-orange-950/20 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.mohammed_inflow}
                                            onChange={(e) => setData('mohammed_inflow', e.target.value)}
                                            className="h-8 font-mono text-right text-xs bg-white dark:bg-background border-orange-300"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-semibold text-xs shrink-0 w-32 text-left">
                                        م/ وارد (مقبوضات)
                                    </span>
                                </div>

                                {/* نثريات */}
                                <div className="flex items-center justify-between p-2.5 bg-orange-50/50 dark:bg-orange-950/20 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.mohammed_expenses}
                                            onChange={(e) => setData('mohammed_expenses', e.target.value)}
                                            className="h-8 font-mono text-right text-xs bg-white dark:bg-background border-orange-300"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-semibold text-xs shrink-0 w-32 text-left">
                                        نثريات محمد
                                    </span>
                                </div>

                                {/* الموجودات */}
                                <div className="flex items-center justify-between p-2.5 bg-orange-50/50 dark:bg-orange-950/20 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.mohammed_assets}
                                            onChange={(e) => setData('mohammed_assets', e.target.value)}
                                            className="h-8 font-mono text-right text-xs bg-white dark:bg-background border-orange-300"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-semibold text-xs shrink-0 w-32 text-left">
                                        الموجودات التابعة
                                    </span>
                                </div>

                                {/* الكاش المحسوب (معادلة) */}
                                <div className="flex justify-between items-center p-2.5 bg-muted/60 font-semibold">
                                    <span className="font-mono text-xs text-foreground" dir="ltr">
                                        {calculations.mohCalculatedCash.toLocaleString()} د.ع
                                    </span>
                                    <span className="text-muted-foreground">الكاش المحسوب (افتتاح+وارد-صادر-نثرية)</span>
                                </div>

                                {/* الكاش الموجود فعلياً */}
                                <div className="flex items-center justify-between p-2.5 bg-emerald-100/70 dark:bg-emerald-950/40 gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            step="any"
                                            value={data.mohammed_cash_present}
                                            onChange={(e) => setData('mohammed_cash_present', e.target.value)}
                                            className="h-8 font-mono font-bold text-right text-xs bg-white dark:bg-background border-emerald-500"
                                            dir="ltr"
                                        />
                                    </div>
                                    <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs shrink-0 w-32 text-left">
                                        الكاش الموجود (الفعلي)
                                    </span>
                                </div>

                                {/* فارق الكاش (مطابقة / عجز / زيادة) */}
                                <div
                                    className={`flex justify-between items-center p-2.5 font-bold ${
                                        calculations.mohDifference === 0
                                            ? 'bg-muted/40 text-muted-foreground'
                                            : calculations.mohDifference > 0
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                                >
                                    <span className="font-mono text-xs" dir="ltr">
                                        {calculations.mohDifference > 0 ? '+' : ''}
                                        {calculations.mohDifference.toLocaleString()} د.ع
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        {calculations.mohDifference === 0 ? (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>الكاش مطابق تماماً</span>
                                            </>
                                        ) : calculations.mohDifference > 0 ? (
                                            <>
                                                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>زيادة نقدية في العهدة</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                                                <span>عجز نقدي في العهدة</span>
                                            </>
                                        )}
                                    </span>
                                </div>

                                {/* الموجود الكلي حالياً */}
                                <div className="flex justify-between items-center p-2.5 bg-slate-900 text-white font-bold">
                                    <span className="font-mono text-xs" dir="ltr">
                                        {calculations.netWorth.toLocaleString()} د.ع
                                    </span>
                                    <span>الموجود الكلي حالياً (مطابق للميزانية)</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
