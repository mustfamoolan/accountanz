import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageHeader, StatCard, StatGrid, MoneyDisplay } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileSpreadsheet,
    ArrowLeft,
    Printer,
    Trash2,
    TrendingUp,
    Scale,
    Wallet,
    Calendar,
    CreditCard,
    Calculator,
    Info,
    Pencil,
    History,
} from 'lucide-react';

interface Item {
    amount: number | string;
    details: string;
}

interface PeriodicInventory {
    id: number;
    title: string;
    inventory_date: string;
    receivables_items?: Item[];
    payables_items?: Item[];
    customs_items?: Item[];
    expenses_items?: Item[];
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
    notes?: string;
    creator?: { name: string };
    created_at: string;
}

interface Props {
    inventory: PeriodicInventory;
}

export default function InventoryShow({ inventory }: Props) {
    const handleDelete = () => {
        if (confirm('هل أنت متأكد من حذف كشف الجرد هذا؟')) {
            router.delete(`/inventories/${inventory.id}`);
        }
    };

    const receivables = inventory.receivables_items || [];
    const payables = inventory.payables_items || [];
    const customs = inventory.customs_items || [];
    const expenses = inventory.expenses_items || [];

    const maxRows = Math.max(
        receivables.length,
        payables.length,
        customs.length,
        expenses.length,
        1
    );

    return (
        <AuthenticatedLayout header={`كشف: ${inventory.title}`} activeNav="inventories">
            <Head title={inventory.title || `جرد #${inventory.id}`} />

            <div className="space-y-6 print:hidden" dir="rtl">
                {/* 1. Page Header */}
                <PageHeader
                    title={inventory.title || `كشف جرد #${inventory.id}`}
                    description={`تاريخ الجرد: ${new Date(inventory.inventory_date).toLocaleDateString('ar-IQ')} | المسؤول: ${inventory.creator?.name || 'النظام'}`}
                    icon={FileSpreadsheet}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href="/inventories">
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>العودة للقائمة</span>
                                </Button>
                            </Link>
                            <Link href={`/inventories/${inventory.id}/edit`}>
                                <Button size="sm" className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 font-bold">
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>تعديل الكشف</span>
                                </Button>
                            </Link>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="gap-1.5 text-xs h-9 font-bold bg-muted/40 hover:bg-muted"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                <span>طباعة الكشف</span>
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                className="gap-1.5 text-xs h-9"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>حذف</span>
                            </Button>
                        </div>
                    }
                />

                {/* 2. Top Stats Grid */}
                <StatGrid columns={5}>
                    <StatCard
                        title="الرصيد المتوفر"
                        value={inventory.total_assets}
                        currency="د.ع"
                        color="blue"
                        icon={Wallet}
                        description="صندوق + مصارف + نطلب"
                    />
                    <StatCard
                        title="مجموع الالتزامات"
                        value={inventory.total_liabilities}
                        currency="د.ع"
                        color="amber"
                        icon={CreditCard}
                        description="مطلوبين + كمرك"
                    />
                    <StatCard
                        title="الموجود الكلي"
                        value={inventory.net_worth}
                        currency="د.ع"
                        color="primary"
                        icon={Scale}
                        description="الرصيد المتوفر - الالتزامات"
                    />
                    <StatCard
                        title="الموجود الكلي السابق"
                        value={inventory.previous_net_worth}
                        currency="د.ع"
                        color="muted"
                        icon={History}
                        description="الرصيد المعتمد من الجرد السابق"
                    />
                    <StatCard
                        title="الربح"
                        value={inventory.inventory_profit}
                        currency="د.ع"
                        color={Number(inventory.inventory_profit) >= 0 ? 'emerald' : 'muted'}
                        icon={TrendingUp}
                        description="الموجود الكلي - الموجود الكلي السابق"
                    />
                </StatGrid>

                {/* 3. Detailed Items Table */}
                <Card className="shadow-xs border-border overflow-hidden">
                    <CardHeader className="p-4 bg-muted/30 border-b border-border">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-primary" />
                            <span>جدول بنود ومفردات الجرد</span>
                        </CardTitle>
                        {inventory.notes && (
                            <CardDescription className="text-xs pt-1 text-muted-foreground">
                                ملاحظات: {inventory.notes}
                            </CardDescription>
                        )}
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold text-muted-foreground">
                                    <th className="p-2.5 w-9 text-center">#</th>
                                    <th className="p-2.5 text-center min-w-[100px]">
                                        <span className="font-bold text-foreground">نطلب (د.ع)</span>
                                    </th>
                                    <th className="p-2.5 text-center min-w-[130px]">تفاصيل المدين</th>
                                    <th className="p-2.5 text-center min-w-[100px]">
                                        <span className="font-bold text-amber-600 dark:text-amber-400">مطلوبين (د.ع)</span>
                                    </th>
                                    <th className="p-2.5 text-center min-w-[130px]">تفاصيل الدائن</th>
                                    <th className="p-2.5 text-center min-w-[100px]">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">كمرك (د.ع)</span>
                                    </th>
                                    <th className="p-2.5 text-center min-w-[130px]">تفاصيل الكمرك</th>
                                    <th className="p-2.5 text-center min-w-[100px]">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">نثريات (د.ع)</span>
                                            <span className="text-[9px] text-muted-foreground font-normal">(توثيق فقط)</span>
                                        </div>
                                    </th>
                                    <th className="p-2.5 text-center min-w-[130px]">تفاصيل النثرية</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {Array.from({ length: maxRows }).map((_, idx) => {
                                    const rec = receivables[idx];
                                    const pay = payables[idx];
                                    const cus = customs[idx];
                                    const exp = expenses[idx];

                                    return (
                                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-2.5 text-center text-muted-foreground font-mono text-[11px] bg-muted/10">
                                                {idx + 1}
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-bold" dir="ltr">
                                                {rec ? Number(rec.amount).toLocaleString() : '—'}
                                            </td>
                                            <td className="p-2.5 text-muted-foreground">{rec?.details || '—'}</td>

                                            <td className="p-2.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400" dir="ltr">
                                                {pay ? Number(pay.amount).toLocaleString() : '—'}
                                            </td>
                                            <td className="p-2.5 text-muted-foreground">{pay?.details || '—'}</td>

                                            <td className="p-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400" dir="ltr">
                                                {cus ? Number(cus.amount).toLocaleString() : '—'}
                                            </td>
                                            <td className="p-2.5 text-muted-foreground">{cus?.details || '—'}</td>

                                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                                                {exp ? Number(exp.amount).toLocaleString() : '—'}
                                            </td>
                                            <td className="p-2.5 text-muted-foreground">{exp?.details || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-muted/50 font-bold text-xs border-t-2 border-border">
                                    <td className="p-3 text-center">المجموع</td>
                                    <td className="p-3 text-right font-mono" dir="ltr">
                                        {Number(inventory.total_receivables).toLocaleString()} د.ع
                                    </td>
                                    <td></td>
                                    <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400" dir="ltr">
                                        {Number(inventory.total_payables).toLocaleString()} د.ع
                                    </td>
                                    <td></td>
                                    <td className="p-3 text-right font-mono text-blue-600 dark:text-blue-400" dir="ltr">
                                        {Number(inventory.total_customs).toLocaleString()} د.ع
                                    </td>
                                    <td></td>
                                    <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400" dir="ltr">
                                        {Number(inventory.total_expenses).toLocaleString()} د.ع
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* 4. Accounting Summary Panels Below the Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                    {/* Right Card: الأرصدة اليدوية المسجلة */}
                    <Card className="shadow-xs border-border">
                        <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/20">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-primary" />
                                <span>الأرصدة المسجلة عند الجرد</span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4 space-y-3 text-xs">
                            <div className="flex justify-between items-center py-1 border-b border-border/60">
                                <span className="text-muted-foreground font-semibold">رصيد الصندوق (الكاش):</span>
                                <MoneyDisplay amount={inventory.actual_cash} currency="د.ع" size="sm" />
                            </div>

                            <div className="flex justify-between items-center py-1 border-b border-border/60">
                                <span className="text-muted-foreground font-semibold">رصيد المصارف:</span>
                                <MoneyDisplay amount={inventory.bank_balance} currency="د.ع" size="sm" />
                            </div>

                            <div className="flex justify-between items-center py-1 border-b border-border/60">
                                <span className="text-muted-foreground font-semibold">الموجود الكلي السابق:</span>
                                <span className="font-mono font-semibold text-muted-foreground">
                                    {Number(inventory.previous_net_worth || 0).toLocaleString()} د.ع
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-1 text-muted-foreground">
                                <span>نثريات تشغيلية (توثيق فقط):</span>
                                <MoneyDisplay amount={inventory.total_expenses} currency="د.ع" size="sm" variant="muted" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Left Card: خلاصة معادلة الجرد */}
                    <Card className="shadow-xs border-border">
                        <CardHeader className="pb-3 pt-4 px-4 border-b border-border bg-muted/20">
                            <CardTitle className="text-sm font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    <span>تفصيل معادلة الجرد والأرباح</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-mono">
                                    كشف معتمد
                                </Badge>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4 space-y-3 text-xs">
                            {/* 1. الرصيد المتوفر */}
                            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-blue-900 dark:text-blue-300 block">
                                        1. الرصيد المتوفر:
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        كاش ({Number(inventory.actual_cash).toLocaleString()}) + مصارف ({Number(inventory.bank_balance).toLocaleString()}) + نطلب ({Number(inventory.total_receivables).toLocaleString()})
                                    </span>
                                </div>
                                <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300" dir="ltr">
                                    {Number(inventory.total_assets).toLocaleString()} د.ع
                                </span>
                            </div>

                            {/* 2. مجموع الالتزامات */}
                            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-amber-900 dark:text-amber-300 block">
                                        2. مجموع الالتزامات:
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        مطلوبين ({Number(inventory.total_payables).toLocaleString()}) + كمرك ({Number(inventory.total_customs).toLocaleString()})
                                    </span>
                                </div>
                                <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300" dir="ltr">
                                    {Number(inventory.total_liabilities).toLocaleString()} د.ع
                                </span>
                            </div>

                            {/* 3. الموجود الكلي */}
                            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-foreground block">
                                        3. الموجود الكلي:
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">الرصيد المتوفر - مجموع الالتزامات</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-foreground" dir="ltr">
                                    {Number(inventory.net_worth).toLocaleString()} د.ع
                                </span>
                            </div>

                            {/* 4. الموجود الكلي السابق */}
                            <div className="p-3 rounded-lg bg-muted/30 border border-border/70 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-foreground block">
                                        4. الموجود الكلي السابق:
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">الرصيد المعتمد من الجرد السابق</span>
                                </div>
                                <span className="font-mono text-sm font-semibold text-muted-foreground" dir="ltr">
                                    {Number(inventory.previous_net_worth || 0).toLocaleString()} د.ع
                                </span>
                            </div>

                            {/* 5. الربح */}
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                                        5. الربح:
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        الموجود الكلي ({Number(inventory.net_worth).toLocaleString()}) - الموجود الكلي السابق ({Number(inventory.previous_net_worth || 0).toLocaleString()})
                                    </span>
                                </div>
                                <span
                                    className={`font-mono text-lg font-black ${
                                        Number(inventory.inventory_profit) >= 0
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                    dir="ltr"
                                >
                                    {Number(inventory.inventory_profit) >= 0 ? '+' : ''}
                                    {Number(inventory.inventory_profit).toLocaleString()} د.ع
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* Dedicated Excel-Style Official Print Document for Single Inventory Sheet */}
            {/* ========================================================================= */}
            <div className="hidden print:block text-black bg-white w-full text-xs" dir="rtl">
                {/* 1. Official Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4">
                    <div className="flex justify-between items-start">
                        <div className="text-right">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                نظام إدارة الحسابات المالية والجرد
                            </h1>
                            <p className="text-xs text-slate-600 font-semibold mt-0.5">
                                سجل وتقارير الجرد المالي الدوري العام
                            </p>
                        </div>
                        <div className="text-center bg-slate-100 border border-slate-700 px-5 py-2 rounded">
                            <h2 className="text-base font-black text-slate-900">
                                كشف جرد مالي دوري
                            </h2>
                            <span className="font-mono text-xs font-bold text-slate-700 block" dir="ltr">
                                #{inventory.id}
                            </span>
                        </div>
                        <div className="text-left font-mono text-[11px] text-slate-600">
                            <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-IQ')}</div>
                            <div>الوقت: {new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>

                    {/* Metadata Table (Excel style) */}
                    <table className="w-full mt-3 border-collapse border border-slate-700 text-xs">
                        <tbody>
                            <tr>
                                <td className="border border-slate-700 p-1.5 font-bold bg-slate-100 w-1/6">عنوان الكشف:</td>
                                <td className="border border-slate-700 p-1.5 font-semibold w-2/6">{inventory.title || `كشف جرد #${inventory.id}`}</td>
                                <td className="border border-slate-700 p-1.5 font-bold bg-slate-100 w-1/6">تاريخ الجرد:</td>
                                <td className="border border-slate-700 p-1.5 font-mono w-2/6" dir="ltr">
                                    {new Date(inventory.inventory_date).toLocaleDateString('ar-IQ', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-slate-700 p-1.5 font-bold bg-slate-100">المسؤول / المحاسب:</td>
                                <td className="border border-slate-700 p-1.5 font-semibold">{inventory.creator?.name || 'النظام'}</td>
                                <td className="border border-slate-700 p-1.5 font-bold bg-slate-100">حالة الكشف:</td>
                                <td className="border border-slate-700 p-1.5 font-semibold text-emerald-800">معتمد وموثق في السجلات</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 2. Detailed Items Matrix (Excel Grid) */}
                <div className="mb-4">
                    <h3 className="font-bold text-xs mb-1.5 text-slate-800 flex items-center justify-between">
                        <span>أولاً: جدول بنود ومفردات الجرد التفصيلي</span>
                        <span className="text-[10px] text-slate-500 font-normal">المبالغ بالدينار العراقي (د.ع)</span>
                    </h3>

                    <table className="w-full border-collapse border border-slate-700 text-[11px]">
                        <thead>
                            {/* Super Category Headers */}
                            <tr className="border border-slate-700 font-bold text-center">
                                <th className="border border-slate-700 p-1.5 w-7 bg-slate-200">#</th>
                                <th colSpan={2} className="border border-slate-700 p-1.5 bg-blue-100 text-blue-950 font-black">
                                    1. نطلب (المدينون)
                                </th>
                                <th colSpan={2} className="border border-slate-700 p-1.5 bg-amber-100 text-amber-950 font-black">
                                    2. مطلوبين (الدائنون)
                                </th>
                                <th colSpan={2} className="border border-slate-700 p-1.5 bg-orange-100 text-orange-950 font-black">
                                    3. كمرك (تخليص جمركي)
                                </th>
                                <th colSpan={2} className="border border-slate-700 p-1.5 bg-slate-200 text-slate-900 font-black">
                                    4. نثريات (تشغيلية - توثيق)
                                </th>
                            </tr>
                            {/* Sub Headers */}
                            <tr className="bg-slate-50 border border-slate-700 text-[10px] font-bold text-slate-800">
                                <th className="border border-slate-700 p-1 text-center">ت</th>
                                <th className="border border-slate-700 p-1 text-right w-[15%]">البيان / الاسم</th>
                                <th className="border border-slate-700 p-1 text-left w-[10%]">المبلغ</th>
                                <th className="border border-slate-700 p-1 text-right w-[15%]">البيان / الاسم</th>
                                <th className="border border-slate-700 p-1 text-left w-[10%]">المبلغ</th>
                                <th className="border border-slate-700 p-1 text-right w-[15%]">البيان / الاسم</th>
                                <th className="border border-slate-700 p-1 text-left w-[10%]">المبلغ</th>
                                <th className="border border-slate-700 p-1 text-right w-[15%]">البيان / الاسم</th>
                                <th className="border border-slate-700 p-1 text-left w-[10%]">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: Math.max(maxRows, 5) }).map((_, idx) => {
                                const rec = receivables[idx];
                                const pay = payables[idx];
                                const cus = customs[idx];
                                const exp = expenses[idx];

                                return (
                                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                                        <td className="border border-slate-700 p-1 text-center font-mono text-[10px] text-slate-600">
                                            {idx + 1}
                                        </td>

                                        {/* نطلب */}
                                        <td className="border border-slate-700 p-1 text-right truncate max-w-[120px]">
                                            {rec?.details || (rec?.amount ? '—' : '')}
                                        </td>
                                        <td className="border border-slate-700 p-1 text-left font-mono" dir="ltr">
                                            {rec && Number(rec.amount) > 0 ? Number(rec.amount).toLocaleString() : ''}
                                        </td>

                                        {/* مطلوبين */}
                                        <td className="border border-slate-700 p-1 text-right truncate max-w-[120px]">
                                            {pay?.details || (pay?.amount ? '—' : '')}
                                        </td>
                                        <td className="border border-slate-700 p-1 text-left font-mono" dir="ltr">
                                            {pay && Number(pay.amount) > 0 ? Number(pay.amount).toLocaleString() : ''}
                                        </td>

                                        {/* كمرك */}
                                        <td className="border border-slate-700 p-1 text-right truncate max-w-[120px]">
                                            {cus?.details || (cus?.amount ? '—' : '')}
                                        </td>
                                        <td className="border border-slate-700 p-1 text-left font-mono" dir="ltr">
                                            {cus && Number(cus.amount) > 0 ? Number(cus.amount).toLocaleString() : ''}
                                        </td>

                                        {/* نثريات */}
                                        <td className="border border-slate-700 p-1 text-right truncate max-w-[120px]">
                                            {exp?.details || (exp?.amount ? '—' : '')}
                                        </td>
                                        <td className="border border-slate-700 p-1 text-left font-mono" dir="ltr">
                                            {exp && Number(exp.amount) > 0 ? Number(exp.amount).toLocaleString() : ''}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-200 border-2 border-slate-800 font-bold text-slate-900 text-[11px]">
                                <td className="border border-slate-700 p-1.5 text-center">المجموع</td>
                                <td className="border border-slate-700 p-1.5 text-right font-black">مجموع نطلب:</td>
                                <td className="border border-slate-700 p-1.5 text-left font-mono font-black" dir="ltr">
                                    {Number(inventory.total_receivables).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 text-right font-black">مجموع المطلوبين:</td>
                                <td className="border border-slate-700 p-1.5 text-left font-mono font-black" dir="ltr">
                                    {Number(inventory.total_payables).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 text-right font-black">مجموع الكمرك:</td>
                                <td className="border border-slate-700 p-1.5 text-left font-mono font-black" dir="ltr">
                                    {Number(inventory.total_customs).toLocaleString()}
                                </td>
                                <td className="border border-slate-700 p-1.5 text-right font-black">مجموع النثريات:</td>
                                <td className="border border-slate-700 p-1.5 text-left font-mono font-black" dir="ltr">
                                    {Number(inventory.total_expenses).toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 3. Financial Summary & Equation Matrix (Excel Sheet) */}
                <div className="mb-4 break-inside-avoid">
                    <h3 className="font-bold text-xs mb-1.5 text-slate-800">
                        ثانياً: خلاصة ومطابقة الحسابات والموجودات والأرباح (معادلة الجرد)
                    </h3>

                    <table className="w-full border-collapse border border-slate-700 text-xs">
                        <thead>
                            <tr className="bg-slate-300 border border-slate-700 font-bold text-slate-900">
                                <th colSpan={4} className="p-2 text-center text-sm font-black">
                                    جدول تسوية الأرصدة واحتساب صافي الأرباح
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-slate-700 p-2 font-bold bg-slate-100 w-1/4">
                                    رصيد الصندوق الفعلي (الكاش):
                                </td>
                                <td className="border border-slate-700 p-2 font-mono font-semibold text-left w-1/4" dir="ltr">
                                    {Number(inventory.actual_cash).toLocaleString()} د.ع
                                </td>
                                <td className="border border-slate-700 p-2 font-bold bg-slate-100 w-1/4">
                                    إجمالي مطلوبين (الدائنون):
                                </td>
                                <td className="border border-slate-700 p-2 font-mono text-left w-1/4" dir="ltr">
                                    {Number(inventory.total_payables).toLocaleString()} د.ع
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-slate-700 p-2 font-bold bg-slate-100">
                                    رصيد الحسابات المصرفية:
                                </td>
                                <td className="border border-slate-700 p-2 font-mono font-semibold text-left" dir="ltr">
                                    {Number(inventory.bank_balance).toLocaleString()} د.ع
                                </td>
                                <td className="border border-slate-700 p-2 font-bold bg-slate-100">
                                    إجمالي مصاريف الكمرك:
                                </td>
                                <td className="border border-slate-700 p-2 font-mono text-left" dir="ltr">
                                    {Number(inventory.total_customs).toLocaleString()} د.ع
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-slate-700 p-2 font-bold bg-slate-100">
                                    إجمالي ما نطلبه (نطلب):
                                </td>
                                <td className="border border-slate-700 p-2 font-mono font-semibold text-left" dir="ltr">
                                    {Number(inventory.total_receivables).toLocaleString()} د.ع
                                </td>
                                <td className="border border-slate-700 p-2 font-bold bg-amber-100 text-amber-950">
                                    2. مجموع الالتزامات (مطلوبين + كمرك):
                                </td>
                                <td className="border border-slate-700 p-2 font-mono font-black text-left bg-amber-50" dir="ltr">
                                    {Number(inventory.total_liabilities).toLocaleString()} د.ع
                                </td>
                            </tr>
                            <tr className="border-t-2 border-slate-700">
                                <td className="border border-slate-700 p-2 font-bold bg-blue-100 text-blue-950">
                                    1. إجمالي الرصيد المتوفر:
                                    <span className="text-[10px] block font-normal text-slate-600">(كاش + مصارف + نطلب)</span>
                                </td>
                                <td className="border border-slate-700 p-2 font-mono font-black text-left bg-blue-50 text-sm text-blue-900" dir="ltr">
                                    {Number(inventory.total_assets).toLocaleString()} د.ع
                                </td>
                                <td className="border border-slate-700 p-2 font-bold bg-slate-200 text-slate-950">
                                    3. الموجود الكلي:
                                    <span className="text-[10px] block font-normal text-slate-600">(الرصيد المتوفر - مجموع الالتزامات)</span>
                                </td>
                                <td className="border border-slate-700 p-2 font-mono font-black text-left bg-slate-100 text-sm text-slate-900" dir="ltr">
                                    {Number(inventory.net_worth).toLocaleString()} د.ع
                                </td>
                            </tr>
                            <tr className="border-t-2 border-slate-800 bg-slate-50">
                                <td className="border border-slate-700 p-2 font-bold bg-slate-100">
                                    4. الموجود الكلي السابق:
                                    <span className="text-[10px] block font-normal text-slate-600">(المعتمد من الجرد السابق)</span>
                                </td>
                                <td className="border border-slate-700 p-2 font-mono font-bold text-left text-slate-700" dir="ltr">
                                    {Number(inventory.previous_net_worth || 0).toLocaleString()} د.ع
                                </td>
                                <td className="border border-slate-700 p-2.5 font-black bg-emerald-100 text-emerald-950 text-sm">
                                    5. الربح:
                                    <span className="text-[10px] block font-normal text-emerald-800">(الموجود الكلي - الموجود الكلي السابق)</span>
                                </td>
                                <td className="border border-slate-700 p-2.5 font-mono font-black text-left bg-emerald-50 text-base" dir="ltr">
                                    {Number(inventory.inventory_profit) >= 0 ? '+' : ''}{Number(inventory.inventory_profit).toLocaleString()} د.ع
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-slate-700 p-1.5 font-bold bg-slate-50 text-slate-600">
                                    نثريات تشغيلية (توثيق):
                                </td>
                                <td className="border border-slate-700 p-1.5 font-mono text-left text-slate-600" dir="ltr" colSpan={3}>
                                    {Number(inventory.total_expenses).toLocaleString()} د.ع (للتوثيق الداخلي فقط ولا تدخل في حسابات الأرباح)
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 4. Notes if available */}
                {inventory.notes && (
                    <div className="mb-4 p-2 border border-slate-700 bg-slate-50/50 break-inside-avoid">
                        <span className="font-bold">ملاحظات إضافية: </span>
                        <span>{inventory.notes}</span>
                    </div>
                )}

                {/* 5. Official Signatures (Excel/Document Footer) */}
                <div className="mt-8 pt-4 border-t-2 border-slate-800 grid grid-cols-3 gap-8 text-center break-inside-avoid">
                    <div className="border border-slate-400 p-3 rounded">
                        <p className="font-black text-slate-800 text-xs">منظم الكشف (المحاسب المالي)</p>
                        <p className="mt-7 text-slate-400 font-mono text-[10px]">................................................</p>
                        <p className="text-[11px] font-semibold text-slate-700 mt-1">{inventory.creator?.name || 'مستخدم النظام'}</p>
                    </div>
                    <div className="border border-slate-400 p-3 rounded">
                        <p className="font-black text-slate-800 text-xs">التدقيق المالي والرقابة</p>
                        <p className="mt-7 text-slate-400 font-mono text-[10px]">................................................</p>
                        <p className="text-[11px] text-slate-600 mt-1">التوقيع والختم المعتمد</p>
                    </div>
                    <div className="border border-slate-400 p-3 rounded">
                        <p className="font-black text-slate-800 text-xs">الإدارة العامة والمصادقة</p>
                        <p className="mt-7 text-slate-400 font-mono text-[10px]">................................................</p>
                        <p className="text-[11px] text-slate-600 mt-1">المصادقة والتاريخ</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
