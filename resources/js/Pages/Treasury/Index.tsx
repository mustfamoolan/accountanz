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
    FilterBar,
    MoneyDisplay,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    ArrowLeftRight,
    Coins,
    Landmark,
    TrendingUp,
    FileText,
    PlusCircle,
    DollarSign,
} from 'lucide-react';

interface Fund {
    id: number;
    name: string;
    code: string;
    currency: string;
    balance: number | string;
    notes?: string;
}

interface Bank {
    id: number;
    name: string;
    account_number: string;
    currency: string;
    balance: number | string;
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
    account_name: string;
    creator?: { name: string; username: string };
    investor?: { name: string; code: string };
}

interface Props {
    mainFund: Fund;
    funds: Fund[];
    banks: Bank[];
    selectedFund?: Fund | null;
    selectedFundId?: number | null;
    transactions: {
        data: Transaction[];
        links: any[];
        total: number;
    };
    filters: { type?: string; fund_id?: string };
    stats: {
        totalCash: number;
        totalBanks: number;
        totalLiquidity: number;
        totalCashIqd?: number;
        totalCashUsd?: number;
        totalBanksIqd?: number;
        totalBanksUsd?: number;
        totalLiquidityIqd?: number;
        totalLiquidityUsd?: number;
        currentMonthDeposits: number;
        currentMonthWithdrawals: number;
    };
}

export default function TreasuryIndex({
    mainFund,
    funds,
    banks,
    selectedFund,
    selectedFundId,
    transactions,
    filters,
    stats,
}: Props) {
    const [createFundOpen, setCreateFundOpen] = useState(false);
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);

    // Create Fund form
    const createFundForm = useForm({
        name: '',
        code: '',
        currency: 'IQD',
        type: 'sub',
        initial_balance: '',
        notes: '',
    });

    // Deposit form
    const depositForm = useForm({
        fund_id: selectedFundId || mainFund?.id || 1,
        amount: '',
        description: '',
    });

    // Withdraw form
    const withdrawForm = useForm({
        fund_id: selectedFundId || mainFund?.id || 1,
        amount: '',
        description: '',
    });

    // Transfer form
    const transferForm = useForm({
        from_type: 'fund',
        from_id: selectedFundId || mainFund?.id || 1,
        to_type: 'bank',
        to_id: banks[0]?.id || '',
        amount: '',
        description: '',
    });

    const filterByFund = (fundId: number | null) => {
        const query: any = { ...filters };
        if (fundId) {
            query.fund_id = fundId;
        } else {
            delete query.fund_id;
        }
        router.get('/treasury', query, { preserveState: true, preserveScroll: true });
    };

    const handleDeposit: FormEventHandler = (e) => {
        e.preventDefault();
        depositForm.post('/treasury/deposit', {
            onSuccess: () => {
                setDepositOpen(false);
                depositForm.reset();
            },
        });
    };

    const handleWithdraw: FormEventHandler = (e) => {
        e.preventDefault();
        withdrawForm.post('/treasury/withdraw', {
            onSuccess: () => {
                setWithdrawOpen(false);
                withdrawForm.reset();
            },
        });
    };

    const handleTransfer: FormEventHandler = (e) => {
        e.preventDefault();
        transferForm.post('/treasury/transfer', {
            onSuccess: () => {
                setTransferOpen(false);
                transferForm.reset();
            },
        });
    };

    const handleCreateFund: FormEventHandler = (e) => {
        e.preventDefault();
        createFundForm.post('/treasury/funds', {
            onSuccess: () => {
                setCreateFundOpen(false);
                createFundForm.reset();
            },
        });
    };

    // Columns definition for unified DataGrid
    const columns: Column<Transaction>[] = [
        {
            header: 'رقم المرجع',
            accessorKey: 'reference_no',
            className: 'font-mono font-bold text-primary whitespace-nowrap',
        },
        {
            header: 'الصندوق / المصدر',
            accessorKey: 'account_name',
            className: 'font-semibold whitespace-nowrap',
        },
        {
            header: 'نوع العملية',
            cell: (tx) => <TransactionBadge type={tx.type} />,
        },
        {
            header: 'البيان والتفاصيل',
            cell: (tx) => (
                <div className="max-w-xs">
                    <div>{tx.description}</div>
                    {tx.investor && (
                        <span className="text-[10px] text-muted-foreground">
                            المستثمر: {tx.investor.name} ({tx.investor.code})
                        </span>
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

    // Mobile Card Renderer for DataGrid
    const renderMobileCard = (tx: Transaction) => (
        <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{tx.reference_no}</span>
                <TransactionBadge type={tx.type} />
            </div>
            <div className="flex justify-between font-semibold text-foreground">
                <span>{tx.account_name}</span>
                <MoneyDisplay amount={tx.amount} currency={tx.currency} size="md" />
            </div>
            <p className="text-muted-foreground text-[11px] line-clamp-2">{tx.description}</p>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>الرصيد بعد: <strong className="font-mono">{Number(tx.balance_after).toLocaleString()} د.ع</strong></span>
                <span dir="ltr">{new Date(tx.transaction_date).toLocaleDateString('ar-IQ')}</span>
            </div>
        </div>
    );

    // Filter items for FilterBar
    const filterItems = [
        { id: null, label: 'جميع الصناديق', count: funds.length },
        ...funds.map((f) => ({
            id: f.id,
            label: `${f.name} (${f.currency})`,
            badge: (
                <span className="font-mono text-[10px] text-primary">
                    {Number(f.balance).toLocaleString()} {f.currency}
                </span>
            ),
        })),
    ];

    return (
        <AuthenticatedLayout header="إدارة الصناديق والخزينة" activeNav="treasury">
            <Head title="الصندوق الرئيسي والخزينة" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Standard Page Header */}
                <PageHeader
                    title={selectedFund ? `${selectedFund.name} (${selectedFund.currency})` : 'الصناديق المالية والخزينة العامة'}
                    description="الخزينة المركزية لتدفقات الأموال بالدينار العراقي والدولار الأمريكي ورؤوس أموال الشركاء"
                    icon={Wallet}
                    badge={
                        selectedFund ? (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                                صندوق محدد
                            </Badge>
                        ) : (
                            <div className="flex gap-1">
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {funds.length} صناديق
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    دينار + دولار
                                </Badge>
                            </div>
                        )
                    }
                    actions={
                        <>
                            <Button onClick={() => setCreateFundOpen(true)} className="gap-1.5 h-9 text-xs">
                                <PlusCircle className="h-4 w-4" />
                                <span>إضافة صندوق جديد</span>
                            </Button>
                            <Button onClick={() => setDepositOpen(true)} variant="outline" className="gap-1.5 h-9 text-xs">
                                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                <span>إيداع نقدي</span>
                            </Button>
                            <Button onClick={() => setWithdrawOpen(true)} variant="outline" className="gap-1.5 h-9 text-xs">
                                <ArrowUpRight className="h-4 w-4 text-rose-600" />
                                <span>سحب نقدي</span>
                            </Button>
                            <Button onClick={() => setTransferOpen(true)} variant="outline" className="gap-1.5 h-9 text-xs">
                                <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                                <span>تحويل مالي</span>
                            </Button>
                        </>
                    }
                />

                {/* 2. Responsive Filter Bar */}
                <FilterBar
                    title="تصفية حسب الصندوق:"
                    items={filterItems}
                    selectedId={selectedFundId ?? null}
                    onSelect={(id) => filterByFund(id)}
                    onClear={() => filterByFund(null)}
                />

                {/* 3. Unified Financial KPI StatGrid with Dual Currency */}
                <StatGrid columns={4}>
                    {selectedFund ? (
                        <>
                            <StatCard
                                title={`رصيد ${selectedFund.name}`}
                                value={selectedFund.balance}
                                currency={selectedFund.currency === 'USD' ? '$' : 'د.ع'}
                                color="primary"
                                icon={Wallet}
                                description="الرصيد المتاح حالياً في الصندوق المختار"
                            />
                            <StatCard
                                title="النقد العام بالدينار"
                                value={stats.totalCashIqd || 0}
                                currency="د.ع"
                                color="emerald"
                                icon={Coins}
                                description="إجمالي نقد الصناديق بالدينار"
                            />
                            <StatCard
                                title="النقد العام بالدولار"
                                value={stats.totalCashUsd || 0}
                                currency="$"
                                color="blue"
                                icon={DollarSign}
                                description="إجمالي نقد الصناديق بالدولار"
                            />
                            <StatCard
                                title="الأرصدة المصرفية بالدينار"
                                value={stats.totalBanksIqd || 0}
                                currency="د.ع"
                                color="purple"
                                icon={Landmark}
                                description="ودائع البنوك بالدينار"
                            />
                        </>
                    ) : (
                        <>
                            <StatCard
                                title="الصناديق النقدية (دينار)"
                                value={stats.totalCashIqd || 0}
                                currency="د.ع"
                                color="emerald"
                                icon={Coins}
                                description="نقد متوفر في الخزائن بالدينار"
                            />
                            <StatCard
                                title="الصناديق النقدية (دولار)"
                                value={stats.totalCashUsd || 0}
                                currency="$"
                                color="blue"
                                icon={DollarSign}
                                description="نقد متوفر في الخزائن بالدولار"
                            />
                            <StatCard
                                title="الأرصدة المصرفية (دينار)"
                                value={stats.totalBanksIqd || 0}
                                currency="د.ع"
                                color="purple"
                                icon={Landmark}
                                description="ودائع البنوك بالدينار"
                            />
                            <StatCard
                                title="الأرصدة المصرفية (دولار)"
                                value={stats.totalBanksUsd || 0}
                                currency="$"
                                color="amber"
                                icon={Landmark}
                                description="ودائع البنوك بالدولار"
                            />
                        </>
                    )}
                </StatGrid>

                {/* 4. Unified DataGrid */}
                <DataGrid
                    title={`سجل الحركات المالي والتتبع الدقيق ${selectedFund ? `(خاص بـ ${selectedFund.name})` : '(العام)'}`}
                    description="يوثق الصندوق المعني ونوع العملية والمبالغ وتفاصيل التتبع"
                    icon={FileText}
                    columns={columns}
                    data={transactions.data}
                    total={transactions.total}
                    links={transactions.links}
                    renderMobileCard={renderMobileCard}
                    headerActions={
                        <select
                            value={filters.type || ''}
                            onChange={(e) => {
                                const query: any = { ...filters };
                                if (e.target.value) query.type = e.target.value;
                                else delete query.type;
                                router.get('/treasury', query, { preserveState: true });
                            }}
                            className="h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                            <option value="">جميع أنواع الحركات</option>
                            <option value="deposit">إيداع نقدي</option>
                            <option value="withdrawal">سحب نقدي</option>
                            <option value="transfer">تحويل مالي</option>
                            <option value="capital_deposit">إيداع رأس مال</option>
                            <option value="capital_withdrawal">سحب رأس مال</option>
                            <option value="profit_distribution">إثبات أرباح</option>
                            <option value="profit_withdrawal">سحب أرباح</option>
                            <option value="expense">مصروف</option>
                        </select>
                    }
                />
            </div>

            {/* Modals */}
            {/* 1. Modal: Deposit */}
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                            <span>إيداع نقدي في الصندوق</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            تسجيل مبلغ نقدي داخل الخزينة مع توثيق البيان في السجل
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeposit} className="space-y-4">
                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">الصندوق المستهدف</Label>
                            <select
                                value={depositForm.data.fund_id}
                                onChange={(e) => depositForm.setData('fund_id', Number(e.target.value))}
                                className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs"
                            >
                                {funds.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name} (رصيده: {Number(f.balance).toLocaleString()} {f.currency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">المبلغ (د.ع)</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="مثال: 1000000"
                                value={depositForm.data.amount}
                                onChange={(e) => depositForm.setData('amount', e.target.value)}
                                required
                                className="font-mono text-left h-9"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">البيان والسبب</Label>
                            <Input
                                placeholder="مثال: إيداع نقدي من مبيعات فرع الكرادة"
                                value={depositForm.data.description}
                                onChange={(e) => depositForm.setData('description', e.target.value)}
                                required
                                className="h-9 text-xs"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2 flex-col-reverse sm:flex-row">
                            <Button type="button" variant="outline" onClick={() => setDepositOpen(false)} className="w-full sm:w-auto h-9 text-xs">
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={depositForm.processing} className="w-full sm:w-auto h-9 text-xs">
                                {depositForm.processing ? 'جاري الحفظ...' : 'تأكيد الإيداع'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 2. Modal: Withdraw */}
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4 text-rose-600" />
                            <span>سحب نقدي من الصندوق</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            سحب مبلغ من الصندوق مع التأكد الصارم من توفر الرصيد الكافي
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleWithdraw} className="space-y-4">
                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">الصندوق المصدر</Label>
                            <select
                                value={withdrawForm.data.fund_id}
                                onChange={(e) => withdrawForm.setData('fund_id', Number(e.target.value))}
                                className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs"
                            >
                                {funds.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name} (المتوفر: {Number(f.balance).toLocaleString()} {f.currency})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">المبلغ المراد سحبه (د.ع)</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="مثال: 500000"
                                value={withdrawForm.data.amount}
                                onChange={(e) => withdrawForm.setData('amount', e.target.value)}
                                required
                                className="font-mono text-left h-9"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">البيان والسبب</Label>
                            <Input
                                placeholder="مثال: سحب نقدي لعهدة مؤقتة"
                                value={withdrawForm.data.description}
                                onChange={(e) => withdrawForm.setData('description', e.target.value)}
                                required
                                className="h-9 text-xs"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2 flex-col-reverse sm:flex-row">
                            <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)} className="w-full sm:w-auto h-9 text-xs">
                                إلغاء
                            </Button>
                            <Button type="submit" variant="destructive" disabled={withdrawForm.processing} className="w-full sm:w-auto h-9 text-xs">
                                {withdrawForm.processing ? 'جاري الحفظ...' : 'تأكيد السحب'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 3. Modal: Transfer */}
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
                            <span>تحويل مالي بين الصناديق والبنوك</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            نقل أموال من كاش إلى بنك أو العكس مع تحديث كلا الرصيدين فوراً
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleTransfer} className="space-y-4">
                        <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-2">
                            <span className="text-xs font-bold text-foreground">الجهة المحوّل منها (المصدر):</span>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={transferForm.data.from_type}
                                    onChange={(e) => transferForm.setData('from_type', e.target.value)}
                                    className="h-9 px-2 rounded-md border border-border bg-background text-xs"
                                >
                                    <option value="fund">صندوق نقدي</option>
                                    <option value="bank">حساب بنكي</option>
                                </select>

                                <select
                                    value={transferForm.data.from_id}
                                    onChange={(e) => transferForm.setData('from_id', Number(e.target.value))}
                                    className="h-9 px-2 rounded-md border border-border bg-background text-xs"
                                >
                                    {transferForm.data.from_type === 'fund'
                                        ? funds.map((f) => (
                                              <option key={f.id} value={f.id}>
                                                  {f.name} ({Number(f.balance).toLocaleString()})
                                              </option>
                                          ))
                                        : banks.map((b) => (
                                              <option key={b.id} value={b.id}>
                                                  {b.name} ({Number(b.balance).toLocaleString()})
                                              </option>
                                          ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-2">
                            <span className="text-xs font-bold text-foreground">الجهة المحوّل إليها (المستلم):</span>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={transferForm.data.to_type}
                                    onChange={(e) => transferForm.setData('to_type', e.target.value)}
                                    className="h-9 px-2 rounded-md border border-border bg-background text-xs"
                                >
                                    <option value="bank">حساب بنكي</option>
                                    <option value="fund">صندوق نقدي</option>
                                </select>

                                <select
                                    value={transferForm.data.to_id}
                                    onChange={(e) => transferForm.setData('to_id', Number(e.target.value))}
                                    className="h-9 px-2 rounded-md border border-border bg-background text-xs"
                                >
                                    {transferForm.data.to_type === 'fund'
                                        ? funds.map((f) => (
                                              <option key={f.id} value={f.id}>
                                                  {f.name} ({Number(f.balance).toLocaleString()})
                                              </option>
                                          ))
                                        : banks.map((b) => (
                                              <option key={b.id} value={b.id}>
                                                  {b.name} ({Number(b.balance).toLocaleString()})
                                              </option>
                                          ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">المبلغ المحول</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="مثال: 2000000"
                                value={transferForm.data.amount}
                                onChange={(e) => transferForm.setData('amount', e.target.value)}
                                required
                                className="font-mono text-left h-9"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-1.5 text-right">
                            <Label className="text-xs font-semibold">البيان</Label>
                            <Input
                                placeholder="مثال: إيداع كاش الصندوق في الحساب البنكي"
                                value={transferForm.data.description}
                                onChange={(e) => transferForm.setData('description', e.target.value)}
                                required
                                className="h-9 text-xs"
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2 flex-col-reverse sm:flex-row">
                            <Button type="button" variant="outline" onClick={() => setTransferOpen(false)} className="w-full sm:w-auto h-9 text-xs">
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={transferForm.processing} className="w-full sm:w-auto h-9 text-xs">
                                {transferForm.processing ? 'جاري التحويل...' : 'تأكيد التحويل'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
