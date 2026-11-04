<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * Show login form.
     */
    public function showLoginForm()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'username.required' => 'حقل اسم المستخدم مطلوب.',
            'password.required' => 'حقل كلمة المرور مطلوب.',
        ]);

        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            return back()->withErrors([
                'username' => 'اسم المستخدم أو كلمة المرور غير صحيحة.',
            ])->onlyInput('username');
        }

        $request->session()->regenerate();

        $user = Auth::user();

        // التوجيه الذكي بحسب الرول (Role-based direction)
        // يمكن تخصيص مسار لكل رول لاحقاً:
        // switch ($user->role) {
        //     case 'admin': return redirect()->intended(route('admin.dashboard'));
        //     case 'accountant': return redirect()->intended(route('accountant.dashboard'));
        //     case 'investor': return redirect()->intended(route('investor.dashboard'));
        // }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}

