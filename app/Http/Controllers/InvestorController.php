<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\TreasuryTransaction;
use App\Services\TreasuryService;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvestorController extends Controller
{
    public function __construct(protected TreasuryService $treasuryService)
    {
    }

    public function index(Request $request)
    {
        $investors = Investor::withCount('transactions')
            ->orderBy('name')
            ->get();

        $funds = Fund::orderBy('name')->get();
        $banks = Bank::orderBy('name')->get();

        $totalCapital = Investor::sum('capital_balance');
        $totalProfits = Investor::sum('profit_balance');
        $totalWithdrawnCapital = Investor::sum('total_withdrawn_capital');
        $totalWithdrawnProfits = Investor::sum('total_withdrawn_profits');

        return Inertia::render('Investors/Index', [
            'investors' => $investors,
            'funds' => $funds,
            'banks' => $banks,
            'stats' => [
                'totalCapital' => (float) $totalCapital,
                'totalProfits' => (float) $totalProfits,
                'totalWithdrawnCapital' => (float) $totalWithdrawnCapital,
                'totalWithdrawnProfits' => (float) $totalWithdrawnProfits,
                'investorsCount' => $investors->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'currency' => 'required|string|max:10',
            'profit_rate' => 'nullable|numeric|min:0|max:100',
            'initial_capital' => 'nullable|numeric|min:0',
            'target_type' => 'nullable|required_if:initial_capital,>0|in:fund,bank',
            'target_id' => 'nullable|required_if:initial_capital,>0|integer',
            'notes' => 'nullable|string|max:500',
        ]);

        $initialCapital = (float) ($validated['initial_capital'] ?? 0);
        $targetType = $validated['target_type'] ?? null;
        $targetId = $validated['target_id'] ?? null;

        unset($validated['initial_capital'], $validated['target_type'], $validated['target_id']);

        // Generate unique code (e.g. INV-001)
        $nextId = (Investor::max('id') ?? 0) + 1;
        $code = 'INV-' . str_pad($nextId, 3, '0', STR_PAD_LEFT);

        $investor = Investor::create([
            ...$validated,
            'code' => $code,
            'capital_balance' => 0.00,
            'profit_balance' => 0.00,
            'status' => 'active',
        ]);

        // If initial capital provided, deposit into chosen fund/bank
        if ($initialCapital > 0 && $targetType && $targetId) {
            $moneySource = $targetType === 'fund' 
                ? Fund::findOrFail($targetId) 
                : Bank::findOrFail($targetId);

            $this->treasuryService->investorDepositCapital(
                $investor,
                $moneySource,
                $initialCapital,
                'رأس مال افتتاحي عند تسجيل المستثمر'
            );
        }

        return back()->with('success', "تمت إضافة المستثمر [{$investor->name}] بكود {$investor->code} بنجاح.");
    }

    public function show(Investor $investor)
    {
        $investor->load(['user']);

        $transactions = TreasuryTransaction::where('investor_id', $investor->id)
            ->with('creator')
            ->latest('transaction_date')
            ->paginate(20);

        // Load purchased invoices / sales for this investor
        $invoicePurchases = \App\Models\InvoiceSaleItem::where('investor_id', $investor->id)
            ->with(['sale.invoice'])
            ->latest('created_at')
            ->get();

        $funds = Fund::orderBy('name')->get();
        $banks = Bank::orderBy('name')->get();

        return Inertia::render('Investors/Show', [
            'investor' => $investor,
            'transactions' => $transactions,
            'invoicePurchases' => $invoicePurchases,
            'funds' => $funds,
            'banks' => $banks,
        ]);
    }

    public function update(Request $request, Investor $investor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'profit_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'required|in:active,inactive',
            'notes' => 'nullable|string|max:500',
        ]);

        $investor->update($validated);

        return back()->with('success', 'تم تحديث بيانات المستثمر بنجاح.');
    }

    public function depositCapital(Request $request, Investor $investor)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'destination_type' => 'required|in:fund,bank',
            'destination_id' => 'required|integer',
            'description' => 'required|string|max:500',
        ]);

        try {
            $moneySource = $validated['destination_type'] === 'fund'
                ? Fund::findOrFail($validated['destination_id'])
                : Bank::findOrFail($validated['destination_id']);

            $this->treasuryService->investorDepositCapital(
                $investor,
                $moneySource,
                (float) $validated['amount'],
                $validated['description']
            );

            return back()->with('success', 'تم إيداع رأس المال ودخوله في خزينة الشركة بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function withdrawCapital(Request $request, Investor $investor)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'source_type' => 'required|in:fund,bank',
            'source_id' => 'required|integer',
            'description' => 'required|string|max:500',
        ]);

        try {
            $moneySource = $validated['source_type'] === 'fund'
                ? Fund::findOrFail($validated['source_id'])
                : Bank::findOrFail($validated['source_id']);

            $this->treasuryService->investorWithdrawCapital(
                $investor,
                $moneySource,
                (float) $validated['amount'],
                $validated['description']
            );

            return back()->with('success', 'تم سحب رأس المال وصرفه للمستثمر بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function distributeProfit(Request $request, Investor $investor)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'description' => 'required|string|max:500',
        ]);

        try {
            $this->treasuryService->investorDistributeProfit(
                $investor,
                (float) $validated['amount'],
                $validated['description']
            );

            return back()->with('success', 'تم إثبات الأرباح في صندوق أرباح المستثمر بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function withdrawProfit(Request $request, Investor $investor)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'source_type' => 'required|in:fund,bank',
            'source_id' => 'required|integer',
            'description' => 'required|string|max:500',
        ]);

        try {
            $moneySource = $validated['source_type'] === 'fund'
                ? Fund::findOrFail($validated['source_id'])
                : Bank::findOrFail($validated['source_id']);

            $this->treasuryService->investorWithdrawProfit(
                $investor,
                $moneySource,
                (float) $validated['amount'],
                $validated['description']
            );

            return back()->with('success', 'تم صرف الأرباح للمستثمر وخصمها من الرصيد النقدي بنجاح.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function destroy(Investor $investor)
    {
        if ($investor->is_permanent) {
            return back()->with('error', 'لا يمكن حذف المستثمر (محمد) لأنه مستثمر نظام ثابت ومرتبط بحسابات الجرد والميزانية.');
        }

        if ($investor->capital_balance > 0 || $investor->profit_balance > 0) {
            return back()->with('error', 'لا يمكن حذف مستثمر لديه رصيد رأس مال أو أرباح نشطة.');
        }

        $investor->delete();

        return redirect()->route('investors.index')->with('success', 'تم حذف المستثمر بنجاح.');
    }
}

