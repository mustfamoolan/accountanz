<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\PeriodicInventoryController;
use App\Http\Controllers\TreasuryController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing / Root redirect
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

// Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Protected Routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        $vaultIqd = \App\Models\Fund::where('code', 'VAULT-IQD')->first();
        $vaultUsd = \App\Models\Fund::where('code', 'VAULT-USD')->first();

        $balanceIqd = (float) ($vaultIqd?->balance ?? 0);
        $balanceUsd = (float) ($vaultUsd?->balance ?? 0);
        $totalInvestorsCapital = (float) \App\Models\Investor::sum('capital_balance');
        $totalInvestorsProfit = (float) \App\Models\Investor::sum('profit_balance');

        $vaultIds = array_filter([$vaultIqd?->id, $vaultUsd?->id]);

        $recentTransactions = \App\Models\TreasuryTransaction::with(['creator'])
            ->where(function ($q) use ($vaultIds) {
                if (!empty($vaultIds)) {
                    $q->where(function ($sub) use ($vaultIds) {
                        $sub->where('source_type', \App\Models\Fund::class)->whereIn('source_id', $vaultIds);
                    })->orWhere(function ($sub) use ($vaultIds) {
                        $sub->where('destination_type', \App\Models\Fund::class)->whereIn('destination_id', $vaultIds);
                    });
                }
            })
            ->whereIn('type', ['deposit', 'withdrawal'])
            ->latest('transaction_date')
            ->take(6)
            ->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'vaultBalanceIqd' => $balanceIqd,
                'vaultBalanceUsd' => $balanceUsd,
                'totalCash' => $balanceIqd,
                'totalBanks' => 0,
                'totalLiquidity' => $balanceIqd,
                'totalInvestorsCapital' => $totalInvestorsCapital,
                'totalInvestorsProfit' => $totalInvestorsProfit,
            ],
            'recentTransactions' => $recentTransactions,
        ]);
    })->name('dashboard');

    // The Vault (الخزنة) - Strictly Independent
    Route::get('/treasury', [TreasuryController::class, 'index'])->name('treasury.index');
    Route::post('/treasury/deposit', [TreasuryController::class, 'deposit'])->name('treasury.deposit');
    Route::post('/treasury/withdraw', [TreasuryController::class, 'withdraw'])->name('treasury.withdraw');

    // Investors Management (المستثمرون)
    Route::get('/investors', [InvestorController::class, 'index'])->name('investors.index');
    Route::post('/investors', [InvestorController::class, 'store'])->name('investors.store');
    Route::get('/investors/{investor}', [InvestorController::class, 'show'])->name('investors.show');
    Route::put('/investors/{investor}', [InvestorController::class, 'update'])->name('investors.update');
    Route::delete('/investors/{investor}', [InvestorController::class, 'destroy'])->name('investors.destroy');
    Route::post('/investors/{investor}/deposit-capital', [InvestorController::class, 'depositCapital'])->name('investors.deposit-capital');
    Route::post('/investors/{investor}/withdraw-capital', [InvestorController::class, 'withdrawCapital'])->name('investors.withdraw-capital');
    Route::post('/investors/{investor}/distribute-profit', [InvestorController::class, 'distributeProfit'])->name('investors.distribute-profit');
    Route::post('/investors/{investor}/withdraw-profit', [InvestorController::class, 'withdrawProfit'])->name('investors.withdraw-profit');

    // Periodic Inventories & Balance Sheet (الجرد والميزانية)
    Route::get('/inventories', [PeriodicInventoryController::class, 'index'])->name('inventories.index');
    Route::get('/inventories/create', [PeriodicInventoryController::class, 'create'])->name('inventories.create');
    Route::post('/inventories', [PeriodicInventoryController::class, 'store'])->name('inventories.store');
    Route::get('/inventories/{inventory}', [PeriodicInventoryController::class, 'show'])->name('inventories.show');
    Route::delete('/inventories/{inventory}', [PeriodicInventoryController::class, 'destroy'])->name('inventories.destroy');
});
