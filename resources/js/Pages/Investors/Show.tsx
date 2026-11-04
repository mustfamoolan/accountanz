import { useState, FormEventHandler } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    User,
    ArrowLeft,
    PiggyBank,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    FileText,
    Phone,
    PlusCircle,
    MinusCircle,
    AlertCircle,
} from 'lucide-react';

interface Investor {
    id: number;
    code: string;
    name: string;
    phone?: string;
    currency: string;
    capital_balance: number | string;
    profit_balance: number | string;
    total_withdrawn_capital: number | string;
    total_withdrawn_profits: number | string;
    profit_rate: number | string;
    status: string;
    notes?: string;
    created_at?: string;
}

interface Fund {
    id: number;
    name: string;
    balance: number | string;
}

interface Bank {
    id: number;
    name: string;
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
    creator?: { name: string };
}

interface Props {
    investor: Investor;
    transactions: {
        data: Transaction[];
        links: any[];
        total: number;
    };
    funds: Fund[];
    banks: Bank[];
}

export default function InvestorShow({ investor, transactions, funds, banks }: Props) {
    // 4 Modals
    const [depositCapitalOpen, setDepositCapitalOpen] = useState(false);
    const [withdrawCapitalOpen, setWithdrawCapitalOpen] = useState(false);
    const [distributeProfitOpen, setDistributeProfitOpen] = useState(false);
    const [withdrawProfitOpen, setWithdrawProfitOpen] = useState(false);

    // Form: Deposit Capital
    const depositCapForm = useForm({
        amount: '',
        destination_type: 'fund',
        destination_id: funds[0]?.id || 1,
        description: 'إيداع رأس مال إضافي في الخزينة',
    });

    // Form: Withdraw Capital
    const withdrawCapForm = useForm({
        amount: '',
        source_type: 'fund',
        source_id: funds[0]?.id || 1,
        description: 'سحب واسترداد من رأس المال',
    });

    // Form: Distribute Profit
    const distProfitForm = useForm({
        amount: '',
        description: 'إثبات وتوزيع أرباح عن الفترة',
    });

    // Form: Withdraw Profit
    const withdrawProfitForm = useForm({
        amount: '',
        source_type: 'fund',
        source_id: funds[0]?.id || 1,
        description: 'صرف أرباح نقدية للمستثمر',
    });

    const handleDepositCapital: FormEventHandler = (e) => {
        e.preventDefault();
        depositCapForm.post(`/investors/${investor.id}/deposit-capital`, {
            onSuccess: () => {
                setDepositCapitalOpen(false);
                depositCapForm.reset();
            },
        });
    };

    const handleWithdrawCapital: FormEventHandler = (e) => {
        e.preventDefault();
        withdrawCapForm.post(`/investors/${investor.id}/withdraw-capital`, {
            onSuccess: () => {
                setWithdrawCapitalOpen(false);
                withdrawCapForm.reset();
            },
        });
    };

    const handleDistributeProfit: FormEventHandler = (e) => {
        e.preventDefault();
        distProfitForm.post(`/investors/${investor.id}/distribute-profit`, {
            onSuccess: () => {
                setDistributeProfitOpen(false);
                distProfitForm.reset();
            },
        });
    };

    const handleWithdrawProfit: FormEventHandler = (e) => {
        e.preventDefault();
        withdrawProfitForm.post(`/investors/${investor.id}/withdraw-profit`, {
            onSuccess: () => {
                setWithdrawProfitOpen(false);
                withdrawProfitForm.reset();
            },
        });
    };

    const totalEquity = Number(investor.capital_balance) + Number(investor.profit_balance);
    const totalHistoricalWithdrawn =
        Number(investor.total_withdrawn_capital) + Number(investor.total_withdrawn_profits);

    // Table Columns definition for DataGrid
    const columns: Column<Transaction>[] = [
        {
            header: 'رقم المرجع',
            accessorKey: 'reference_no',
            className: 'font-mono font-bold text-xs text-primary whitespace-nowrap',
        },
        {
            header: 'نوع الحركة',
            cell: (tx) => <TransactionBadge type={tx.type} />,
        },
        {
            header: 'البيان والتفاصيل',
            cell: (tx) => (
                <div className="max-w-md">
                    <span className="text-xs text-foreground font-medium">{tx.description}</span>
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
            header: 'التاريخ والوقت',
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
        <AuthenticatedLayout header={`كشف حساب المستثمر: ${investor.name}`} activeNav="investors">
            <Head title={`المستثمر: ${investor.name}`} />

            <div className="space-y-6" dir="rtl">
                {/* 1. Unified PageHeader */}
                <PageHeader
                    title={investor.name}
                    description={`العملة: ${investor.currency} | ${investor.phone ? `الهاتف: ${investor.phone} | ` : ''}نسبة الأرباح: ${investor.profit_rate}%`}
                    icon={User}
                    badge={
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                                {investor.code}
                            </Badge>
                            <Badge
                                variant={investor.status === 'active' ? 'default' : 'secondary'}
                                className="text-[10px]"
                            >
                                {investor.status === 'active' ? 'نشط' : 'متوقف'}
                            </Badge>
                        </div>
                    }
                    actions={
                        <Link href="/investors">
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>العودة لقائمة المستثمرين</span>
                            </Button>
                        </Link>
                    }
                />

                {/* 2. Interactive Balances & Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Capital */}
                    <Card className="shadow-xs border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-semibold text-muted-foreground">
                                    رأس المال الحالي النشط
                                </CardTitle>
                                <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600">
                                    <PiggyBank className="h-4 w-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-2xl font-bold font-mono text-purple-600">
                                <MoneyDisplay amount={investor.capital_balance} currency={investor.currency} size="lg" variant="purple" />
                            </div>
                            <div className="flex gap-1.5 pt-1">
                                <Button
                                    size="sm"
                                    onClick={() => setDepositCapitalOpen(true)}
                                    className="flex-1 text-xs h-8 gap-1 bg-purple-600 hover:bg-purple-700"
                                >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span>إيداع رأس مال</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setWithdrawCapitalOpen(true)}
                                    className="flex-1 text-xs h-8 gap-1 border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                                >
                                    <MinusCircle className="h-3.5 w-3.5" />
                                    <span>استرداد رأس مال</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Profit Balance */}
                    <Card className="shadow-xs border-emerald-500/20 bg-gradient-to-br from-background to-emerald-500/5">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-semibold text-muted-foreground">
                                    صندوق أرباح المستثمر المتوفرة
                                </CardTitle>
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-2xl font-bold font-mono text-emerald-600">
                                <MoneyDisplay amount={investor.profit_balance} currency={investor.currency} size="lg" variant="emerald" />
                            </div>
                            <div className="flex gap-1.5 pt-1">
                                <Button
                                    size="sm"
                                    onClick={() => setDistributeProfitOpen(true)}
                                    className="flex-1 text-xs h-8 gap-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    <span>إثبات أرباح</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setWithdrawProfitOpen(true)}
                                    disabled={Number(investor.profit_balance) <= 0}
                                    className="flex-1 text-xs h-8 gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                >
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                    <span>سحب أرباح</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 3: Total Equity */}
                    <StatCard
                        title="إجمالي حقوق المستثمر الحالية"
                        value={totalEquity}
                        color="primary"
                        icon={Wallet}
                        description="مجموع رأس المال النشط + الأرباح"
                    />

                    {/* Card 4: Historical Withdrawn */}
                    <StatCard
                        title="إجمالي المسحوبات التاريخية"
                        value={totalHistoricalWithdrawn}
                        color="amber"
                        icon={ArrowUpRight}
                        description="مجموع ما تم سحبه واستلامه نقداً"
                    />
                </div>

                {/* 3. Unified DataGrid for Ledger */}
                <DataGrid<Transaction>
                    title={`سجل العمليات المالية والتدفقات الخاصة بالمستثمر`}
                    description="كشف حساب تفصيلي بجميع إيداعات رأس المال، إثبات الأرباح، والمسحوبات النقدية"
                    icon={FileText}
                    columns={columns}
                    data={transactions.data}
                    total={transactions.total}
                    links={transactions.links}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا توجد حركات مسجلة لهذا المستثمر بعد."
                />
            </div>

            {/* Modal: Deposit Capital */}
            <Dialog open={depositCapitalOpen} onOpenChange={setDepositCapitalOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-600">
                            <PlusCircle className="h-5 w-5" />
                            <span>إيداع رأس مال إضافي - {investor.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            يزيد من رأس مال المستثمر، ويتم توريد النقد في الصندوق أو الحساب البنكي المختار
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDepositCapital} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="dep-cap-amt" className="text-xs font-semibold">
                                المبلغ المراد إيداعه <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dep-cap-amt"
                                type="number"
                                step="any"
                                min="1"
                                placeholder="0.00"
                                dir="ltr"
                                className="text-lg font-mono font-bold"
                                value={depositCapForm.data.amount}
                                onChange={(e) => depositCapForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">جهة استلام النقد</Label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dep_destination_type"
                                        checked={depositCapForm.data.destination_type === 'fund'}
                                        onChange={() => {
                                            depositCapForm.setData((prev) => ({
                                                ...prev,
                                                destination_type: 'fund',
                                                destination_id: funds[0]?.id || 1,
                                            }));
                                        }}
                                    />
                                    <span>الصندوق الرئيسي (كاش)</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dep_destination_type"
                                        checked={depositCapForm.data.destination_type === 'bank'}
                                        onChange={() => {
                                            depositCapForm.setData((prev) => ({
                                                ...prev,
                                                destination_type: 'bank',
                                                destination_id: banks[0]?.id || 1,
                                            }));
                                        }}
                                    />
                                    <span>حساب بنكي</span>
                                </label>
                            </div>
                        </div>

                        {depositCapForm.data.destination_type === 'fund' ? (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">اختر الصندوق</Label>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2"
                                    value={depositCapForm.data.destination_id}
                                    onChange={(e) => depositCapForm.setData('destination_id', Number(e.target.value))}
                                >
                                    {funds.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} (رصيده الحالي: {Number(f.balance).toLocaleString()} د.ع)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">اختر المصرف المستلم</Label>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2"
                                    value={depositCapForm.data.destination_id}
                                    onChange={(e) => depositCapForm.setData('destination_id', Number(e.target.value))}
                                >
                                    {banks.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} (رصيده الحالي: {Number(b.balance).toLocaleString()} د.ع)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="dep-cap-desc" className="text-xs font-semibold">
                                البيان والملاحظات <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dep-cap-desc"
                                value={depositCapForm.data.description}
                                onChange={(e) => depositCapForm.setData('description', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDepositCapitalOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={depositCapForm.processing}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {depositCapForm.processing ? 'جاري التنفيذ...' : 'تأكيد إيداع رأس المال'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Withdraw Capital */}
            <Dialog open={withdrawCapitalOpen} onOpenChange={setWithdrawCapitalOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <MinusCircle className="h-5 w-5" />
                            <span>سحب واسترداد من رأس المال - {investor.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            يخفض من رأس مال المستثمر ويصرف له النقد من الصندوق أو الحساب البنكي المختار
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleWithdrawCapital} className="space-y-3.5">
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-400">
                            رأس المال الحالي المتاح: <strong>{Number(investor.capital_balance).toLocaleString()} {investor.currency}</strong>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="with-cap-amt" className="text-xs font-semibold">
                                المبلغ المراد استرداده <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="with-cap-amt"
                                type="number"
                                step="any"
                                min="1"
                                max={Number(investor.capital_balance)}
                                placeholder="0.00"
                                dir="ltr"
                                className="text-lg font-mono font-bold"
                                value={withdrawCapForm.data.amount}
                                onChange={(e) => withdrawCapForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">مصدر صرف الأموال</Label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                    <input
                                        type="radio"
                                        name="with_source_type"
                                        checked={withdrawCapForm.data.source_type === 'fund'}
                                        onChange={() => {
                                            withdrawCapForm.setData((prev) => ({
                                                ...prev,
                                                source_type: 'fund',
                                                source_id: funds[0]?.id || 1,
                                            }));
                                        }}
                                    />
                                    <span>الصندوق الرئيسي (كاش)</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                    <input
                                        type="radio"
                                        name="with_source_type"
                                        checked={withdrawCapForm.data.source_type === 'bank'}
                                        onChange={() => {
                                            withdrawCapForm.setData((prev) => ({
                                                ...prev,
                                                source_type: 'bank',
                                                source_id: banks[0]?.id || 1,
                                            }));
                                        }}
                                    />
                                    <span>حساب بنكي</span>
                                </label>
                            </div>
                        </div>

                        {withdrawCapForm.data.source_type === 'fund' ? (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">صرف من صندوق</Label>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2"
                                    value={withdrawCapForm.data.source_id}
                                    onChange={(e) => withdrawCapForm.setData('source_id', Number(e.target.value))}
                                >
                                    {funds.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} (رصيده المتاح: {Number(f.balance).toLocaleString()} د.ع)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">صرف من مصرف</Label>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2"
                                    value={withdrawCapForm.data.source_id}
                                    onChange={(e) => withdrawCapForm.setData('source_id', Number(e.target.value))}
                                >
                                    {banks.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} (رصيده المتاح: {Number(b.balance).toLocaleString()} د.ع)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="with-cap-desc" className="text-xs font-semibold">
                                البيان <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="with-cap-desc"
                                value={withdrawCapForm.data.description}
                                onChange={(e) => withdrawCapForm.setData('description', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setWithdrawCapitalOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={withdrawCapForm.processing}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {withdrawCapForm.processing ? 'جاري التنفيذ...' : 'تأكيد استرداد رأس المال'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Distribute Profit */}
            <Dialog open={distributeProfitOpen} onOpenChange={setDistributeProfitOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <PlusCircle className="h-5 w-5" />
                            <span>إثبات وتوزيع أرباح في محفظة - {investor.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            إضافة أرباح مستحقة إلى (صندوق أرباح المستثمر) لتكون متوفرة وجاهزة للسحب لاحقاً
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDistributeProfit} className="space-y-3.5">
                        <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs space-y-1">
                            <div>رأس مال المستثمر الحالي: <strong>{Number(investor.capital_balance).toLocaleString()} د.ع</strong></div>
                            <div>النسبة المعتمدة: <strong>{investor.profit_rate}%</strong></div>
                            <div>صندوق الأرباح المتوفر حالياً: <strong className="text-emerald-600">{Number(investor.profit_balance).toLocaleString()} د.ع</strong></div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="dist-amt" className="text-xs font-semibold">
                                مبلغ الأرباح المستحقة <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dist-amt"
                                type="number"
                                step="any"
                                min="1"
                                placeholder="0.00"
                                dir="ltr"
                                className="text-lg font-mono font-bold"
                                value={distProfitForm.data.amount}
                                onChange={(e) => distProfitForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="dist-desc" className="text-xs font-semibold">
                                البيان والفترة المالية <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dist-desc"
                                placeholder="مثال: أرباح الربع الثالث لعام 2026"
                                value={distProfitForm.data.description}
                                onChange={(e) => distProfitForm.setData('description', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDistributeProfitOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={distProfitForm.processing}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {distProfitForm.processing ? 'جاري الإثبات...' : 'إثبات الأرباح في المحفظة'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Withdraw Profit */}
            <Dialog open={withdrawProfitOpen} onOpenChange={setWithdrawProfitOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <ArrowUpRight className="h-5 w-5" />
                            <span>صرف أرباح نقدية للمستثمر - {investor.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            يتم خصم المبلغ من رصيد أرباح المستثمر المتوفرة وصرفه له نقدياً من الصندوق الرئيسي أو البنك
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleWithdrawProfit} className="space-y-3.5">
                        {/* Clarity Notice */}
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                                <AlertCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span>صندوق أرباح المستثمر المتاح للسحب:</span>
                            </div>
                            <div className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {Number(investor.profit_balance).toLocaleString()} {investor.currency}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                المبلغ المسحوب يقلل رصيد أرباح المستثمر مباشرة ويتم إخراجه من الصندوق المختار.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="with-prof-amt" className="text-xs font-semibold">
                                المبلغ المراد سحبه من الأرباح <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="with-prof-amt"
                                type="number"
                                step="any"
                                min="1"
                                max={Number(investor.profit_balance)}
                                placeholder="0.00"
                                dir="ltr"
                                className="text-lg font-mono font-bold"
                                value={withdrawProfitForm.data.amount}
                                onChange={(e) => withdrawProfitForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">جهة صرف وتوريد المبلغ نقدياً للمستثمر</Label>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                    <input
                                        type="radio"
                                        name="wp_source_type"
                                        checked={withdrawProfitForm.data.source_type === 'fund'}
                                        onChange={() => {
                                            withdrawProfitForm.setData((prev) => ({
                                                ...prev,
                                                source_type: 'fund',
                                                source_id: funds[0]?.id || 1,
                                            }));
                                        }}
                                    />
                                    <span>الصندوق الرئيسي (كاش)</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                    <input
                                        type="radio"
                                        name="wp_source_type"
                                        checked={withdrawProfitForm.data.source_type === 'bank'}
                                        onChange={() => {
                                            withdrawProfitForm.setData((prev) => ({
                                                ...prev,
                                                source_type: 'bank',
                                                source_id: banks[0]?.id || 1,
                                            }));
                                        }}
                                    />
                                    <span>حساب بنكي</span>
                                </label>
                            </div>
                        </div>

                        {withdrawProfitForm.data.source_type === 'fund' ? (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">صرف من صندوق الخزينة</Label>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2"
                                    value={withdrawProfitForm.data.source_id}
                                    onChange={(e) => withdrawProfitForm.setData('source_id', Number(e.target.value))}
                                >
                                    {funds.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} (رصيده المتاح: {Number(f.balance).toLocaleString()} د.ع)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">صرف عبر تحويل بنكي من</Label>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2"
                                    value={withdrawProfitForm.data.source_id}
                                    onChange={(e) => withdrawProfitForm.setData('source_id', Number(e.target.value))}
                                >
                                    {banks.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} (رصيده المتاح: {Number(b.balance).toLocaleString()} د.ع)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="with-prof-desc" className="text-xs font-semibold">
                                البيان <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="with-prof-desc"
                                value={withdrawProfitForm.data.description}
                                onChange={(e) => withdrawProfitForm.setData('description', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setWithdrawProfitOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={withdrawProfitForm.processing}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {withdrawProfitForm.processing ? 'جاري الصرف...' : 'تأكيد صرف الأرباح نقدياً'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
