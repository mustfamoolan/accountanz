<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\TreasuryTransaction;
use App\Services\TreasuryService;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankController extends Controller
{
    public function __construct(protected TreasuryService $treasuryService)
    {
    }

    public function index(Request $request)
    {
        $banks = Bank::orderBy('name')->get();
        $funds = Fund::orderBy('name')->get();

        $selectedBankId = $request->filled('bank_id') ? (int) $request->bank_id : null;
        $selectedBank = $selectedBankId ? Bank::find($selectedBankId) : null;

        $transactionsQuery = TreasuryTransaction::with(['source', 'destination', 'creator', 'investor'])
            ->where(function ($q) use ($selectedBankId) {
                if ($selectedBankId) {
                    $q->where(fn ($sub) => $sub->where('source_type', Bank::class)->where('source_id', $selectedBankId))
                      ->orWhere(fn ($sub) => $sub->where('destination_type', Bank::class)->where('destination_id', $selectedBankId));
                } else {
                    $q->where('source_type', Bank::class)
                      ->orWhere('destination_type', Bank::class);
                }
            })
            ->latest('transaction_date');

        $transactions = $transactionsQuery->paginate(20)->through(function ($tx) {
            $bankName = '-';
            if ($tx->source_type === Bank::class && $tx->source) {
                $bankName = $tx->source->name;
            } elseif ($tx->destination_type === Bank::class && $tx->destination) {
                $bankName = $tx->destination->name;
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
                'bank_name' => $bankName,
                'creator' => $tx->creator ? ['name' => $tx->creator->name] : null,
                'investor' => $tx->investor ? ['name' => $tx->investor->name, 'code' => $tx->investor->code] : null,
            ];
        })->withQueryString();

        $totalBalance = Bank::sum('balance');

        return Inertia::render('Banks/Index', [
            'banks' => $banks,
            'funds' => $funds,
            'selectedBank' => $selectedBank,
            'selectedBankId' => $selectedBankId,
            'transactions' => $transactions,
            'totalBalance' => (float) $totalBalance,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_number' => 'required|string|max:100',
            'iban' => 'nullable|string|max:100',
            'currency' => 'required|string|max:10',
            'branch' => 'nullable|string|max:255',
            'initial_balance' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $initialBalance = (float) ($validated['initial_balance'] ?? 0);
        unset($validated['initial_balance']);

        $bank = Bank::create([
            ...$validated,
            'balance' => 0.00,
            'status' => 'active',
        ]);

        if ($initialBalance > 0) {
            $this->treasuryService->deposit($bank, $initialBalance, 'رصيد افتتاحي للبنك');
        }

        return back()->with('success', 'تمت إضافة الحساب البنكي بنجاح.');
    }

    public function update(Request $request, Bank $bank)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_number' => 'required|string|max:100',
            'iban' => 'nullable|string|max:100',
            'currency' => 'required|string|max:10',
            'branch' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        $bank->update($validated);

        return back()->with('success', 'تم تعديل بيانات الحساب البنكي بنجاح.');
    }

    public function destroy(Bank $bank)
    {
        if ($bank->balance > 0) {
            return back()->with('error', 'لا يمكن حذف الحساب البنكي لأن رصيده يحتوي على أموال. يرجى تصفير الرصيد أولاً.');
        }

        $bank->delete();

        return redirect()->route('banks.index')->with('success', 'تم حذف الحساب البنكي بنجاح.');
    }

    public function deposit(Request $request, Bank $bank)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
        ]);

        try {
            $this->treasuryService->deposit($bank, (float) $validated['amount'], $validated['description']);
            return back()->with('success', 'تم الإيداع في الحساب البنكي بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function withdraw(Request $request, Bank $bank)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
        ]);

        try {
            $this->treasuryService->withdraw($bank, (float) $validated['amount'], $validated['description']);
            return back()->with('success', 'تم السحب من الحساب البنكي بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
