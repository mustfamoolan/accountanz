import { Head, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import {
    PageHeader,
    StatCard,
    StatGrid,
    DataGrid,
    Column,
    TransactionBadge,
    MoneyDisplay,
} from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Wallet,
    Landmark,
    PiggyBank,
    TrendingUp,
    Users,
    Shield,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Coins,
    DollarSign,
} from 'lucide-react';

interface Metrics {
    vaultBalanceIqd?: number;
    vaultBalanceUsd?: number;
    totalCash?: number;
    totalBanks?: number;
    totalLiquidity?: number;
    totalInvestorsCapital: number;
    totalInvestorsProfit: number;
}

interface Transaction {
    id: number;
    reference_no: string;
    type: string;
    amount: number | string;
    currency: string;
    balance_before: number | string;
    balance_after: number | string;
    description: string;
    transaction_date: string;
    creator?: { name: string };
    investor?: { name: string; code: string };
}

interface Props {
    metrics?: Metrics;
    recentTransactions?: Transaction[];
}

export default function Dashboard({ metrics, recentTransactions = [] }: Props) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;

    const columns: Column<Transaction>[] = [
        {
            header: 'رقم المرجع',
            accessorKey: 'reference_no',
            className: 'font-mono font-bold text-xs text-primary whitespace-nowrap',
        },
        {
            header: 'نوع العملية',
            cell: (tx) => <TransactionBadge type={tx.type} />,
        },
        {
            header: 'البيان والتفاصيل',
            cell: (tx) => (
                <div className="max-w-xs">
                    <div className="text-xs text-foreground font-medium truncate">{tx.description}</div>
                    {tx.investor && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span>المستثمر:</span>
                            <span className="font-semibold text-primary">{tx.investor.name}</span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'المبلغ',
            align: 'left',
            cell: (tx) => (
                <MoneyDisplay amount={tx.amount} currency={tx.currency} size="sm" variant="default" />
            ),
        },
        {
            header: 'الرصيد بعد',
            align: 'left',
            cell: (tx) => (
                <MoneyDisplay amount={tx.balance_after} currency={tx.currency} size="sm" />
            ),
        },
        {
            header: 'التاريخ',
            align: 'center',
            cell: (tx) => (
                <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap" dir="ltr">
                    {new Date(tx.transaction_date).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
            ),
        },
        {
            header: 'المسؤول',
            align: 'center',
            cell: (tx) => (
                <span className="text-muted-foreground whitespace-nowrap text-xs">
                    {tx.creator?.name || 'النظام'}
                </span>
            ),
        },
    ];

    const renderMobileCard = (tx: Transaction) => (
        <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{tx.reference_no}</span>
                <TransactionBadge type={tx.type} />
            </div>
            <div className="flex justify-between items-center font-semibold text-foreground">
                <span className="truncate max-w-[200px]">{tx.description}</span>
                <MoneyDisplay amount={tx.amount} currency={tx.currency} size="md" />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>الرصيد بعد: <strong className="font-mono">{Number(tx.balance_after).toLocaleString()} {tx.currency}</strong></span>
                <span dir="ltr">{new Date(tx.transaction_date).toLocaleDateString('ar-IQ')}</span>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header="نظرة عامة على المالية والصناديق" activeNav="dashboard">
            <Head title="لوحة التحكم المحاسبية" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Unified PageHeader */}
                <PageHeader
                    title={`مرحباً بك، ${user?.name || 'المستخدم'}`}
                    description="لوحة التحكم ومتابعة أرصدة الخزنة والمستثمرين والجرد المالي"
                    icon={Coins}
                    badge={
                        <Badge variant="secondary" className="text-xs">
                            {user?.role === 'admin'
                                ? 'مدير عام'
                                : user?.role === 'accountant'
                                ? 'محاسب مالي'
                                : 'مستثمر'}
                        </Badge>
                    }
                    actions={
                        <>
                            <Link href="/treasury">
                                <Button size="sm" className="gap-1.5 text-xs h-9">
                                    <Wallet className="h-4 w-4" />
                                    <span>الخزنة</span>
                                </Button>
                            </Link>
                            <Link href="/inventories">
                                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                                    <Coins className="h-4 w-4 text-emerald-600" />
                                    <span>الجرد والميزانية</span>
                                </Button>
                            </Link>
                            <Link href="/investors">
                                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <span>المستثمرون</span>
                                </Button>
                            </Link>
                        </>
                    }
                />

                {/* 2. Unified Financial StatGrid */}
                <StatGrid columns={4}>
                    <StatCard
                        title="رصيد الخزنة (دينار)"
                        value={metrics?.vaultBalanceIqd ?? metrics?.totalCash ?? 0}
                        color="emerald"
                        icon={Wallet}
                        description="نقد متوفر في الخزنة بالدينار"
                    />

                    <StatCard
                        title="رصيد الخزنة (دولار)"
                        value={metrics?.vaultBalanceUsd ?? 0}
                        color="blue"
                        icon={DollarSign}
                        description="نقد متوفر في الخزنة بالدولار"
                    />

                    <StatCard
                        title="رؤوس أموال المستثمرين"
                        value={metrics?.totalInvestorsCapital || 0}
                        color="purple"
                        icon={PiggyBank}
                        description="رأس مال الشركاء النشط"
                    />

                    <StatCard
                        title="أرباح المستثمرين المتوفرة"
                        value={metrics?.totalInvestorsProfit || 0}
                        color="amber"
                        icon={TrendingUp}
                        description="صندوق أرباح قيد التوزيع"
                    />
                </StatGrid>

                {/* 3. Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-xs hover:border-emerald-500/50 transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">الخزنة</CardTitle>
                                    <CardDescription className="text-xs">إيداع وسحب مباشر بالدينار والدولار</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/treasury">
                                <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                    <span>فتح الخزنة</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs hover:border-blue-500/50 transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                                    <Coins className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">الجرد والميزانية</CardTitle>
                                    <CardDescription className="text-xs">كشف الجرد الدوري ومطابقة الأرصدة</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/inventories">
                                <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                    <span>عرض الجرد والميزانية</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xs hover:border-purple-500/50 transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">المستثمرون والأرباح</CardTitle>
                                    <CardDescription className="text-xs">رؤوس الأموال ونسب الأرباح</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Link href="/investors">
                                <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                    <span>سجلات المستثمرين</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. Unified DataGrid for Recent Activity */}
                <DataGrid<Transaction>
                    title="آخر الحركات المالية والعمليات المسجلة"
                    description="ملخص سريع لأحدث التدفقات النقدية والعمليات المصرفية وأرباح المستثمرين"
                    icon={Clock}
                    columns={columns}
                    data={recentTransactions}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا توجد عمليات مسجلة حديثاً."
                    headerActions={
                        <Link href="/treasury">
                            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                                <span>عرض كل الحركات</span>
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    }
                />
            </div>
        </AuthenticatedLayout>
    );
}
