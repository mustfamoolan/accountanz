import { useState, useMemo, FormEventHandler } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageHeader, StatCard, StatGrid, MoneyDisplay } from '@/components/common';
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
    CreditCard,
    DollarSign,
    Layers,
    Sparkles,
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

    // Live Accounting Calculations
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

        const actualCash = parseFloat(formData.actual_cash) || 0;
        const bankBalance = parseFloat(formData.bank_balance) || 0;
        const prevNetWorth = parseFloat(formData.previous_net_worth) || 0;

        // 1. م/ الموجودات = كاش حقيقي + رصيد مصارف + نطلب
        const totalAssets = actualCash + bankBalance + totalReceivables;

        // 2. م/ مطلوبات = مطلوبين + كمرك
        const totalLiabilities = totalPayables + totalCustoms;

        // 3. الموجود الكلي = م/ الموجودات - م/ مطلوبات
        const netWorth = totalAssets - totalLiabilities;

        // 4. ربح آخر جرد = الموجود الكلي - موجود كلي سابق
        const inventoryProfit = netWorth - prevNetWorth;

        // 5. قسم خاص محمد:
        const mohOpening = parseFloat(formData.mohammed_opening_cash) || 0;
        const mohOutflow = parseFloat(formData.mohammed_outflow) || 0;
        const mohInflow = parseFloat(formData.mohammed_inflow) || 0;
        const mohExpenses = parseFloat(formData.mohammed_expenses) || 0;
        const mohAssets = parseFloat(formData.mohammed_assets) || 0;
        const mohCashPresent = parseFloat(formData.mohammed_cash_present) || 0;

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
    }, [rows, formData]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);

        const receivables = rows
            .filter((r) => r.receivable_amount || r.receivable_details)
            .map((r) => ({ amount: r.receivable_amount, details: r.receivable_details }));
        const payables = rows
            .filter((r) => r.payable_amount || r.payable_details)
            .map((r) => ({ amount: r.payable_amount, details: r.payable_details }));
        const customs = rows
            .filter((r) => r.custom_amount || r.custom_details)
            .map((r) => ({ amount: r.custom_amount, details: r.custom_details }));
        const expenses = rows
            .filter((r) => r.expense_amount || r.expense_details)
            .map((r) => ({ amount: r.expense_amount, details: r.expense_details }));

        router.post('/inventories', {
            ...formData,
            receivables,
            payables,
            customs,
            expenses,
        }, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AuthenticatedLayout header="إجراء جرد وميزانية جديدة" activeNav="inventories">
            <Head title="إجراء جرد وميزانية جديدة" />

            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title="كشف جرد وميزانية دورية جديدة"
                    description="تسجيل بنود الجرد واحتساب الموجود الكلي وصافي الأرباح ومطابقة حساب خاص محمد"
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

                {/* 2. Top Summary KPI Cards (Clean Unified StatGrid) */}
                <StatGrid columns={4}>
                    <StatCard
                        title="الموجود الكلي (الصافي)"
                        value={calculations.netWorth}
                        currency="د.ع"
                        color="primary"
                        icon={Scale}
                        description="م/ الموجودات - م/ المطلوبات"
                    />
                    <StatCard
                        title="ربح آخر جرد دوري"
                        value={calculations.inventoryProfit}
                        currency="د.ع"
                        color={calculations.inventoryProfit >= 0 ? 'emerald' : 'muted'}
                        icon={TrendingUp}
                        description="الفارق عن الموجود الكلي السابق"
                    />
                    <StatCard
                        title="مجموع الموجودات المحسوبة"
                        value={calculations.totalAssets}
                        currency="د.ع"
                        color="blue"
                        icon={Wallet}
                        description="كاش حقيقي + رصيد مصارف + نطلب"
                    />
                    <StatCard
                        title="مجموع المطلوبات والكمارك"
                        value={calculations.totalLiabilities}
                        currency="د.ع"
                        color="amber"
                        icon={CreditCard}
                        description="مطلوبين + التزامات الكمارك"
                    />
                </StatGrid>

                {/* 3. Basic Info Card */}
                <Card className="shadow-xs border-border">
                    <CardHeader className="pb-3 pt-4 px-4 sm:px-5 border-b border-border/60">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            <span>البيانات الأساسية لكشف الجرد</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-xs font-semibold">عنوان الكشف</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="h-9 text-xs"
                                    placeholder="جرد شهر تشرين الأول..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="inventory_date" className="text-xs font-semibold">
                                    تاريخ الجرد <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="inventory_date"
                                    type="date"
                                    value={formData.inventory_date}
                                    onChange={(e) => setData('inventory_date', e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs font-semibold">ملاحظات الكشف</Label>
                                <Input
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="h-9 text-xs"
                                    placeholder="أي ملاحظات تتعلق بظروف الجرد أو المطابقات"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Full Width Spreadsheet Table */}
                <Card className="shadow-xs border-border overflow-hidden">
                            <CardHeader className="p-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                                        <span>جدول بنود الجرد ومفردات الحسابات</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        أدخل المبالغ والتفاصيل؛ يتم تحديث المجاميع تلقائياً في شريط الخلاصة
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addRows(5)}
                                    className="h-8 text-xs gap-1.5"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>إضافة 5 صفوف</span>
                                </Button>
                            </CardHeader>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground">
                                            <th className="p-2.5 w-9 text-center">#</th>
                                            <th className="p-2.5 text-center min-w-[110px]">
                                                <span className="inline-flex items-center gap-1 text-foreground font-bold">
                                                    نطلب (د.ع)
                                                </span>
                                            </th>
                                            <th className="p-2.5 text-center min-w-[130px]">تفاصيل المدين</th>
                                            <th className="p-2.5 text-center min-w-[110px]">
                                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                                                    مطلوبين (د.ع)
                                                </span>
                                            </th>
                                            <th className="p-2.5 text-center min-w-[130px]">تفاصيل الدائن</th>
                                            <th className="p-2.5 text-center min-w-[110px]">
                                                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                                    كمرك (د.ع)
                                                </span>
                                            </th>
                                            <th className="p-2.5 text-center min-w-[130px]">تفاصيل الكمرك</th>
                                            <th className="p-2.5 text-center min-w-[110px]">
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                                    نثريات (د.ع)
                                                </span>
                                            </th>
                                            <th className="p-2.5 text-center min-w-[130px]">تفاصيل النثرية</th>
                                            <th className="p-2.5 w-9 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {rows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                <td className="p-2 text-center text-muted-foreground font-mono text-[11px] bg-muted/10">
                                                    {idx + 1}
                                                </td>

                                                {/* نطلب */}
                                                <td className="p-1.5">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.receivable_amount}
                                                        onChange={(e) => updateRow(idx, 'receivable_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-bold text-right"
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        type="text"
                                                        value={row.receivable_details}
                                                        onChange={(e) => updateRow(idx, 'receivable_details', e.target.value)}
                                                        placeholder="الزبون / الجهة"
                                                        className="h-8 text-xs"
                                                    />
                                                </td>

                                                {/* مطلوبين */}
                                                <td className="p-1.5">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.payable_amount}
                                                        onChange={(e) => updateRow(idx, 'payable_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-bold text-right text-amber-600 dark:text-amber-400"
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        type="text"
                                                        value={row.payable_details}
                                                        onChange={(e) => updateRow(idx, 'payable_details', e.target.value)}
                                                        placeholder="التاجر / المستحق"
                                                        className="h-8 text-xs"
                                                    />
                                                </td>

                                                {/* كمرك */}
                                                <td className="p-1.5">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.custom_amount}
                                                        onChange={(e) => updateRow(idx, 'custom_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-bold text-right text-blue-600 dark:text-blue-400"
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        type="text"
                                                        value={row.custom_details}
                                                        onChange={(e) => updateRow(idx, 'custom_details', e.target.value)}
                                                        placeholder="المعاملة / الميناء"
                                                        className="h-8 text-xs"
                                                    />
                                                </td>

                                                {/* نثريات */}
                                                <td className="p-1.5">
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        value={row.expense_amount}
                                                        onChange={(e) => updateRow(idx, 'expense_amount', e.target.value)}
                                                        placeholder="0"
                                                        dir="ltr"
                                                        className="h-8 text-xs font-mono font-bold text-right text-emerald-600 dark:text-emerald-400"
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        type="text"
                                                        value={row.expense_details}
                                                        onChange={(e) => updateRow(idx, 'expense_details', e.target.value)}
                                                        placeholder="بيان الصرف"
                                                        className="h-8 text-xs"
                                                    />
                                                </td>

                                                <td className="p-1.5 text-center">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => removeRow(idx)}
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        title="حذف الصف"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted/50 font-bold text-xs border-t-2 border-border">
                                            <td className="p-3 text-center">المجموع</td>
                                            <td className="p-3 text-right font-mono" dir="ltr">
                                                {calculations.totalReceivables.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400" dir="ltr">
                                                {calculations.totalPayables.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400" dir="ltr">
                                                {calculations.totalCustoms.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400" dir="ltr">
                                                {calculations.totalExpenses.toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>

                {/* 5. Summary and Special Account Cards Below the Table */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                    {/* Card 1: خلاصة الميزانية العمومية */}
                    <Card className="shadow-xs border-border">
                            <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/20">
                                <CardTitle className="text-sm font-bold flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Scale className="h-4 w-4 text-primary" />
                                        <span>خلاصة الميزانية العمومية</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        مطابقة المعادلات
                                    </Badge>
                                </CardTitle>
                            </CardHeader>

                            <div className="p-4 space-y-3 text-xs">
                                {/* بنود المجاميع */}
                                <div className="space-y-2 pb-3 border-b border-border/60">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">نطلب (المدينون):</span>
                                        <MoneyDisplay amount={calculations.totalReceivables} currency="د.ع" size="sm" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">مطلوبين (الدائنون):</span>
                                        <MoneyDisplay amount={calculations.totalPayables} currency="د.ع" size="sm" variant="negative" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">كمرك مستحق:</span>
                                        <MoneyDisplay amount={calculations.totalCustoms} currency="د.ع" size="sm" variant="blue" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">نثريات تشغيلية:</span>
                                        <MoneyDisplay amount={calculations.totalExpenses} currency="د.ع" size="sm" variant="emerald" />
                                    </div>
                                </div>

                                {/* كاش حقيقي ورصيد مصارف */}
                                <div className="space-y-2.5 pb-3 border-b border-border/60">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="font-semibold text-foreground">كاش حقيقي (الصناديق):</span>
                                            <span className="text-muted-foreground font-mono">الخزينة النقدية</span>
                                        </div>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.actual_cash}
                                            onChange={(e) => setData('actual_cash', e.target.value)}
                                            className="h-8 font-mono font-bold text-xs"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="font-semibold text-foreground">رصيد المصارف:</span>
                                            <span className="text-muted-foreground font-mono">الحسابات البنكية</span>
                                        </div>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.bank_balance}
                                            onChange={(e) => setData('bank_balance', e.target.value)}
                                            className="h-8 font-mono font-bold text-xs"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* المعادلات الكبرى */}
                                <div className="space-y-2 pb-3 border-b border-border/60">
                                    <div className="flex justify-between items-center font-semibold">
                                        <span>م/ الموجودات (كاش+مصارف+نطلب):</span>
                                        <MoneyDisplay amount={calculations.totalAssets} currency="د.ع" size="md" />
                                    </div>
                                    <div className="flex justify-between items-center font-semibold text-rose-600 dark:text-rose-400">
                                        <span>م/ المطلوبات (مطلوبين+كمرك):</span>
                                        <MoneyDisplay amount={calculations.totalLiabilities} currency="د.ع" size="md" variant="negative" />
                                    </div>
                                </div>

                                {/* موجود كلي سابق */}
                                <div className="space-y-1">
                                    <span className="text-[11px] text-muted-foreground block">موجود كلي سابق (الجرد الأخير):</span>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={formData.previous_net_worth}
                                        onChange={(e) => setData('previous_net_worth', e.target.value)}
                                        className="h-8 font-mono text-xs"
                                        dir="ltr"
                                    />
                                </div>

                                {/* بطاقات النتائج الصافية الختامية */}
                                <div className="pt-2 space-y-2">
                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-primary block">
                                                الموجود الكلي (الصافي)
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">صافي ميزانية رأس المال</span>
                                        </div>
                                        <span className="font-mono text-base font-bold text-primary" dir="ltr">
                                            {calculations.netWorth.toLocaleString()} د.ع
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                                                ربح آخر جرد دوري
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">الفارق المالي المكتسب</span>
                                        </div>
                                        <span
                                            className={`font-mono text-base font-bold ${
                                                calculations.inventoryProfit >= 0
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-rose-600 dark:text-rose-400'
                                            }`}
                                            dir="ltr"
                                        >
                                            {calculations.inventoryProfit >= 0 ? '+' : ''}
                                            {calculations.inventoryProfit.toLocaleString()} د.ع
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Card 2: حساب خاص محمد */}
                        <Card className="shadow-xs border-border">
                            <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/20">
                                <CardTitle className="text-sm font-bold flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" />
                                        <span>حساب خاص محمد (العهدة والاستثمار)</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                        مستثمر دائم
                                    </Badge>
                                </CardTitle>
                            </CardHeader>

                            <div className="p-4 space-y-2.5 text-xs">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-muted-foreground">
                                        كاش محمد آخر جرد (الافتتاحي):
                                    </Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={formData.mohammed_opening_cash}
                                        onChange={(e) => setData('mohammed_opening_cash', e.target.value)}
                                        className="h-8 font-mono text-xs"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-muted-foreground">
                                            م/ صادر (مصروفات):
                                        </Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.mohammed_outflow}
                                            onChange={(e) => setData('mohammed_outflow', e.target.value)}
                                            className="h-8 font-mono text-xs"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-muted-foreground">
                                            م/ وارد (مقبوضات):
                                        </Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.mohammed_inflow}
                                            onChange={(e) => setData('mohammed_inflow', e.target.value)}
                                            className="h-8 font-mono text-xs"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-muted-foreground">
                                            نثريات محمد:
                                        </Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.mohammed_expenses}
                                            onChange={(e) => setData('mohammed_expenses', e.target.value)}
                                            className="h-8 font-mono text-xs"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-muted-foreground">
                                            الموجودات التابعة:
                                        </Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={formData.mohammed_assets}
                                            onChange={(e) => setData('mohammed_assets', e.target.value)}
                                            className="h-8 font-mono text-xs"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1 pt-1 border-t border-border/60">
                                    <Label className="text-[11px] font-semibold text-foreground">
                                        الكاش الموجود فعلياً (بحوزة محمد):
                                    </Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={formData.mohammed_cash_present}
                                        onChange={(e) => setData('mohammed_cash_present', e.target.value)}
                                        className="h-8 font-mono font-bold text-xs"
                                        dir="ltr"
                                    />
                                </div>

                                {/* ملخص الحساب والتطابق */}
                                <div className="pt-2 space-y-2">
                                    <div className="flex justify-between items-center text-xs p-2 rounded-md bg-muted/40 border border-border/60">
                                        <span className="text-muted-foreground">الكاش المحسوب:</span>
                                        <span className="font-mono font-semibold" dir="ltr">
                                            {calculations.mohCalculatedCash.toLocaleString()} د.ع
                                        </span>
                                    </div>

                                    {/* شارة التطابق الذكية */}
                                    <div
                                        className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                                            calculations.mohDifference === 0
                                                ? 'bg-muted/40 border-border text-foreground'
                                                : calculations.mohDifference > 0
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-destructive/10 border-destructive/20 text-destructive'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {calculations.mohDifference === 0 ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    <span>العهدة مطابقة تماماً</span>
                                                </>
                                            ) : calculations.mohDifference > 0 ? (
                                                <>
                                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                    <span>زيادة نقدية بالعهدة</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                    <span>عجز نقدي بالعهدة</span>
                                                </>
                                            )}
                                        </span>
                                        <span className="font-mono text-xs" dir="ltr">
                                            {calculations.mohDifference > 0 ? '+' : ''}
                                            {calculations.mohDifference.toLocaleString()} د.ع
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </form>
            </AuthenticatedLayout>
    );
}
