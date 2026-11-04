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

                {/* 2. Top Stats Grid */}
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
                        icon={Scale}
                        description="مطلوبين + التزامات كمرك"
                    />
                </StatGrid>

                {/* 3. Detailed Workspace */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    {/* Detailed Excel Items Table */}
                    <div className="xl:col-span-8 space-y-4">
                        <Card className="shadow-xs border-border overflow-hidden">
                            <CardHeader className="p-4 bg-muted/30 border-b border-border">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                                    <span>بنود الجرد المسجلة (مطابقة الإكسل)</span>
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
                                        <tr className="border-b border-border text-[11px] font-bold">
                                            <th className="p-2 w-8 text-center bg-muted/60">#</th>
                                            <th className="p-2 bg-slate-100 dark:bg-slate-900 text-center">نطلب (د.ع)</th>
                                            <th className="p-2 bg-slate-50 dark:bg-slate-950 text-center">تفاصيل</th>
                                            <th className="p-2 bg-amber-100/70 dark:bg-amber-950/40 text-center">مطلوبين (د.ع)</th>
                                            <th className="p-2 bg-amber-50/50 dark:bg-amber-950/20 text-center">تفاصيل</th>
                                            <th className="p-2 bg-blue-100/70 dark:bg-blue-950/40 text-center">كمرك (د.ع)</th>
                                            <th className="p-2 bg-blue-50/50 dark:bg-blue-950/20 text-center">تفاصيل</th>
                                            <th className="p-2 bg-emerald-100/70 dark:bg-emerald-950/40 text-center">نثريات (د.ع)</th>
                                            <th className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">تفاصيل</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {Array.from({ length: maxRows }).map((_, idx) => {
                                            const rec = receivables[idx];
                                            const pay = payables[idx];
                                            const cus = customs[idx];
                                            const exp = expenses[idx];

                                            return (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="p-2 text-center text-muted-foreground font-mono text-[11px] bg-muted/20">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="p-2 text-right font-mono font-semibold" dir="ltr">
                                                        {rec ? Number(rec.amount).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">{rec?.details || '—'}</td>

                                                    <td className="p-2 text-right font-mono font-semibold text-amber-700 dark:text-amber-400" dir="ltr">
                                                        {pay ? Number(pay.amount).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">{pay?.details || '—'}</td>

                                                    <td className="p-2 text-right font-mono font-semibold text-blue-700 dark:text-blue-400" dir="ltr">
                                                        {cus ? Number(cus.amount).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">{cus?.details || '—'}</td>

                                                    <td className="p-2 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400" dir="ltr">
                                                        {exp ? Number(exp.amount).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="p-2 text-muted-foreground">{exp?.details || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted font-bold text-xs border-t-2 border-border">
                                            <td className="p-2 text-center">المجموع</td>
                                            <td className="p-2 text-right font-mono" dir="ltr">
                                                {Number(inventory.total_receivables).toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-2 text-right font-mono text-amber-700 dark:text-amber-400" dir="ltr">
                                                {Number(inventory.total_payables).toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-2 text-right font-mono text-blue-700 dark:text-blue-400" dir="ltr">
                                                {Number(inventory.total_customs).toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                            <td className="p-2 text-right font-mono text-emerald-700 dark:text-emerald-400" dir="ltr">
                                                {Number(inventory.total_expenses).toLocaleString()} د.ع
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Accounting Panels (Right/Side) */}
                    <div className="xl:col-span-4 space-y-4">
                        {/* 1. لوحة المجاميع والميزانية العمومية */}
                        <Card className="shadow-xs border-2 border-slate-900 dark:border-slate-700 overflow-hidden">
                            <div className="bg-red-600 text-white font-bold text-center py-2 text-sm">
                                لوحة المجاميع والميزانية العمومية
                            </div>

                            <div className="divide-y divide-border text-xs">
                                <div className="flex justify-between items-center p-2.5 bg-slate-100 dark:bg-slate-900">
                                    <MoneyDisplay amount={inventory.total_receivables} currency="د.ع" size="sm" />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">نطلب (المدينون)</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-amber-50 dark:bg-amber-950/30">
                                    <MoneyDisplay amount={inventory.total_payables} currency="د.ع" size="sm" variant="negative" />
                                    <span className="font-bold text-amber-900 dark:text-amber-300">مطلوبين (الدائنون)</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-blue-50 dark:bg-blue-950/30">
                                    <MoneyDisplay amount={inventory.total_customs} currency="د.ع" size="sm" variant="blue" />
                                    <span className="font-bold text-blue-900 dark:text-blue-300">كمرك</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-emerald-50 dark:bg-emerald-950/30">
                                    <MoneyDisplay amount={inventory.total_expenses} currency="د.ع" size="sm" variant="emerald" />
                                    <span className="font-bold text-emerald-900 dark:text-emerald-300">نثريات تشغيلية</span>
                                </div>

                                <div className="h-2 bg-slate-900 dark:bg-slate-800" />

                                <div className="flex justify-between items-center p-2.5 bg-cyan-50 dark:bg-cyan-950/30 font-semibold">
                                    <MoneyDisplay amount={inventory.actual_cash} currency="د.ع" size="sm" />
                                    <span className="font-bold text-cyan-950 dark:text-cyan-200">كاش حقيقي (صناديق)</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-cyan-50 dark:bg-cyan-950/30 font-semibold">
                                    <MoneyDisplay amount={inventory.bank_balance} currency="د.ع" size="sm" />
                                    <span className="font-bold text-cyan-950 dark:text-cyan-200">رصيد المصارف</span>
                                </div>

                                <div className="flex justify-between items-center p-2.5 font-bold bg-muted/60">
                                    <MoneyDisplay amount={inventory.total_assets} currency="د.ع" size="md" />
                                    <span>م/ الموجودات</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 font-bold text-rose-600 dark:text-rose-400">
                                    <MoneyDisplay amount={inventory.total_liabilities} currency="د.ع" size="md" variant="negative" />
                                    <span>م/ مطلوبات (مطلوبين+كمرك)</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-slate-900 text-white font-bold">
                                    <span className="font-mono text-base" dir="ltr">
                                        {Number(inventory.net_worth).toLocaleString()} د.ع
                                    </span>
                                    <span className="text-sm">الموجود الكلي (الصافي)</span>
                                </div>

                                <div className="flex justify-between items-center p-2.5 text-muted-foreground">
                                    <MoneyDisplay amount={inventory.previous_net_worth} currency="د.ع" size="sm" variant="muted" />
                                    <span>موجود كلي سابق</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-emerald-500/10 font-bold border-t">
                                    <MoneyDisplay
                                        amount={inventory.inventory_profit}
                                        currency="د.ع"
                                        size="md"
                                        variant={Number(inventory.inventory_profit) >= 0 ? 'emerald' : 'negative'}
                                        showSign
                                    />
                                    <span className="text-emerald-800 dark:text-emerald-300">ربح آخر جرد دوري</span>
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
                                <div className="flex justify-between items-center p-2.5 bg-orange-50/50 dark:bg-orange-950/20">
                                    <MoneyDisplay amount={inventory.mohammed_opening_cash} currency="د.ع" size="sm" />
                                    <span>كاش محمد آخر جرد</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-orange-50/50 dark:bg-orange-950/20">
                                    <MoneyDisplay amount={inventory.mohammed_outflow} currency="د.ع" size="sm" variant="negative" />
                                    <span>م/ صادر (مصروفات)</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-orange-50/50 dark:bg-orange-950/20">
                                    <MoneyDisplay amount={inventory.mohammed_inflow} currency="د.ع" size="sm" variant="positive" />
                                    <span>م/ وارد (مقبوضات)</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-orange-50/50 dark:bg-orange-950/20">
                                    <MoneyDisplay amount={inventory.mohammed_expenses} currency="د.ع" size="sm" variant="negative" />
                                    <span>نثريات محمد</span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-orange-50/50 dark:bg-orange-950/20">
                                    <MoneyDisplay amount={inventory.mohammed_assets} currency="د.ع" size="sm" />
                                    <span>الموجودات التابعة</span>
                                </div>

                                <div className="flex justify-between items-center p-2.5 bg-muted/60 font-semibold">
                                    <MoneyDisplay amount={inventory.mohammed_calculated_cash} currency="د.ع" size="sm" />
                                    <span className="text-muted-foreground">الكاش المحسوب بالمعادلة</span>
                                </div>

                                <div className="flex justify-between items-center p-2.5 bg-emerald-100/70 dark:bg-emerald-950/40 font-bold">
                                    <MoneyDisplay amount={inventory.mohammed_cash_present} currency="د.ع" size="md" variant="positive" />
                                    <span className="text-emerald-900 dark:text-emerald-200">الكاش الموجود (الفعلي)</span>
                                </div>

                                <div
                                    className={`flex justify-between items-center p-2.5 font-bold ${
                                        Number(inventory.mohammed_difference) === 0
                                            ? 'bg-muted/40 text-muted-foreground'
                                            : Number(inventory.mohammed_difference) > 0
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                                >
                                    <MoneyDisplay
                                        amount={inventory.mohammed_difference}
                                        currency="د.ع"
                                        size="sm"
                                        variant={Number(inventory.mohammed_difference) >= 0 ? 'positive' : 'negative'}
                                        showSign
                                    />
                                    <span className="flex items-center gap-1.5">
                                        {Number(inventory.mohammed_difference) === 0 ? (
                                            <>
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                <span>الكاش مطابق تماماً</span>
                                            </>
                                        ) : Number(inventory.mohammed_difference) > 0 ? (
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

                                <div className="flex justify-between items-center p-2.5 bg-slate-900 text-white font-bold">
                                    <span className="font-mono text-xs" dir="ltr">
                                        {Number(inventory.net_worth).toLocaleString()} د.ع
                                    </span>
                                    <span>الموجود الكلي حالياً (مطابق للميزانية)</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
