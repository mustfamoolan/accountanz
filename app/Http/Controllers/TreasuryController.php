<?php

namespace App\Http\Controllers;

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

    /**
     * Get or initialize the two vault accounts (IQD & USD)
     */
    protected function getVaultAccounts(): array
    {
        // Check if old FUND-MAIN exists; migrate it to VAULT-IQD seamlessly
        $existingMain = Fund::where('code', 'FUND-MAIN')->first();
        if ($existingMain) {
            $existingMain->update([
                'code' => 'VAULT-IQD',
                'name' => 'الخزنة (دينار)',
                'currency' => 'IQD',
                'notes' => 'الخزنة بالدينار العراقي',
            ]);
        }

        $vaultIqd = Fund::firstOrCreate(
            ['code' => 'VAULT-IQD'],
            [
                'name' => 'الخزنة (دينار)',
                'type' => 'main',
                'currency' => 'IQD',
                'balance' => 0.00,
                'status' => 'active',
                'notes' => 'الخزنة بالدينار العراقي',
            ]
        );

        $vaultUsd = Fund::firstOrCreate(
            ['code' => 'VAULT-USD'],
            [
                'name' => 'الخزنة (دولار)',
                'type' => 'main',
                'currency' => 'USD',
                'balance' => 0.00,
                'status' => 'active',
                'notes' => 'الخزنة بالدولار الأمريكي',
            ]
        );

        return [$vaultIqd, $vaultUsd];
    }

    public function index(Request $request)
    {
        [$vaultIqd, $vaultUsd] = $this->getVaultAccounts();
        $vaultIds = [$vaultIqd->id, $vaultUsd->id];

        $transactionsQuery = TreasuryTransaction::with(['creator'])
            ->where(function ($q) use ($vaultIds) {
                $q->where(function ($sub) use ($vaultIds) {
                    $sub->where('source_type', Fund::class)->whereIn('source_id', $vaultIds);
                })->orWhere(function ($sub) use ($vaultIds) {
                    $sub->where('destination_type', Fund::class)->whereIn('destination_id', $vaultIds);
                });
            })
            ->whereIn('type', ['deposit', 'withdrawal'])
            ->latest('transaction_date');

        // Date filter only: from_date and to_date
        if ($request->filled('from_date')) {
            $transactionsQuery->whereDate('transaction_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $transactionsQuery->whereDate('transaction_date', '<=', $request->to_date);
        }

        // Optional currency filter
        if ($request->filled('currency') && in_array($request->currency, ['IQD', 'USD'])) {
            $transactionsQuery->where('currency', $request->currency);
        }

        $transactions = $transactionsQuery->paginate(25)->through(function ($tx) {
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
                'creator' => $tx->creator ? ['name' => $tx->creator->name] : null,
            ];
        })->withQueryString();

        // Calculate totals for Vault
        $depositsQuery = TreasuryTransaction::where(function ($q) use ($vaultIds) {
            $q->where('destination_type', Fund::class)->whereIn('destination_id', $vaultIds);
        })->where('type', 'deposit');

        $withdrawalsQuery = TreasuryTransaction::where(function ($q) use ($vaultIds) {
            $q->where('source_type', Fund::class)->whereIn('source_id', $vaultIds);
        })->where('type', 'withdrawal');

        if ($request->filled('from_date')) {
            $depositsQuery->whereDate('transaction_date', '>=', $request->from_date);
            $withdrawalsQuery->whereDate('transaction_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $depositsQuery->whereDate('transaction_date', '<=', $request->to_date);
            $withdrawalsQuery->whereDate('transaction_date', '<=', $request->to_date);
        }

        $totalDepositsIqd = (clone $depositsQuery)->where('currency', 'IQD')->sum('amount');
        $totalDepositsUsd = (clone $depositsQuery)->where('currency', 'USD')->sum('amount');
        $totalWithdrawalsIqd = (clone $withdrawalsQuery)->where('currency', 'IQD')->sum('amount');
        $totalWithdrawalsUsd = (clone $withdrawalsQuery)->where('currency', 'USD')->sum('amount');

        return Inertia::render('Treasury/Index', [
            'vaultIqd' => [
                'id' => $vaultIqd->id,
                'name' => 'الخزنة (دينار)',
                'currency' => 'IQD',
                'balance' => (float) $vaultIqd->balance,
            ],
            'vaultUsd' => [
                'id' => $vaultUsd->id,
                'name' => 'الخزنة (دولار)',
                'currency' => 'USD',
                'balance' => (float) $vaultUsd->balance,
            ],
            'transactions' => $transactions,
            'filters' => [
                'from_date' => $request->input('from_date', ''),
                'to_date' => $request->input('to_date', ''),
                'currency' => $request->input('currency', ''),
            ],
            'stats' => [
                'balanceIqd' => (float) $vaultIqd->balance,
                'balanceUsd' => (float) $vaultUsd->balance,
                'totalDepositsIqd' => (float) $totalDepositsIqd,
                'totalDepositsUsd' => (float) $totalDepositsUsd,
                'totalWithdrawalsIqd' => (float) $totalWithdrawalsIqd,
                'totalWithdrawalsUsd' => (float) $totalWithdrawalsUsd,
            ],
        ]);
    }

    public function deposit(Request $request)
    {
        $validated = $request->validate([
            'currency' => 'required|in:IQD,USD',
            'amount' => 'required|numeric|min:0.01',
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:1000',
        ], [
            'currency.required' => 'يرجى اختيار العملة (دينار أو دولار).',
            'amount.required' => 'يرجى إدخال مبلغ الإيداع.',
            'amount.min' => 'يجب أن يكون المبلغ أكبر من الصفر.',
            'transaction_date.required' => 'يرجى تحديد تاريخ العملية.',
            'description.required' => 'يرجى كتابة تفاصيل العملية.',
        ]);

        try {
            [$vaultIqd, $vaultUsd] = $this->getVaultAccounts();
            $targetVault = $validated['currency'] === 'USD' ? $vaultUsd : $vaultIqd;

            $this->treasuryService->deposit(
                $targetVault,
                (float) $validated['amount'],
                $validated['description'],
                auth()->id(),
                $validated['transaction_date']
            );

            return back()->with('success', 'تم تسجيل الإيداع في الخزنة بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function withdraw(Request $request)
    {
        $validated = $request->validate([
            'currency' => 'required|in:IQD,USD',
            'amount' => 'required|numeric|min:0.01',
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:1000',
        ], [
            'currency.required' => 'يرجى اختيار العملة (دينار أو دولار).',
            'amount.required' => 'يرجى إدخال مبلغ السحب.',
            'amount.min' => 'يجب أن يكون المبلغ أكبر من الصفر.',
            'transaction_date.required' => 'يرجى تحديد تاريخ العملية.',
            'description.required' => 'يرجى كتابة تفاصيل العملية.',
        ]);

        try {
            [$vaultIqd, $vaultUsd] = $this->getVaultAccounts();
            $sourceVault = $validated['currency'] === 'USD' ? $vaultUsd : $vaultIqd;

            $this->treasuryService->withdraw(
                $sourceVault,
                (float) $validated['amount'],
                $validated['description'],
                auth()->id(),
                $validated['transaction_date']
            );

            return back()->with('success', 'تم تسجيل السحب من الخزنة بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
