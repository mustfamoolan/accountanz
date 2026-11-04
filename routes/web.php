<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BankController;
use App\Http\Controllers\InvestorController;
use App\Http\Controllers\InvoiceController;
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
        $totalCash = \App\Models\Fund::sum('balance');
        $totalBanks = \App\Models\Bank::sum('balance');
        $totalInvestorsCapital = \App\Models\Investor::sum('capital_balance');
        $totalInvestorsProfit = \App\Models\Investor::sum('profit_balance');
        $recentTransactions = \App\Models\TreasuryTransaction::with(['creator', 'investor'])
            ->latest('transaction_date')
            ->take(6)
            ->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'totalCash' => (float) $totalCash,
                'totalBanks' => (float) $totalBanks,
                'totalLiquidity' => (float) ($totalCash + $totalBanks),
                'totalInvestorsCapital' => (float) $totalInvestorsCapital,
                'totalInvestorsProfit' => (float) $totalInvestorsProfit,
            ],
            'recentTransactions' => $recentTransactions,
        ]);
    })->name('dashboard');

    // Treasury & Funds
    Route::get('/treasury', [TreasuryController::class, 'index'])->name('treasury.index');
    Route::post('/treasury/deposit', [TreasuryController::class, 'deposit'])->name('treasury.deposit');
    Route::post('/treasury/withdraw', [TreasuryController::class, 'withdraw'])->name('treasury.withdraw');
    Route::post('/treasury/transfer', [TreasuryController::class, 'transfer'])->name('treasury.transfer');
    Route::post('/treasury/funds', [TreasuryController::class, 'storeFund'])->name('treasury.funds.store');

    // Banks Management
    Route::get('/banks', [BankController::class, 'index'])->name('banks.index');
    Route::post('/banks', [BankController::class, 'store'])->name('banks.store');
    Route::put('/banks/{bank}', [BankController::class, 'update'])->name('banks.update');
    Route::delete('/banks/{bank}', [BankController::class, 'destroy'])->name('banks.destroy');
    Route::post('/banks/{bank}/deposit', [BankController::class, 'deposit'])->name('banks.deposit');
    Route::post('/banks/{bank}/withdraw', [BankController::class, 'withdraw'])->name('banks.withdraw');

    // Invoices & Sales Management
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('/invoices/{invoice}/sell', [InvoiceController::class, 'sellForm'])->name('invoices.sell');
    Route::post('/invoices/{invoice}/sell', [InvoiceController::class, 'sell'])->name('invoices.sell.submit');
    Route::post('/customers', [InvoiceController::class, 'storeCustomer'])->name('customers.store');

    // Investors Management
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
