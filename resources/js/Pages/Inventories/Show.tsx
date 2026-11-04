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
    User,
    CheckCircle2,
    AlertCircle,
    CreditCard,
    Layers,
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
    mohammed_opening_cash: number | string;
    mohammed_outflow: number | string;
    mohammed_inflow: number | string;
    mohammed_expenses: number | string;
    mohammed_assets: number | string;
    mohammed_cash_present: number | string;
    mohammed_calculated_cash: number | string;
    mohammed_difference: number | string;
    mohammed_previous_net_worth: number | string;
    mohammed_current_net_worth: number | string;
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
                    title={inventory.title || `كشف جرد وميزانية #${inventory.id}`}
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

                {/* 2. Top Stats Grid (Clean Unified StatGrid) */}
                <StatGrid columns={4}>
                    <StatCard
                        title="الموجود الكلي (الصافي)"
                        value={inventory.net_worth}
                        currency="د.ع"
                        color="primary"
                        icon={Scale}
                        description="م/ الموجودات - م/ المطلوبات"
                    />
                    <StatCard
                        title="ربح آخر جرد دوري"
                        value={inventory.inventory_profit}
                        currency="د.ع"
                        color={Number(inventory.inventory_profit) >= 0 ? 'emerald' : 'muted'}
                        icon={TrendingUp}
                        description="الموجود الكلي الحالي - السابق"
                    />
                    <StatCard
                        title="مجموع الموجودات"
                        value={inventory.total_assets}
                        currency="د.ع"
                        color="blue"
                        icon={Wallet}
                        description="كاش حقيقي + مصارف + نطلب"
                    />
                    <StatCard
                        title="مجموع المطلوبات"
                        value={inventory.total_liabilities}
                        currency="د.ع"
                        color="amber"
                        icon={CreditCard}
                        description="مطلوبين + التزامات كمرك"
                    />
                </StatGrid>

                {/* 3. Detailed Items Table (Full Width) */}
                <Card className="shadow-xs border-border overflow-hidden">
                            <CardHeader className="p-4 bg-muted/30 border-b border-border">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                                    <span>بنود ومفردات الجرد التفصيلية</span>
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
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">نثريات (د.ع)</span>
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

                {/* 4. Accounting Panels Below the Table */}
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
                                        كشف معتمد
                                    </Badge>
                                </CardTitle>
                            </CardHeader>

                            <div className="p-4 space-y-3 text-xs">
                                <div className="space-y-2 pb-3 border-b border-border/60">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">نطلب (المدينون):</span>
                                        <MoneyDisplay amount={inventory.total_receivables} currency="د.ع" size="sm" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">مطلوبين (الدائنون):</span>
                                        <MoneyDisplay amount={inventory.total_payables} currency="د.ع" size="sm" variant="negative" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">كمرك مستحق:</span>
                                        <MoneyDisplay amount={inventory.total_customs} currency="د.ع" size="sm" variant="blue" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">نثريات تشغيلية:</span>
                                        <MoneyDisplay amount={inventory.total_expenses} currency="د.ع" size="sm" variant="emerald" />
                                    </div>
                                </div>

                                <div className="space-y-2 pb-3 border-b border-border/60">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-semibold">كاش حقيقي (صناديق):</span>
                                        <MoneyDisplay amount={inventory.actual_cash} currency="د.ع" size="sm" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-semibold">رصيد المصارف:</span>
                                        <MoneyDisplay amount={inventory.bank_balance} currency="د.ع" size="sm" />
                                    </div>
                                </div>

                                <div className="space-y-2 pb-3 border-b border-border/60">
                                    <div className="flex justify-between items-center font-semibold">
                                        <span>م/ الموجودات (كاش+مصارف+نطلب):</span>
                                        <MoneyDisplay amount={inventory.total_assets} currency="د.ع" size="md" />
                                    </div>
                                    <div className="flex justify-between items-center font-semibold text-rose-600 dark:text-rose-400">
                                        <span>م/ المطلوبات (مطلوبين+كمرك):</span>
                                        <MoneyDisplay amount={inventory.total_liabilities} currency="د.ع" size="md" variant="negative" />
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground pt-1">
                                        <span>موجود كلي سابق:</span>
                                        <MoneyDisplay amount={inventory.previous_net_worth} currency="د.ع" size="sm" variant="muted" />
                                    </div>
                                </div>

                                {/* بطاقات النتائج الصافية الختامية */}
                                <div className="pt-2 space-y-2">
                                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-primary block">
                                                الموجود الكلي (الصافي)
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">صافي رأس المال والميزانية</span>
                                        </div>
                                        <span className="font-mono text-base font-bold text-primary" dir="ltr">
                                            {Number(inventory.net_worth).toLocaleString()} د.ع
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block">
                                                ربح آخر جرد دوري
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">الفارق المالي المحقق</span>
                                        </div>
                                        <MoneyDisplay
                                            amount={inventory.inventory_profit}
                                            currency="د.ع"
                                            size="md"
                                            variant={Number(inventory.inventory_profit) >= 0 ? 'emerald' : 'negative'}
                                            showSign
                                        />
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
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground">كاش محمد آخر جرد (الافتتاحي):</span>
                                    <MoneyDisplay amount={inventory.mohammed_opening_cash} currency="د.ع" size="sm" />
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground">م/ صادر (مصروفات):</span>
                                    <MoneyDisplay amount={inventory.mohammed_outflow} currency="د.ع" size="sm" variant="negative" />
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground">م/ وارد (مقبوضات):</span>
                                    <MoneyDisplay amount={inventory.mohammed_inflow} currency="د.ع" size="sm" variant="positive" />
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-muted-foreground">نثريات محمد:</span>
                                    <MoneyDisplay amount={inventory.mohammed_expenses} currency="د.ع" size="sm" variant="negative" />
                                </div>
                                <div className="flex justify-between items-center py-1 pb-2 border-b border-border/60">
                                    <span className="text-muted-foreground">الموجودات التابعة:</span>
                                    <MoneyDisplay amount={inventory.mohammed_assets} currency="د.ع" size="sm" />
                                </div>

                                <div className="flex justify-between items-center p-2 rounded-md bg-muted/40 border border-border/60">
                                    <span className="text-muted-foreground font-semibold">الكاش المحسوب:</span>
                                    <MoneyDisplay amount={inventory.mohammed_calculated_cash} currency="د.ع" size="sm" />
                                </div>

                                <div className="flex justify-between items-center p-2.5 rounded-md bg-muted/20 border border-border/80">
                                    <span className="font-bold text-foreground">الكاش الموجود فعلياً:</span>
                                    <MoneyDisplay amount={inventory.mohammed_cash_present} currency="د.ع" size="md" variant="positive" />
                                </div>

                                {/* شارة التطابق الذكية */}
                                <div
                                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                                        Number(inventory.mohammed_difference) === 0
                                            ? 'bg-muted/40 border-border text-foreground'
                                            : Number(inventory.mohammed_difference) > 0
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                            : 'bg-destructive/10 border-destructive/20 text-destructive'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {Number(inventory.mohammed_difference) === 0 ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                <span>العهدة مطابقة تماماً</span>
                                            </>
                                        ) : Number(inventory.mohammed_difference) > 0 ? (
                                            <>
                                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                                <span>زيادة نقدية في العهدة</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-4 w-4 text-destructive" />
                                                <span>عجز نقدي في العهدة</span>
                                            </>
                                        )}
                                    </span>
                                    <MoneyDisplay
                                        amount={inventory.mohammed_difference}
                                        currency="د.ع"
                                        size="sm"
                                        variant={Number(inventory.mohammed_difference) >= 0 ? 'positive' : 'negative'}
                                        showSign
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </AuthenticatedLayout>
    );
}
