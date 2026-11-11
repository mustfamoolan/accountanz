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
    Wallet,
    Landmark,
    TrendingUp,
    Scale,
    CreditCard,
    DollarSign,
    Layers,
    Coins,
    Info,
    History,
} from 'lucide-react';

interface Props {
    previousAvailableBalance?: number;
    previousProfit?: number;
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

export default function InventoryCreate({ previousAvailableBalance, previousProfit }: Props) {
    const initialPrevBalance = previousAvailableBalance ?? previousProfit ?? 0;

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
        title: `جرد بتاريخ ${new Date().toISOString().split('T')[0]}`,
        inventory_date: new Date().toISOString().split('T')[0],
        actual_cash: '',
        bank_balance: '',
        previous_available_balance: String(initialPrevBalance),
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
        const prevAvailableBalance = parseFloat(formData.previous_available_balance) || 0;

        // 1. الرصيد المتوفر = رصيد الصندوق (كاش) + رصيد المصارف + مجموع نطلب
        const availableBalance = actualCash + bankBalance + totalReceivables;

        // 2. مجموع الالتزامات = مطلوبين + كمرك
        const totalLiabilities = totalPayables + totalCustoms;

        // 3. الموجود الكلي = الرصيد المتوفر - مجموع الالتزامات
        const currentProfit = availableBalance - totalLiabilities;

        // 4. ربح الجرد الجديد = الموجود الكلي - الرصيد المتوفر السابق
        const newProfit = currentProfit - prevAvailableBalance;

        return {
            totalReceivables,
            totalPayables,
            totalCustoms,
            totalExpenses,
            actualCash,
            bankBalance,
            prevAvailableBalance,
            availableBalance,
            totalLiabilities,
            currentProfit,
            newProfit,
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

        router.post(
            '/inventories',
            {
                ...formData,
                receivables,
                payables,
                customs,
                expenses,
            },
            {
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <AuthenticatedLayout header="إنشاء كشف جرد جديد" activeNav="inventories">
            <Head title="إنشاء كشف جرد جديد" />

            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title="كشف جرد دوري جديد"
                    description="تسجيل بنود الجرد واحتساب الرصيد المتوفر والربح ومطابقة ربح آخر جرد دورياً."
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

                {/* 2. Top Summary KPI Cards */}
                <StatGrid columns={5}>
                    <StatCard
                        title="الرصيد المتوفر"
                        value={calculations.availableBalance}
                        currency="د.ع"
                        color="blue"
                        icon={Wallet}
                        description="صندوق + مصارف + نطلب"
                    />
                    <StatCard
                        title="مجموع الالتزامات"
                        value={calculations.totalLiabilities}
                        currency="د.ع"
                        color="amber"
                        icon={CreditCard}
                        description="مطلوبين + كمرك"
                    />
                    <StatCard
                        title="الموجود الكلي"
                        value={calculations.currentProfit}
                        currency="د.ع"
                        color="primary"
                        icon={Scale}
                        description="الرصيد المتوفر - الالتزامات"
                    />
                    <StatCard
                        title="الرصيد المتوفر سابقاً"
                        value={calculations.prevAvailableBalance}
                        currency="د.ع"
                        color="muted"
                        icon={History}
                        description="الرصيد المتوفر المسجل بالجرد السابق"
                    />
                    <StatCard
                        title="ربح الجرد الجديد"
                        value={calculations.newProfit}
                        currency="د.ع"
                        color={calculations.newProfit >= 0 ? 'emerald' : 'muted'}
                        icon={TrendingUp}
                        description="الموجود الكلي - الرصيد المتوفر السابق"
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
                                    placeholder="أي ملاحظات أو تفاصيل حول هذا الجرد"
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
                                        <div className="inline-flex flex-col items-center">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                نثريات (د.ع)
                                            </span>
                                            <span className="text-[9px] text-muted-foreground font-normal">
                                                (توثيق فقط)
                                            </span>
                                        </div>
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

                {/* 5. Summary Section & Formulas (Placed Directly Below Table for Maximum Clarity) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Right Card: المدخلات اليدوية للأرصدة */}
                    <Card className="shadow-xs border-border">
                        <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/20">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-primary" />
                                <span>أرصدة الصندوق والمصارف (إدخال يدوي)</span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                لا يتم جلب الأرصدة تلقائياً بل تُسجل يدوياً عند كل جرد
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-4 space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="actual_cash" className="font-semibold text-foreground">
                                        رصيد الصندوق (الكاش الحقيقي):
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">دينار عراقي</span>
                                </div>
                                <Input
                                    id="actual_cash"
                                    type="number"
                                    step="any"
                                    placeholder="أدخل مبلغ الكاش في الصندوق..."
                                    value={formData.actual_cash}
                                    onChange={(e) => setData('actual_cash', e.target.value)}
                                    className="h-10 font-mono font-bold text-sm"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="bank_balance" className="font-semibold text-foreground">
                                        رصيد المصارف:
                                    </Label>
                                    <span className="text-[11px] text-muted-foreground">دينار عراقي</span>
                                </div>
                                <Input
                                    id="bank_balance"
                                    type="number"
                                    step="any"
                                    placeholder="أدخل إجمالي أرصدة الحسابات المصرفية..."
                                    value={formData.bank_balance}
                                    onChange={(e) => setData('bank_balance', e.target.value)}
                                    className="h-10 font-mono font-bold text-sm"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-border/60">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="previous_available_balance" className="font-semibold text-muted-foreground">
                                        الرصيد المتوفر السابق:
                                    </Label>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        الرصيد المتوفر من آخر جرد
                                    </Badge>
                                </div>
                                <Input
                                    id="previous_available_balance"
                                    type="number"
                                    step="any"
                                    value={formData.previous_available_balance}
                                    onChange={(e) => setData('previous_available_balance', e.target.value)}
                                    className="h-9 font-mono text-xs bg-muted/30"
                                    dir="ltr"
                                />
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3 text-primary shrink-0" />
                                    <span>يتم خصم الرصيد المتوفر السابق من الموجود الكلي لاستخراج ربح الجرد الجديد.</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Left Card: خلاصة معادلة الجرد واحتساب الربح */}
                    <Card className="shadow-xs border-border">
                        <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/20">
                            <CardTitle className="text-sm font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    <span>خلاصة احتساب أرباح الجرد</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-bold text-primary">
                                    معادلة الجرد
                                </Badge>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4 space-y-3 text-xs">
                            {/* الخطوة 1: الرصيد المتوفر */}
                            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-900 dark:text-blue-300">
                                        1. الرصيد المتوفر:
                                    </span>
                                    <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300" dir="ltr">
                                        {calculations.availableBalance.toLocaleString()} د.ع
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground block">
                                    (رصيد الصندوق: {Number(calculations.actualCash).toLocaleString()} + المصارف: {Number(calculations.bankBalance).toLocaleString()} + نطلب: {calculations.totalReceivables.toLocaleString()})
                                </span>
                            </div>

                            {/* الخطوة 2: مجموع الالتزامات */}
                            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-amber-900 dark:text-amber-300">
                                        2. مجموع الالتزامات (المطلوبين والكمرك):
                                    </span>
                                    <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300" dir="ltr">
                                        {calculations.totalLiabilities.toLocaleString()} د.ع
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground block">
                                    (مطلوبين: {calculations.totalPayables.toLocaleString()} + كمرك: {calculations.totalCustoms.toLocaleString()})
                                </span>
                            </div>

                            {/* الخطوة 3: الموجود الكلي */}
                            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-foreground block">
                                        3. الموجود الكلي:
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">الرصيد المتوفر - مجموع الالتزامات</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-foreground" dir="ltr">
                                    {calculations.currentProfit.toLocaleString()} د.ع
                                </span>
                            </div>

                            {/* الخطوة 4: الربح الجديد النهائي */}
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                                        4. ربح الجرد الجديد (صافي الفترة):
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        الموجود الكلي ({calculations.currentProfit.toLocaleString()}) - الرصيد المتوفر السابق ({calculations.prevAvailableBalance.toLocaleString()})
                                    </span>
                                </div>
                                <div className="text-left font-mono">
                                    <span
                                        className={`text-lg font-black block ${
                                            calculations.newProfit >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                        }`}
                                        dir="ltr"
                                    >
                                        {calculations.newProfit >= 0 ? '+' : ''}
                                        {calculations.newProfit.toLocaleString()} د.ع
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">
                                        سيتم اعتماد الرصيد المتوفر لهذا الجرد كـ «رصيد متوفر سابق» للجرد القادم
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
