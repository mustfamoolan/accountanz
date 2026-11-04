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

            <div className="space-y-6" dir="rtl">
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
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="gap-1.5 text-xs h-9"
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
                <StatGrid columns={4}>
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
                        title="الربح قبل خصم السابق"
                        value={inventory.net_worth}
                        currency="د.ع"
                        color="primary"
                        icon={Scale}
                        description="الرصيد المتوفر - الالتزامات"
                    />
                    <StatCard
                        title="ربح الجرد الجديد"
                        value={inventory.inventory_profit}
                        currency="د.ع"
                        color={Number(inventory.inventory_profit) >= 0 ? 'emerald' : 'muted'}
                        icon={TrendingUp}
                        description="الربح الحالي - ربح آخر جرد"
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
                                <span className="text-muted-foreground font-semibold">ربح آخر جرد سابق:</span>
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

                            {/* 3. الربح قبل خصم السابق */}
                            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-foreground block">
                                        3. الربح الإجمالي الحالي:
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">الرصيد المتوفر - الالتزامات</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-foreground" dir="ltr">
                                    {Number(inventory.net_worth).toLocaleString()} د.ع
                                </span>
                            </div>

                            {/* 4. ربح الجرد الجديد */}
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                                        4. ربح الجرد الجديد (صافي الفترة):
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        الربح الحالي ({Number(inventory.net_worth).toLocaleString()}) - ربح آخر جرد ({Number(inventory.previous_net_worth || 0).toLocaleString()})
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
        </AuthenticatedLayout>
    );
}
