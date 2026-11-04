import { useState, ReactNode } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    LayoutDashboard,
    BookOpen,
    Receipt,
    FileSpreadsheet,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Building2,
    Shield,
    Calculator,
    TrendingUp,
    Wallet,
    Phone,
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

interface AuthenticatedProps {
    children: ReactNode;
    header?: ReactNode;
    activeNav?: string;
}

export default function AuthenticatedLayout({ children, header, activeNav = 'dashboard' }: AuthenticatedProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user || {
        id: 1,
        name: 'مستخدم النظام',
        username: 'user',
        role: 'admin',
    };

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        router.post('/logout');
    };

    // Role configuration (Titles, Badges, Icons)
    const roleConfig = {
        admin: {
            title: 'مدير النظام (أدمن)',
            shortTitle: 'أدمن',
            icon: Shield,
            badgeClass: 'bg-primary/10 text-primary border-primary/20',
        },
        accountant: {
            title: 'محاسب مالي',
            shortTitle: 'محاسب',
            icon: Calculator,
            badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        },
        investor: {
            title: 'مستثمر',
            shortTitle: 'مستثمر',
            icon: TrendingUp,
            badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
        },
    }[user.role] || {
        title: 'مستخدم',
        shortTitle: 'مستخدم',
        icon: Shield,
        badgeClass: 'bg-muted text-muted-foreground',
    };

    const RoleIcon = roleConfig.icon;

    // Navigation items - active modules only
    const navItems = [
        {
            key: 'dashboard',
            label: 'لوحة التحكم',
            href: '/dashboard',
            icon: LayoutDashboard,
            roles: ['admin', 'accountant', 'investor'],
        },
        {
            key: 'treasury',
            label: 'الخزنة',
            href: '/treasury',
            icon: Wallet,
            roles: ['admin', 'accountant'],
        },
        {
            key: 'inventories',
            label: 'الجرد والميزانية',
            href: '/inventories',
            icon: FileSpreadsheet,
            roles: ['admin', 'accountant'],
        },
        {
            key: 'investors',
            label: 'المستثمرون ورؤوس الأموال',
            href: '/investors',
            icon: TrendingUp,
            roles: ['admin', 'accountant', 'investor'],
        },
    ].filter(item => item.roles.includes(user.role));

    const SidebarContent = () => (
        <>
            {/* Logo & System Brand */}
            <div className="flex h-16 items-center border-b border-border px-5 gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Building2 className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight">نظام زوبيدي المحاسبي</span>
                    <span className="text-[11px] text-muted-foreground">إدارة الحسابات والمالية</span>
                </div>
            </div>

            {/* Current Role Banner */}
            <div className="px-4 pt-3 pb-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-background border border-border/80">
                            <RoleIcon className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold leading-none">{roleConfig.title}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">@{user.username}</div>
                        </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${roleConfig.badgeClass}`}>
                        {roleConfig.shortTitle}
                    </Badge>
                </div>
            </div>

            {/* Navigation links */}
            <div className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
                <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                    القوائم المتاحة
                </p>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.key;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* User footer */}
            <div className="border-t border-border p-3">
                <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="text-xs font-bold bg-secondary text-secondary-foreground">
                            {user.name ? user.name.charAt(0) : 'م'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-semibold truncate leading-snug">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            {user.phone ? (
                                <span className="font-mono text-[11px]">{user.phone}</span>
                            ) : (
                                <span>{roleConfig.shortTitle}</span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="تسجيل الخروج"
                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-muted/20" dir="rtl">
            {/* Desktop Sidebar (Right side for RTL) */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 lg:w-64 border-l border-border bg-background z-20 shadow-sm">
                <SidebarContent />
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar (Right drawer for RTL) */}
            <aside
                className={`fixed inset-y-0 right-0 z-40 w-72 flex flex-col border-l border-border bg-background shadow-xl transform transition-transform duration-200 ease-in-out lg:hidden ${
                    sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex h-14 items-center justify-between border-b border-border px-4">
                    <span className="font-bold text-sm">القائمة الرئيسية</span>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <SidebarContent />
                </div>
            </aside>

            {/* Main content wrapper */}
            <div className="flex flex-1 flex-col min-w-0 lg:pr-64">
                {/* Top header */}
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu hamburger button */}
                        <button
                            className="lg:hidden p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="فتح القائمة"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {/* Breadcrumb / Title */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">الرئيسية</span>
                            {header && (
                                <>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-semibold text-foreground">{header}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`hidden sm:flex items-center gap-1.5 text-xs py-1 ${roleConfig.badgeClass}`}>
                            <RoleIcon className="h-3.5 w-3.5" />
                            <span>{roleConfig.title}</span>
                        </Badge>

                        <div className="flex items-center gap-2 border-r border-border pr-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-semibold leading-none">{user.name}</p>
                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                    @{user.username}
                                </p>
                            </div>
                            <Avatar className="h-8 w-8 border border-border">
                                <AvatarFallback className="text-xs bg-muted font-bold">
                                    {user.name ? user.name.charAt(0) : 'م'}
                                </AvatarFallback>
                            </Avatar>

                            <button
                                onClick={handleLogout}
                                title="تسجيل الخروج"
                                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page body */}
                <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
                    {children}
                </main>
            </div>

            <Toaster position="top-center" dir="rtl" />
        </div>
    );
}
