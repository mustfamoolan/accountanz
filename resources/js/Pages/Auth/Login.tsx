import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Lock, User as UserIcon, ArrowLeft, Shield, Calculator, TrendingUp } from 'lucide-react';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    // Fast credentials fill for testing roles
    const fillRole = (roleUser: string) => {
        setData((prev) => ({
            ...prev,
            username: roleUser,
            password: 'password',
        }));
    };

    return (
        <>
            <Head title="تسجيل الدخول - نظام المحاسبة" />
            <div
                className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-muted/30 to-background px-4 py-8"
                dir="rtl"
            >
                {/* Brand Header */}
                <div className="mb-6 flex flex-col items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md ring-4 ring-primary/10">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">نظام الزبيدي المحاسبي</h1>
                        <p className="text-sm text-muted-foreground mt-1">منظومة الإدارة المالية والمحاسبية المتكاملة</p>
                    </div>
                </div>

                {/* Login Card */}
                <Card className="w-full max-w-md shadow-lg border-border/80">
                    <CardHeader className="space-y-1 text-center pb-5">
                        <CardTitle className="text-xl font-bold">تسجيل الدخول</CardTitle>
                        <CardDescription className="text-xs">
                            أدخل اسم المستخدم وكلمة المرور للوصول إلى النظام
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {status && (
                            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-right">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4 text-right">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <Label htmlFor="username" className="text-xs font-semibold">اسم المستخدم</Label>
                                <div className="relative">
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="admin"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        autoComplete="username"
                                        dir="ltr"
                                        required
                                        className="text-left font-mono pr-3 pl-9 h-10"
                                    />
                                    <UserIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                                </div>
                                {errors.username && (
                                    <p className="text-xs text-destructive font-medium mt-1">{errors.username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-semibold">كلمة المرور</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        dir="ltr"
                                        required
                                        className="text-left font-mono pr-3 pl-9 h-10"
                                    />
                                    <Lock className="h-4 w-4 absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-destructive font-medium mt-1">{errors.password}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full h-10 font-bold mt-2 gap-2" disabled={processing}>
                                {processing ? 'جاري التحقق...' : (
                                    <>
                                        <span>تسجيل الدخول</span>
                                        <ArrowLeft className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                    </CardContent>
                </Card>

                {/* Footer note */}
                <div className="mt-6 text-center text-xs text-muted-foreground">
                    &copy; 2026 ZUPIDY ERP &bull; نظام إدارة
                </div>
            </div>
        </>
    );
}
