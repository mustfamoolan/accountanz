import { useState, FormEventHandler } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    PageHeader,
    StatCard,
    StatGrid,
    DataGrid,
    Column,
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
    TrendingUp,
    Users,
    PlusCircle,
    Eye,
    Edit3,
    Wallet,
    PiggyBank,
    ArrowUpRight,
    Phone,
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
    transactions_count?: number;
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

interface Props {
    investors: Investor[];
    funds: Fund[];
    banks: Bank[];
    stats: {
        totalCapital: number;
        totalProfits: number;
        totalWithdrawnCapital: number;
        totalWithdrawnProfits: number;
        investorsCount: number;
    };
}

export default function InvestorsIndex({ investors, funds, banks, stats }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

    // Create form
    const createForm = useForm({
        name: '',
        phone: '',
        currency: 'IQD',
        profit_rate: '0',
        initial_capital: '',
        target_type: 'fund',
        target_id: funds[0]?.id || '',
        notes: '',
    });

    // Edit form
    const editForm = useForm({
        name: '',
        phone: '',
        profit_rate: '0',
        status: 'active',
        notes: '',
    });

    const openEdit = (inv: Investor) => {
        setSelectedInvestor(inv);
        editForm.setData({
            name: inv.name,
            phone: inv.phone || '',
            profit_rate: String(inv.profit_rate || 0),
            status: inv.status,
            notes: '',
        });
        setEditOpen(true);
    };

    const handleCreate: FormEventHandler = (e) => {
        e.preventDefault();
        createForm.post('/investors', {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedInvestor) return;
        editForm.put(`/investors/${selectedInvestor.id}`, {
            onSuccess: () => {
                setEditOpen(false);
            },
        });
    };

    // Table Columns definition for DataGrid
    const columns: Column<Investor>[] = [
        {
            header: 'الكود',
            accessorKey: 'code',
            className: 'font-mono font-bold text-xs text-primary whitespace-nowrap',
        },
        {
            header: 'اسم المستثمر',
            cell: (inv) => (
                <Link
                    href={`/investors/${inv.id}`}
                    className="font-semibold text-foreground hover:underline hover:text-primary transition-colors text-xs whitespace-nowrap"
                >
                    {inv.name}
                </Link>
            ),
        },
        {
            header: 'رقم الهاتف',
            cell: (inv) => (
                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {inv.phone || '-'}
                </span>
            ),
        },
        {
            header: 'رأس المال الحالي',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay amount={inv.capital_balance} currency={inv.currency} size="sm" variant="purple" />
            ),
        },
        {
            header: 'الأرباح المتوفرة',
            align: 'left',
            cell: (inv) => (
                <MoneyDisplay amount={inv.profit_balance} currency={inv.currency} size="sm" variant="emerald" />
            ),
        },
        {
            header: 'إجمالي المستحقات',
            align: 'left',
            cell: (inv) => {
                const totalEquity = Number(inv.capital_balance) + Number(inv.profit_balance);
                return <MoneyDisplay amount={totalEquity} currency={inv.currency} size="sm" variant="default" />;
            },
        },
        {
            header: 'النسبة',
            align: 'center',
            cell: (inv) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {Number(inv.profit_rate) > 0 ? `${inv.profit_rate}%` : '-'}
                </span>
            ),
        },
        {
            header: 'الحالة',
            align: 'center',
            cell: (inv) => (
                <Badge
                    variant={inv.status === 'active' ? 'default' : 'secondary'}
                    className="text-[10px]"
                >
                    {inv.status === 'active' ? 'نشط' : 'متوقف'}
                </Badge>
            ),
        },
        {
            header: 'الإجراءات',
            align: 'center',
            cell: (inv) => (
                <div className="flex items-center justify-center gap-1">
                    <Link href={`/investors/${inv.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" />
                            <span>كشف الحساب</span>
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(inv)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="تعديل"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    // Mobile Card Renderer for DataGrid
    const renderMobileCard = (inv: Investor) => {
        const totalEquity = Number(inv.capital_balance) + Number(inv.profit_balance);
        return (
            <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{inv.code}</span>
                        <Link
                            href={`/investors/${inv.id}`}
                            className="font-bold text-foreground hover:underline text-sm"
                        >
                            {inv.name}
                        </Link>
                    </div>
                    <Badge
                        variant={inv.status === 'active' ? 'default' : 'secondary'}
                        className="text-[10px]"
                    >
                        {inv.status === 'active' ? 'نشط' : 'متوقف'}
                    </Badge>
                </div>

                {inv.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono">{inv.phone}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <div className="text-[10px] text-muted-foreground">رأس المال النشط</div>
                        <MoneyDisplay amount={inv.capital_balance} currency={inv.currency} size="sm" variant="purple" />
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="text-[10px] text-muted-foreground">صندوق الأرباح</div>
                        <MoneyDisplay amount={inv.profit_balance} currency={inv.currency} size="sm" variant="emerald" />
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">إجمالي المستحقات:</span>
                    <MoneyDisplay amount={totalEquity} currency={inv.currency} size="sm" variant="default" />
                </div>

                <div className="flex items-center gap-2 pt-1">
                    <Link href={`/investors/${inv.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            <span>كشف الحساب والعمليات</span>
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(inv)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <Edit3 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout header="إدارة المستثمرين ورؤوس الأموال" activeNav="investors">
            <Head title="المستثمرين ورؤوس الأموال" />

            <div className="space-y-6" dir="rtl">
                {/* 1. Unified PageHeader */}
                <PageHeader
                    title="المستثمرون وصناديق الأرباح"
                    description="إدارة رؤوس أموال الشركاء والمستثمرين، حصص الأرباح، وسجل السحب والإيداع المنفصل لكل مستثمر"
                    icon={Users}
                    badge={
                        <Badge variant="secondary" className="font-mono text-xs">
                            {stats.investorsCount} مستثمر
                        </Badge>
                    }
                    actions={
                        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 h-9 text-xs">
                            <PlusCircle className="h-4 w-4" />
                            <span>إضافة مستثمر جديد</span>
                        </Button>
                    }
                />

                {/* 2. Unified Financial StatGrid */}
                <StatGrid columns={4}>
                    <StatCard
                        title="إجمالي رؤوس أموال المستثمرين"
                        value={stats.totalCapital}
                        color="purple"
                        icon={PiggyBank}
                        description="رأس المال النشط قيد التشغيل"
                    />

                    <StatCard
                        title="صندوق أرباح المستثمرين المتوفرة"
                        value={stats.totalProfits}
                        color="emerald"
                        icon={TrendingUp}
                        description="أرباح مستحقة لم تسحب بعد"
                    />

                    <StatCard
                        title="إجمالي الأرباح المسحوبة"
                        value={stats.totalWithdrawnProfits}
                        color="amber"
                        icon={ArrowUpRight}
                        description="أرباح تم استلامها نقدياً"
                    />

                    <StatCard
                        title="رأس المال المسترد سابقاً"
                        value={stats.totalWithdrawnCapital}
                        color="blue"
                        icon={Wallet}
                        description="مبالغ رأس مال سحبت تاريخياً"
                    />
                </StatGrid>

                {/* 3. Unified DataGrid for Investors */}
                <DataGrid<Investor>
                    title="قائمة المستثمرين ومحافظهم المالية"
                    description="اضغط على (كشف الحساب) للدخول إلى صندوق المستثمر وعمليات السحب والإيداع الخاصة به"
                    icon={Users}
                    columns={columns}
                    data={investors}
                    total={investors.length}
                    renderMobileCard={renderMobileCard}
                    emptyMessage="لا يوجد مستثمرون مسجلون حالياً. اضغط على 'إضافة مستثمر جديد' للبدء."
                />
            </div>

            {/* Modal: Add Investor */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-primary" />
                            <span>تسجيل مستثمر وشريك جديد</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            أدخل بيانات المستثمر ورأس المال المودع لإنشاء محفظته وحساباته
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="create-name" className="text-xs font-semibold">
                                اسم المستثمر الكامل <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="create-name"
                                placeholder="مثال: أحمد عبد الله"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-phone" className="text-xs font-semibold">
                                    رقم الهاتف
                                </Label>
                                <Input
                                    id="create-phone"
                                    placeholder="07XXXXXXXXX"
                                    dir="ltr"
                                    className="font-mono text-xs"
                                    value={createForm.data.phone}
                                    onChange={(e) => createForm.setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="create-rate" className="text-xs font-semibold">
                                    نسبة الربح المتفق عليها (%)
                                </Label>
                                <Input
                                    id="create-rate"
                                    type="number"
                                    step="0.1"
                                    placeholder="0"
                                    dir="ltr"
                                    className="font-mono text-xs"
                                    value={createForm.data.profit_rate}
                                    onChange={(e) => createForm.setData('profit_rate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-capital" className="text-xs font-semibold">
                                رأس المال الافتتاحي المودع
                            </Label>
                            <Input
                                id="create-capital"
                                type="number"
                                step="any"
                                placeholder="0"
                                dir="ltr"
                                className="font-mono text-base font-bold"
                                value={createForm.data.initial_capital}
                                onChange={(e) => createForm.setData('initial_capital', e.target.value)}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                اتركها 0 إذا لم يتم إيداع رأس المال بعد
                            </p>
                        </div>

                        {Number(createForm.data.initial_capital) > 0 && (
                            <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-2 text-xs">
                                <div className="font-semibold text-foreground">
                                    مكان توريد رأس المال نقدياً:
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                        <input
                                            type="radio"
                                            name="target_type"
                                            value="fund"
                                            checked={createForm.data.target_type === 'fund'}
                                            onChange={() => {
                                                createForm.setData((prev) => ({
                                                    ...prev,
                                                    target_type: 'fund',
                                                    target_id: funds[0]?.id || '',
                                                }));
                                            }}
                                        />
                                        <span>الصندوق الرئيسي (كاش)</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-2 rounded border border-border bg-background cursor-pointer">
                                        <input
                                            type="radio"
                                            name="target_type"
                                            value="bank"
                                            checked={createForm.data.target_type === 'bank'}
                                            onChange={() => {
                                                createForm.setData((prev) => ({
                                                    ...prev,
                                                    target_type: 'bank',
                                                    target_id: banks[0]?.id || '',
                                                }));
                                            }}
                                        />
                                        <span>حساب بنكي</span>
                                    </label>
                                </div>

                                {createForm.data.target_type === 'bank' && (
                                    <div className="pt-1">
                                        <select
                                            className="w-full text-xs rounded-md border border-input bg-background p-2"
                                            value={createForm.data.target_id}
                                            onChange={(e) => createForm.setData('target_id', e.target.value)}
                                        >
                                            {banks.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name} (رصيده: {Number(b.balance).toLocaleString()} د.ع)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="create-notes" className="text-xs font-semibold">ملاحظات إضافية</Label>
                            <Input
                                id="create-notes"
                                placeholder="ملاحظات حول الشراكة أو بنود الاتفاق"
                                value={createForm.data.notes}
                                onChange={(e) => createForm.setData('notes', e.target.value)}
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'جاري التسجيل...' : 'تسجيل المستثمر'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: Edit Investor */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit3 className="h-5 w-5 text-primary" />
                            <span>تعديل بيانات المستثمر</span>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="space-y-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name" className="text-xs font-semibold">
                                اسم المستثمر <span className="text-destructive">*</span>
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
                                <Label htmlFor="edit-phone" className="text-xs font-semibold">
                                    رقم الهاتف
                                </Label>
                                <Input
                                    id="edit-phone"
                                    dir="ltr"
                                    className="font-mono text-xs"
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-rate" className="text-xs font-semibold">
                                    نسبة الربح (%)
                                </Label>
                                <Input
                                    id="edit-rate"
                                    type="number"
                                    step="0.1"
                                    dir="ltr"
                                    className="font-mono text-xs"
                                    value={editForm.data.profit_rate}
                                    onChange={(e) => editForm.setData('profit_rate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">حالة الحساب</Label>
                            <select
                                className="w-full text-xs rounded-md border border-input bg-background p-2"
                                value={editForm.data.status}
                                onChange={(e) => editForm.setData('status', e.target.value)}
                            >
                                <option value="active">نشط (فعال)</option>
                                <option value="inactive">متوقف مؤقتاً</option>
                            </select>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'جاري التعديل...' : 'حفظ التعديلات'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
