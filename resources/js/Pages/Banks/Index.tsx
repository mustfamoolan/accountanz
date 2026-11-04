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
    Landmark,
    PlusCircle,
    ArrowDownLeft,
    ArrowUpRight,
    Edit3,
    Trash2,
    Building,
    FileText,
    CheckCircle2,
    X,
} from 'lucide-react';

interface Bank {
    id: number;
    name: string;
    account_number: string;
    iban?: string;
    currency: string;
    branch?: string;
    balance: number | string;
    status: string;
    notes?: string;
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
    bank_name: string;
    creator?: { name: string };
    investor?: { name: string; code: string };
}

interface Props {
    banks: Bank[];
    selectedBank?: Bank | null;
    selectedBankId?: number | null;
    transactions: {
        data: Transaction[];
        links: any[];
        total: number;
    };
    totalBalance: number;
}

export default function BanksIndex({
    banks,
    selectedBank,
    selectedBankId,
    transactions,
    totalBalance,
}: Props) {
    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [activeBankForAction, setActiveBankForAction] = useState<Bank | null>(null);

    // Create form
    const createForm = useForm({
        name: '',
        account_number: '',
        iban: '',
        currency: 'IQD',
        branch: '',
        initial_balance: '',
        notes: '',
    });

    // Edit form
    const editForm = useForm({
        name: '',
        account_number: '',
        iban: '',
        currency: 'IQD',
        branch: '',
        notes: '',
    });

    // Bank Deposit form
    const depositForm = useForm({
        amount: '',
        description: '',
    });

    // Bank Withdraw form
    const withdrawForm = useForm({
        amount: '',
        description: '',
    });

    const filterByBank = (bankId: number | null) => {
        router.get('/banks', bankId ? { bank_id: bankId } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openEdit = (bank: Bank, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveBankForAction(bank);
        editForm.setData({
            name: bank.name,
            account_number: bank.account_number,
            iban: bank.iban || '',
            currency: bank.currency,
            branch: bank.branch || '',
            notes: bank.notes || '',
        });
        setEditOpen(true);
    };

    const openDeposit = (bank: Bank, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveBankForAction(bank);
        depositForm.reset();
        setDepositOpen(true);
    };

    const openWithdraw = (bank: Bank, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveBankForAction(bank);
        withdrawForm.reset();
        setWithdrawOpen(true);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post('/banks', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!activeBankForAction) return;
        editForm.put(`/banks/${activeBankForAction.id}`, {
            onSuccess: () => {
                setEditOpen(false);
            },
        });
    };

    const handleDelete = (bank: Bank, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`هل أنت متأكد من حذف الحساب البنكي [${bank.name}]؟`)) {
            router.delete(`/banks/${bank.id}`);
        }
    };

    const handleDeposit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!activeBankForAction) return;
        depositForm.post(`/banks/${activeBankForAction.id}/deposit`, {
            onSuccess: () => {
                setDepositOpen(false);
                depositForm.reset();
            },
        });
    };

    const handleWithdraw: FormEventHandler = (e) => {
        e.preventDefault();
        if (!activeBankForAction) return;
        withdrawForm.post(`/banks/${activeBankForAction.id}/withdraw`, {
            onSuccess: () => {
                setWithdrawOpen(false);
                withdrawForm.reset();
            },
        });
    };

    // Table Columns definition for DataGrid
    const columns: Column<Transaction>[] = [
        {
            header: 'رقم المرجع',
            accessorKey: 'reference_no',
            className: 'font-mono font-bold text-xs text-primary whitespace-nowrap',
        },
        {
            header: 'المصرف / الحساب',
            cell: (tx) => (
                <div className="flex items-center gap-1.5 font-bold text-xs whitespace-nowrap text-foreground">
                    <Landmark className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>{tx.bank_name || '-'}</span>
                </div>
            ),
        },
        {
            header: 'نوع الحركة',
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

    // Mobile Card Renderer for DataGrid
    const renderMobileCard = (tx: Transaction) => (
        <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{tx.reference_no}</span>
                <TransactionBadge type={tx.type} />
            </div>
            <div className="flex justify-between items-center font-semibold text-foreground">
                <div className="flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>{tx.bank_name || '-'}</span>
                </div>
                <MoneyDisplay amount={tx.amount} currency={tx.currency} size="md" />
            </div>
            <p className="text-muted-foreground text-[11px] line-clamp-2">{tx.description}</p>
            {tx.investor && (
                <div className="text-[10px] text-muted-foreground">
                    المستثمر: <strong className="text-primary">{tx.investor.name}</strong>
                </div>
            )}
            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                <span>الرصيد بعد: <strong className="font-mono">{Number(tx.balance_after).toLocaleString()} {tx.currency}</strong></span>
                <span dir="ltr">{new Date(tx.transaction_date).toLocaleDateString('ar-IQ')}</span>
            </div>
        </div>
    );

    // Filter items for FilterBar
    const filterItems = [
        { id: null, label: 'جميع المصارف', count: banks.length },
        ...banks.map((b) => ({
            id: b.id,
            label: b.name,
            badge: (
                <span className="font-mono text-[10px] text-primary">
                    {Number(b.balance).toLocaleString()} {b.currency}
                </span>
            ),
        })),
    ];

    return (
        <AuthenticatedLayout header="إدارة البنوك والمصارف" activeNav="banks">
            <Head title="البنوك والمصارف" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Unified PageHeader */}
                <PageHeader
                    title="الحسابات البنكية والمصرفية"
                    description={`إجمالي الأرصدة المودعة في البنوك: ${Number(totalBalance).toLocaleString()} د.ع`}
                    icon={Landmark}
                    badge={
                        <Badge variant="secondary" className="font-mono text-xs">
                            {banks.length} مصرف
                        </Badge>
                    }
                    actions={
                        <>
                            {selectedBankId && (
                                <Button
                                    variant="outline"
                                    onClick={() => filterByBank(null)}
                                    className="gap-1 text-xs border-primary/40 text-primary h-9"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>إلغاء الفلترة (عرض الكل)</span>
                                </Button>
                            )}
                            <Button onClick={() => setCreateOpen(true)} className="gap-1.5 h-9 text-xs">
                                <PlusCircle className="h-4 w-4" />
                                <span>إضافة حساب بنكي جديد</span>
                            </Button>
                        </>
                    }
                />

                {/* 2. Responsive Filter Bar */}
                <FilterBar
                    title="تصفية حسب المصرف:"
                    items={filterItems}
                    selectedId={selectedBankId ?? null}
                    onSelect={(id) => filterByBank(id)}
                    onClear={() => filterByBank(null)}
                />

                {/* 3. Bank Cards Grid - Compact & Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {banks.map((bank) => {
                        const isSelected = selectedBankId === bank.id;
                        return (
                            <Card
                                key={bank.id}
                                onClick={() => filterByBank(isSelected ? null : bank.id)}
                                className={`shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden p-3.5 sm:p-4 ${
                                    isSelected
                                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                                        : 'hover:border-primary/40'
                                }`}
                            >
                                <div
                                    className={`absolute top-0 right-0 left-0 h-1 ${
                                        isSelected ? 'bg-primary' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                                    }`}
                                />

                                {/* Compact Header */}
                                <div className="flex items-start justify-between gap-2 pt-0.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className={`p-1.5 rounded-lg shrink-0 ${
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50'
                                            }`}
                                        >
                                            <Landmark className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-foreground truncate">
                                                {bank.name}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Building className="h-2.5 w-2.5 shrink-0" />
                                                <span className="truncate">{bank.branch || 'الفرع الرئيسي'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {isSelected && (
                                            <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 h-4">
                                                محدد
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4">
                                            {bank.currency}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Compact Balance & Account Info */}
                                <div className="flex items-end justify-between gap-2 mt-2.5 pt-2 border-t border-border/50">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground">الرصيد المتاح</div>
                                        <div className="font-mono font-bold text-base sm:text-lg text-foreground tracking-tight">
                                            <MoneyDisplay amount={bank.balance} currency={bank.currency} size="md" />
                                        </div>
                                    </div>

                                    <div className="text-left font-mono text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40 shrink-0" dir="ltr">
                                        {bank.account_number}
                                    </div>
                                </div>

                                {/* Compact Action Bar */}
                                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/60">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => openDeposit(bank, e)}
                                        className="flex-1 text-[11px] h-7 px-2 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                    >
                                        <ArrowDownLeft className="h-3 w-3" />
                                        <span>إيداع</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => openWithdraw(bank, e)}
                                        className="flex-1 text-[11px] h-7 px-2 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    >
                                        <ArrowUpRight className="h-3 w-3" />
                                        <span>سحب</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => openEdit(bank, e)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                                        title="تعديل الحساب"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => handleDelete(bank, e)}
                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                        title="حذف الحساب"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* 4. Unified DataGrid for Bank Ledger */}
                <DataGrid<Transaction>
                    title={selectedBank ? `سجل حركات مصرف (${selectedBank.name})` : 'سجل الحركات المصرفية العام'}
                    description="موضحاً فيه اسم المصرف ونوع العملية والمبالغ وتفاصيل التتبع"
                    icon={FileText}
                    columns={columns}
                    data={transactions.data}
                    total={transactions.total}
                    links={transactions.links}
                    renderMobileCard={renderMobileCard}
                    emptyMessage={selectedBank ? `لا توجد حركات مسجلة لمصرف ${selectedBank.name} بعد.` : 'لا توجد حركات مصرفية مسجلة بعد.'}
                    headerActions={
                        selectedBank ? (
                            <Badge variant="outline" className="text-xs border-primary text-primary">
                                فلتر نشط: {selectedBank.name}
                            </Badge>
                        ) : undefined
                    }
                />
            </div>

            {/* Modal: Add Bank Account */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Landmark className="h-5 w-5 text-primary" />
                            <span>إضافة حساب مصرفي جديد</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            سجل بيانات الحساب البنكي ليتم إدراجه ضمن حركة السيولة والتحويلات
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-name" className="text-xs font-semibold">
                                اسم البنك / الحساب <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="create-name"
                                placeholder="مثال: مصرف الرافدين - الحساب التجاري"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-acc" className="text-xs font-semibold">
                                    رقم الحساب <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="create-acc"
                                    placeholder="001-234567-89"
                                    dir="ltr"
                                    className="font-mono"
                                    value={createForm.data.account_number}
                                    onChange={(e) => createForm.setData('account_number', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="create-branch" className="text-xs font-semibold">
                                    اسم الفرع
                                </Label>
                                <Input
                                    id="create-branch"
                                    placeholder="الكرادة / المنصور"
                                    value={createForm.data.branch}
                                    onChange={(e) => createForm.setData('branch', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-iban" className="text-xs font-semibold">
                                رقم الآيبان (IBAN)
                            </Label>
                            <Input
                                id="create-iban"
                                placeholder="IQ00BKIQ00000000000000"
                                dir="ltr"
                                className="font-mono text-xs"
                                value={createForm.data.iban}
                                onChange={(e) => createForm.setData('iban', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-bal" className="text-xs font-semibold">
                                    الرصيد الافتتاحي
                                </Label>
                                <Input
                                    id="create-bal"
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    dir="ltr"
                                    className="font-mono"
                                    value={createForm.data.initial_balance}
                                    onChange={(e) => createForm.setData('initial_balance', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">عملة الحساب المصرفي</Label>
                                <select
                                    className="w-full text-xs rounded-md border border-input bg-background p-2"
                                    value={createForm.data.currency}
                                    onChange={(e) => createForm.setData('currency', e.target.value)}
                                >
                                    <option value="IQD">دينار عراقي (IQD)</option>
                                    <option value="USD">دولار أمريكي (USD $)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-notes" className="text-xs font-semibold">ملاحظات إضافية</Label>
                            <Input
                                id="create-notes"
                                placeholder="أي تفاصيل خاصة بالحساب"
                                value={createForm.data.notes}
                                onChange={(e) => createForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'جاري الحفظ...' : 'حفظ الحساب البنكي'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Bank Account */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-primary" />
                            <span>تعديل بيانات المصرف</span>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name" className="text-xs font-semibold">
                                اسم البنك / الحساب <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-acc" className="text-xs font-semibold">
                                    رقم الحساب <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="edit-acc"
                                    dir="ltr"
                                    className="font-mono"
                                    value={editForm.data.account_number}
                                    onChange={(e) => editForm.setData('account_number', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-branch" className="text-xs font-semibold">
                                    اسم الفرع
                                </Label>
                                <Input
                                    id="edit-branch"
                                    value={editForm.data.branch}
                                    onChange={(e) => editForm.setData('branch', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-iban" className="text-xs font-semibold">
                                رقم الآيبان (IBAN)
                            </Label>
                            <Input
                                id="edit-iban"
                                dir="ltr"
                                className="font-mono text-xs"
                                value={editForm.data.iban}
                                onChange={(e) => editForm.setData('iban', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-notes" className="text-xs font-semibold">ملاحظات</Label>
                            <Input
                                id="edit-notes"
                                value={editForm.data.notes}
                                onChange={(e) => editForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'جاري التعديل...' : 'تحديث البيانات'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Bank Deposit */}
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <ArrowDownLeft className="h-5 w-5" />
                            <span>إيداع بنكي مباشر - {activeBankForAction?.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            إيداع مالي يزيد من رصيد المصرف ويسجل في كشف الحساب
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDeposit} className="space-y-3.5">
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                            الرصيد الحالي بالمصرف: <strong>{Number(activeBankForAction?.balance || 0).toLocaleString()} {activeBankForAction?.currency}</strong>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="dep-amount" className="text-xs font-semibold">
                                المبلغ المراد إيداعه <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dep-amount"
                                type="number"
                                step="any"
                                min="1"
                                placeholder="0.00"
                                dir="ltr"
                                className="text-lg font-mono font-bold"
                                value={depositForm.data.amount}
                                onChange={(e) => depositForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="dep-desc" className="text-xs font-semibold">
                                البيان / سبب الإيداع <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dep-desc"
                                placeholder="مثال: إيداع شيك / إيداع نقدي مباشر في الفرع"
                                value={depositForm.data.description}
                                onChange={(e) => depositForm.setData('description', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDepositOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={depositForm.processing}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {depositForm.processing ? 'جاري التنفيذ...' : 'تأكيد الإيداع البنكي'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Bank Withdraw */}
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <ArrowUpRight className="h-5 w-5" />
                            <span>سحب بنكي مباشر - {activeBankForAction?.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            سحب مالي يخصم من رصيد المصرف ويسجل في كشف الحساب
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleWithdraw} className="space-y-3.5">
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400">
                            الرصيد المتاح للسحب: <strong>{Number(activeBankForAction?.balance || 0).toLocaleString()} {activeBankForAction?.currency}</strong>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="with-amount" className="text-xs font-semibold">
                                المبلغ المراد سحبه <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="with-amount"
                                type="number"
                                step="any"
                                min="1"
                                placeholder="0.00"
                                dir="ltr"
                                className="text-lg font-mono font-bold"
                                value={withdrawForm.data.amount}
                                onChange={(e) => withdrawForm.setData('amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="with-desc" className="text-xs font-semibold">
                                البيان / سبب السحب <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="with-desc"
                                placeholder="مثال: سحب نقدي عبر الصراف / عمولة بنكية"
                                value={withdrawForm.data.description}
                                onChange={(e) => withdrawForm.setData('description', e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={withdrawForm.processing}
                                variant="destructive"
                            >
                                {withdrawForm.processing ? 'جاري التنفيذ...' : 'تأكيد السحب البنكي'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
