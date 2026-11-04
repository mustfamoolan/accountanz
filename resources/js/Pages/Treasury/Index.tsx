import { useState, FormEventHandler } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PageHeader,
    StatCard,
    StatGrid,
    DataGrid,
    Column,
    TransactionBadge,
    MoneyDisplay,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    DollarSign,
    Coins,
    Calendar,
    Filter,
    RotateCcw,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

interface VaultAccount {
    id: number;
    name: string;
    currency: 'IQD' | 'USD';
    balance: number;
}

interface Transaction {
    id: number;
    reference_no: string;
    type: 'deposit' | 'withdrawal' | string;
    amount: number;
    currency: 'IQD' | 'USD' | string;
    balance_before: number;
    balance_after: number;
    description: string;
    transaction_date: string;
    creator?: { name: string };
}

interface Props {
    vaultIqd: VaultAccount;
    vaultUsd: VaultAccount;
    transactions: {
        data: Transaction[];
        links: any[];
        total: number;
    };
    filters: {
        from_date?: string;
        to_date?: string;
        currency?: string;
    };
    stats: {
        balanceIqd: number;
        balanceUsd: number;
        totalDepositsIqd: number;
        totalDepositsUsd: number;
        totalWithdrawalsIqd: number;
        totalWithdrawalsUsd: number;
    };
}

export default function TreasuryIndex({
    vaultIqd,
    vaultUsd,
    transactions,
    filters,
    stats,
}: Props) {
    // Dialog states
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);

    // Filter states (Date range only)
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [currencyFilter, setCurrencyFilter] = useState(filters.currency || '');

    const applyFilter = (newCurrency = currencyFilter) => {
        router.get(
            '/treasury',
            {
                from_date: fromDate || undefined,
                to_date: toDate || undefined,
                currency: newCurrency || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const resetFilter = () => {
        setFromDate('');
        setToDate('');
        setCurrencyFilter('');
        router.get('/treasury', {}, { preserveState: true, preserveScroll: true });
    };

    const handleCurrencyTabChange = (c: string) => {
        const next = currencyFilter === c ? '' : c;
        setCurrencyFilter(next);
        applyFilter(next);
    };

    // Deposit Form
    const depositForm = useForm({
        currency: 'IQD' as 'IQD' | 'USD',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
    });

    const handleDepositSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        depositForm.post('/treasury/deposit', {
            onSuccess: () => {
                setDepositOpen(false);
                depositForm.reset();
            },
        });
    };

    // Withdraw Form
    const withdrawForm = useForm({
        currency: 'IQD' as 'IQD' | 'USD',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
    });

    const handleWithdrawSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        withdrawForm.post('/treasury/withdraw', {
            onSuccess: () => {
                setWithdrawOpen(false);
                withdrawForm.reset();
            },
        });
    };

    // Available balance helper for the withdraw modal
    const currentWithdrawBalance =
        withdrawForm.data.currency === 'USD' ? stats.balanceUsd : stats.balanceIqd;

    // Columns for DataGrid
    const columns: Column<Transaction>[] = [
        {
            header: 'رقم الحركة',
            align: 'right',
            cell: (tx) => (
                <span className="font-mono text-xs font-semibold text-primary">
                    {tx.reference_no}
                </span>
            ),
        },
        {
            header: 'نوع العملية',
            align: 'center',
            cell: (tx) => <TransactionBadge type={tx.type} />,
        },
        {
            header: 'المبلغ والعملة',
            align: 'right',
            cell: (tx) => (
                <div className="flex items-center gap-1.5 font-bold">
                    <span
                        className={
                            tx.type === 'deposit'
                                ? 'text-emerald-600 dark:text-emerald-400 font-mono text-sm'
                                : 'text-rose-600 dark:text-rose-400 font-mono text-sm'
                        }
                    >
                        {tx.type === 'deposit' ? '+' : '-'}
                        {Number(tx.amount).toLocaleString()}
                    </span>
                    <Badge
                        variant="outline"
                        className={
                            tx.currency === 'USD'
                                ? 'text-[10px] bg-blue-50 text-blue-700 border-blue-200'
                                : 'text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200'
                        }
                    >
                        {tx.currency === 'USD' ? '$ دولار' : 'د.ع دينار'}
                    </Badge>
                </div>
            ),
        },
        {
            header: 'الرصيد قبل',
            align: 'right',
            cell: (tx) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {Number(tx.balance_before).toLocaleString()} {tx.currency}
                </span>
            ),
        },
        {
            header: 'الرصيد بعد',
            align: 'right',
            cell: (tx) => (
                <span className="font-mono text-xs font-semibold text-foreground">
                    {Number(tx.balance_after).toLocaleString()} {tx.currency}
                </span>
            ),
        },
        {
            header: 'التفاصيل والبيان',
            align: 'right',
            cell: (tx) => (
                <span className="text-xs text-foreground/90 max-w-xs block truncate" title={tx.description}>
                    {tx.description}
                </span>
            ),
        },
        {
            header: 'تاريخ العملية',
            align: 'center',
            cell: (tx) => (
                <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap" dir="ltr">
                    {new Date(tx.transaction_date).toLocaleDateString('ar-IQ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            ),
        },
        {
            header: 'المسؤول',
            align: 'center',
            cell: (tx) => (
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {tx.creator?.name || 'النظام'}
                </span>
            ),
        },
    ];

    const renderMobileCard = (tx: Transaction) => (
        <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{tx.reference_no}</span>
                <TransactionBadge type={tx.type} />
            </div>
            <div className="flex justify-between items-center font-bold">
                <span className="truncate max-w-[200px] text-foreground">{tx.description}</span>
                <span
                    className={
                        tx.type === 'deposit'
                            ? 'text-emerald-600 font-mono text-sm'
                            : 'text-rose-600 font-mono text-sm'
                    }
                >
                    {tx.type === 'deposit' ? '+' : '-'}
                    {Number(tx.amount).toLocaleString()} {tx.currency}
                </span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1.5 border-t border-border/50">
                <span>
                    الرصيد بعد: <strong className="font-mono">{Number(tx.balance_after).toLocaleString()} {tx.currency}</strong>
                </span>
                <span dir="ltr">{new Date(tx.transaction_date).toLocaleDateString('ar-IQ')}</span>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout header="الخزنة" activeNav="treasury">
            <Head title="الخزنة المركزية - دينار ودولار" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Header with direct actions */}
                <PageHeader
                    title="الخزنة"
                    description="الخزنة المركزية المستقلة لإدارة الإيداعات والسحوبات النقدية بالدينار العراقي والدولار الأمريكي."
                    icon={Wallet}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setDepositOpen(true)}
                                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                                <ArrowDownLeft className="h-4 w-4" />
                                <span>إيداع في الخزنة</span>
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWithdrawOpen(true)}
                                className="gap-1.5 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                            >
                                <ArrowUpRight className="h-4 w-4 text-rose-600" />
                                <span>سحب من الخزنة</span>
                            </Button>
                        </div>
                    }
                />

                {/* 2. Stat Cards for Balances & Movements */}
                <StatGrid columns={4}>
                    <StatCard
                        title="رصيد الخزنة (دينار)"
                        value={stats.balanceIqd}
                        currency="د.ع"
                        color="emerald"
                        icon={Coins}
                        description={`إيداعات: ${Number(stats.totalDepositsIqd).toLocaleString()} | سحوبات: ${Number(stats.totalWithdrawalsIqd).toLocaleString()}`}
                    />

                    <StatCard
                        title="رصيد الخزنة (دولار)"
                        value={stats.balanceUsd}
                        currency="$"
                        color="blue"
                        icon={DollarSign}
                        description={`إيداعات: $${Number(stats.totalDepositsUsd).toLocaleString()} | سحوبات: $${Number(stats.totalWithdrawalsUsd).toLocaleString()}`}
                    />

                    <StatCard
                        title="إجمالي الإيداعات"
                        value={stats.totalDepositsIqd}
                        currency="د.ع"
                        color="purple"
                        icon={TrendingUp}
                        description={`وبالدولار: $${Number(stats.totalDepositsUsd).toLocaleString()}`}
                    />

                    <StatCard
                        title="إجمالي السحوبات"
                        value={stats.totalWithdrawalsIqd}
                        currency="د.ع"
                        color="amber"
                        icon={TrendingDown}
                        description={`وبالدولار: $${Number(stats.totalWithdrawalsUsd).toLocaleString()}`}
                    />
                </StatGrid>

                {/* 3. Date Range Filter Only */}
                <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-bold text-foreground">فلتر حركات الخزنة حسب التاريخ:</span>
                        </div>

                        {/* Quick currency tabs */}
                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => handleCurrencyTabChange('')}
                                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                                    currencyFilter === ''
                                        ? 'bg-background font-bold text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                كل العملات
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCurrencyTabChange('IQD')}
                                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                                    currencyFilter === 'IQD'
                                        ? 'bg-emerald-500 text-white font-bold shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                دينار عراقي (IQD)
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCurrencyTabChange('USD')}
                                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                                    currencyFilter === 'USD'
                                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                دولار أمريكي (USD)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end pt-1">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>من تاريخ</span>
                            </Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>إلى تاريخ</span>
                            </Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-2 sm:col-span-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => applyFilter()}
                                className="h-9 px-4 text-xs gap-1.5 flex-1"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                <span>تطبيق الفلتر</span>
                            </Button>

                            {(fromDate || toDate || currencyFilter) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={resetFilter}
                                    className="h-9 px-3 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>مسح الفلتر</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. DataGrid of Vault Transactions */}
                <DataGrid<Transaction>
                    title="سجل حركات الخزنة"
                    description={`إجمالي العمليات المسجلة: ${transactions.total} حركة نقدية`}
                    icon={Wallet}
                    columns={columns}
                    data={transactions.data}
                    links={transactions.links}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا توجد حركات مسجلة في الخزنة ضمن الفترة المحددة."
                />
            </div>

            {/* ================= MODAL: DEPOSIT ================= */}
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <form onSubmit={handleDepositSubmit}>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                                    <ArrowDownLeft className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold">إيداع في الخزنة</DialogTitle>
                                    <DialogDescription className="text-xs">
                                        تسجيل عملية إيداع نقدي مباشر في الخزنة بالدينار أو الدولار.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Currency Selector */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">العملة *</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => depositForm.setData('currency', 'IQD')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            depositForm.data.currency === 'IQD'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <Coins className="h-4 w-4" />
                                        <span>دينار عراقي (IQD)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => depositForm.setData('currency', 'USD')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            depositForm.data.currency === 'USD'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-2 ring-blue-500/20'
                                                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        <span>دولار أمريكي (USD)</span>
                                    </button>
                                </div>
                                {depositForm.errors.currency && (
                                    <p className="text-xs text-rose-500">{depositForm.errors.currency}</p>
                                )}
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">المبلغ *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        placeholder="0.00"
                                        value={depositForm.data.amount}
                                        onChange={(e) => depositForm.setData('amount', e.target.value)}
                                        className="h-10 font-mono text-sm pl-16 text-left"
                                        dir="ltr"
                                        required
                                    />
                                    <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                                        {depositForm.data.currency}
                                    </span>
                                </div>
                                {depositForm.errors.amount && (
                                    <p className="text-xs text-rose-500">{depositForm.errors.amount}</p>
                                )}
                            </div>

                            {/* Date */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">تاريخ العملية *</Label>
                                <Input
                                    type="date"
                                    value={depositForm.data.transaction_date}
                                    onChange={(e) => depositForm.setData('transaction_date', e.target.value)}
                                    className="h-10 text-xs"
                                    required
                                />
                                {depositForm.errors.transaction_date && (
                                    <p className="text-xs text-rose-500">{depositForm.errors.transaction_date}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">تفاصيل العملية / البيان *</Label>
                                <Textarea
                                    rows={3}
                                    placeholder="اكتب تفاصيل ومصدر هذا الإيداع..."
                                    value={depositForm.data.description}
                                    onChange={(e) => depositForm.setData('description', e.target.value)}
                                    className="text-xs resize-none"
                                    required
                                />
                                {depositForm.errors.description && (
                                    <p className="text-xs text-rose-500">{depositForm.errors.description}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDepositOpen(false)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={depositForm.processing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {depositForm.processing ? 'جاري الحفظ...' : 'تأكيد الإيداع'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MODAL: WITHDRAW ================= */}
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <form onSubmit={handleWithdrawSubmit}>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold">سحب من الخزنة</DialogTitle>
                                    <DialogDescription className="text-xs">
                                        تسجيل عملية سحب نقدي مباشر من رصيد الخزنة.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Currency Selector */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">العملة *</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => withdrawForm.setData('currency', 'IQD')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            withdrawForm.data.currency === 'IQD'
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <Coins className="h-4 w-4" />
                                        <span>دينار عراقي (IQD)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => withdrawForm.setData('currency', 'USD')}
                                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            withdrawForm.data.currency === 'USD'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-2 ring-blue-500/20'
                                                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        <span>دولار أمريكي (USD)</span>
                                    </button>
                                </div>
                                {withdrawForm.errors.currency && (
                                    <p className="text-xs text-rose-500">{withdrawForm.errors.currency}</p>
                                )}
                            </div>

                            {/* Available Balance Notice */}
                            <div className="p-2.5 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">الرصيد المتاح الحالي في الخزنة:</span>
                                <strong className="font-mono text-sm text-foreground">
                                    {Number(currentWithdrawBalance).toLocaleString()} {withdrawForm.data.currency}
                                </strong>
                            </div>

                            {/* Amount */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">المبلغ المراد سحبه *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0.01"
                                        max={currentWithdrawBalance > 0 ? currentWithdrawBalance : undefined}
                                        placeholder="0.00"
                                        value={withdrawForm.data.amount}
                                        onChange={(e) => withdrawForm.setData('amount', e.target.value)}
                                        className="h-10 font-mono text-sm pl-16 text-left"
                                        dir="ltr"
                                        required
                                    />
                                    <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                                        {withdrawForm.data.currency}
                                    </span>
                                </div>
                                {withdrawForm.errors.amount && (
                                    <p className="text-xs text-rose-500">{withdrawForm.errors.amount}</p>
                                )}
                            </div>

                            {/* Date */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">تاريخ العملية *</Label>
                                <Input
                                    type="date"
                                    value={withdrawForm.data.transaction_date}
                                    onChange={(e) => withdrawForm.setData('transaction_date', e.target.value)}
                                    className="h-10 text-xs"
                                    required
                                />
                                {withdrawForm.errors.transaction_date && (
                                    <p className="text-xs text-rose-500">{withdrawForm.errors.transaction_date}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">سبب السحب / البيان *</Label>
                                <Textarea
                                    rows={3}
                                    placeholder="اكتب سبب وتفاصيل هذا السحب..."
                                    value={withdrawForm.data.description}
                                    onChange={(e) => withdrawForm.setData('description', e.target.value)}
                                    className="text-xs resize-none"
                                    required
                                />
                                {withdrawForm.errors.description && (
                                    <p className="text-xs text-rose-500">{withdrawForm.errors.description}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setWithdrawOpen(false)}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={withdrawForm.processing}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {withdrawForm.processing ? 'جاري السحب...' : 'تأكيد السحب'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
