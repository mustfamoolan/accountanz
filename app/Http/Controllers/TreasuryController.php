<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\TreasuryTransaction;
use App\Services\TreasuryService;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TreasuryController extends Controller
{
    public function __construct(protected TreasuryService $treasuryService)
    {
    }

    public function index(Request $request)
    {
        $mainFund = Fund::firstOrCreate(
            ['code' => 'FUND-MAIN'],
            [
                'name' => 'الصندوق الرئيسي للشركة',
                'type' => 'main',
                'currency' => 'IQD',
                'balance' => 0.00,
                'status' => 'active',
                'notes' => 'الصندوق النقدي الرئيسي للإدارة والعمليات',
            ]
        );

        $funds = Fund::orderBy('id')->get();
        $banks = Bank::orderBy('id')->get();

        $selectedFundId = $request->filled('fund_id') ? (int) $request->fund_id : null;
        $selectedFund = $selectedFundId ? Fund::find($selectedFundId) : null;

        $transactionsQuery = TreasuryTransaction::with(['source', 'destination', 'creator', 'investor'])
            ->latest('transaction_date');

        if ($selectedFundId) {
            $transactionsQuery->where(function ($q) use ($selectedFundId) {
                $q->where(fn ($sub) => $sub->where('source_type', Fund::class)->where('source_id', $selectedFundId))
                  ->orWhere(fn ($sub) => $sub->where('destination_type', Fund::class)->where('destination_id', $selectedFundId));
            });
        }

        if ($request->filled('type')) {
            $transactionsQuery->where('type', $request->type);
        }

        $transactions = $transactionsQuery->paginate(20)->through(function ($tx) {
            $accountName = '-';
            if ($tx->type === 'transfer') {
                $fromName = $tx->source?->name ?? 'مصدر';
                $toName = $tx->destination?->name ?? 'مستلم';
                $accountName = "{$fromName} ⬅ {$toName}";
            } elseif ($tx->source_type === Fund::class && $tx->source) {
                $accountName = $tx->source->name;
            } elseif ($tx->destination_type === Fund::class && $tx->destination) {
                $accountName = $tx->destination->name;
            } elseif ($tx->source_type === Bank::class && $tx->source) {
                $accountName = $tx->source->name;
            } elseif ($tx->destination_type === Bank::class && $tx->destination) {
                $accountName = $tx->destination->name;
            }

            return [
                'id' => $tx->id,
                'reference_no' => $tx->reference_no,
                'type' => $tx->type,
                'amount' => (float) $tx->amount,
                'currency' => $tx->currency,
                'balance_before' => (float) $tx->balance_before,
                'balance_after' => (float) $tx->balance_after,
                'description' => $tx->description,
                'transaction_date' => $tx->transaction_date->toISOString(),
                'account_name' => $accountName,
                'creator' => $tx->creator ? ['name' => $tx->creator->name] : null,
                'investor' => $tx->investor ? ['name' => $tx->investor->name, 'code' => $tx->investor->code] : null,
            ];
        })->withQueryString();

        $totalCashIqd = (float) Fund::where('currency', 'IQD')->sum('balance');
        $totalCashUsd = (float) Fund::where('currency', 'USD')->sum('balance');
        $totalBanksIqd = (float) Bank::where('currency', 'IQD')->sum('balance');
        $totalBanksUsd = (float) Bank::where('currency', 'USD')->sum('balance');
        $totalLiquidityIqd = $totalCashIqd + $totalBanksIqd;
        $totalLiquidityUsd = $totalCashUsd + $totalBanksUsd;

        $totalCash = Fund::sum('balance');
        $totalBanks = Bank::sum('balance');
        $totalLiquidity = $totalCash + $totalBanks;

        // Statistics for current month
        $currentMonthDeposits = TreasuryTransaction::whereIn('type', ['deposit', 'capital_deposit'])
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $currentMonthWithdrawals = TreasuryTransaction::whereIn('type', ['withdrawal', 'capital_withdrawal', 'profit_withdrawal', 'expense'])
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        return Inertia::render('Treasury/Index', [
            'mainFund' => $mainFund,
            'funds' => $funds,
            'banks' => $banks,
            'selectedFund' => $selectedFund,
            'selectedFundId' => $selectedFundId,
            'transactions' => $transactions,
            'filters' => $request->only(['type', 'fund_id']),
            'stats' => [
                'totalCash' => (float) $totalCash,
                'totalBanks' => (float) $totalBanks,
                'totalLiquidity' => (float) $totalLiquidity,
                'totalCashIqd' => $totalCashIqd,
                'totalCashUsd' => $totalCashUsd,
                'totalBanksIqd' => $totalBanksIqd,
                'totalBanksUsd' => $totalBanksUsd,
                'totalLiquidityIqd' => $totalLiquidityIqd,
                'totalLiquidityUsd' => $totalLiquidityUsd,
                'currentMonthDeposits' => (float) $currentMonthDeposits,
                'currentMonthWithdrawals' => (float) $currentMonthWithdrawals,
            ],
        ]);
    }

    public function deposit(Request $request)
    {
        $validated = $request->validate([
            'fund_id' => 'required|exists:funds,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
        ]);

        try {
            $fund = Fund::findOrFail($validated['fund_id']);
            $this->treasuryService->deposit($fund, (float) $validated['amount'], $validated['description']);

            return back()->with('success', 'تم تسجيل الإيداع في الصندوق بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function withdraw(Request $request)
    {
        $validated = $request->validate([
            'fund_id' => 'required|exists:funds,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
        ]);

        try {
            $fund = Fund::findOrFail($validated['fund_id']);
            $this->treasuryService->withdraw($fund, (float) $validated['amount'], $validated['description']);

            return back()->with('success', 'تم تسجيل السحب من الصندوق بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function transfer(Request $request)
    {
        $validated = $request->validate([
            'from_type' => 'required|in:fund,bank',
            'from_id' => 'required|integer',
            'to_type' => 'required|in:fund,bank',
            'to_id' => 'required|integer',
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
        ]);

        try {
            $fromSource = $validated['from_type'] === 'fund' 
                ? Fund::findOrFail($validated['from_id']) 
                : Bank::findOrFail($validated['from_id']);

            $toDestination = $validated['to_type'] === 'fund' 
                ? Fund::findOrFail($validated['to_id']) 
                : Bank::findOrFail($validated['to_id']);

            $this->treasuryService->transfer($fromSource, $toDestination, (float) $validated['amount'], $validated['description']);

            return back()->with('success', 'تم تحويل المبلغ بنجاح بين الحسابين.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function storeFund(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:funds,code',
            'currency' => 'required|in:IQD,USD',
            'type' => 'required|in:main,sub,petty_cash',
            'initial_balance' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        try {
            $fund = Fund::create([
                'name' => $validated['name'],
                'code' => strtoupper($validated['code']),
                'type' => $validated['type'],
                'currency' => $validated['currency'],
                'balance' => 0.00,
                'status' => 'active',
                'notes' => $validated['notes'] ?? null,
            ]);

            if (!empty($validated['initial_balance']) && (float) $validated['initial_balance'] > 0) {
                $this->treasuryService->deposit(
                    $fund,
                    (float) $validated['initial_balance'],
                    "رصيد افتتاحي للصندوق الجديد [{$fund->name}]",
                    auth()->id()
                );
            }

            return back()->with('success', "تم إنشاء الصندوق [{$fund->name}] بنجاح.");
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
