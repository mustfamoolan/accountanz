<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\PeriodicInventory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PeriodicInventoryController extends Controller
{
    /**
     * Display a listing of periodic inventories.
     */
    public function index(Request $request)
    {
        $query = PeriodicInventory::with('creator')->latest('inventory_date');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('inventory_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('inventory_date', '<=', $request->to_date);
        }

        $inventories = $query->paginate(15)->withQueryString();

        $latest = PeriodicInventory::latest('inventory_date')->first();
        $totalCount = PeriodicInventory::count();
        $latestNetWorth = $latest ? (float) $latest->net_worth : 0;
        $latestProfit = $latest ? (float) $latest->inventory_profit : 0;
        $latestAssets = $latest ? (float) $latest->total_assets : 0;

        return Inertia::render('Inventories/Index', [
            'inventories' => $inventories,
            'filters' => $request->only(['search', 'from_date', 'to_date']),
            'stats' => [
                'totalCount' => $totalCount,
                'latestNetWorth' => $latestNetWorth,
                'latestProfit' => $latestProfit,
                'latestAssets' => $latestAssets,
            ],
        ]);
    }

    /**
     * Show form for creating a new periodic inventory.
     */
    public function create()
    {
        // 1. Live system funds and banks
        $funds = Fund::where('status', 'active')->get();
        $banks = Bank::where('status', 'active')->get();

        // Calculate default cash from active IQD funds
        $systemActualCash = (float) Fund::where('status', 'active')
            ->where('currency', 'IQD')
            ->sum('balance');

        // Calculate default bank balances in IQD
        $systemBankBalance = (float) Bank::where('status', 'active')
            ->where('currency', 'IQD')
            ->sum('balance');

        // 2. Previous inventory net worth
        $previousInventory = PeriodicInventory::latest('inventory_date')->first();
        $previousNetWorth = $previousInventory ? (float) $previousInventory->net_worth : 0;

        // 3. Mohammed Investor info & opening cash
        $mohammed = Investor::where('code', 'INV-MOHAMMED')
            ->orWhere('name', 'محمد')
            ->first();

        $mohammedOpeningCash = $previousInventory
            ? (float) $previousInventory->mohammed_cash_present
            : ($mohammed ? (float) $mohammed->capital_balance : 0);

        return Inertia::render('Inventories/Create', [
            'systemActualCash' => $systemActualCash,
            'systemBankBalance' => $systemBankBalance,
            'previousNetWorth' => $previousNetWorth,
            'mohammedOpeningCash' => $mohammedOpeningCash,
            'mohammedInvestor' => $mohammed,
            'funds' => $funds,
            'banks' => $banks,
        ]);
    }

    /**
     * Store newly created periodic inventory.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'inventory_date' => 'required|date',
            'title' => 'nullable|string|max:255',
            'actual_cash' => 'nullable|numeric',
            'bank_balance' => 'nullable|numeric',
            'previous_net_worth' => 'nullable|numeric',
            'receivables' => 'nullable|array',
            'payables' => 'nullable|array',
            'customs' => 'nullable|array',
            'expenses' => 'nullable|array',
            'mohammed_opening_cash' => 'nullable|numeric',
            'mohammed_outflow' => 'nullable|numeric',
            'mohammed_inflow' => 'nullable|numeric',
            'mohammed_expenses' => 'nullable|numeric',
            'mohammed_assets' => 'nullable|numeric',
            'mohammed_cash_present' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $receivables = $this->filterItems($request->input('receivables', []));
        $payables = $this->filterItems($request->input('payables', []));
        $customs = $this->filterItems($request->input('customs', []));
        $expenses = $this->filterItems($request->input('expenses', []));

        $totalReceivables = (float) collect($receivables)->sum('amount');
        $totalPayables = (float) collect($payables)->sum('amount');
        $totalCustoms = (float) collect($customs)->sum('amount');
        $totalExpenses = (float) collect($expenses)->sum('amount');

        $actualCash = (float) ($validated['actual_cash'] ?? 0);
        $bankBalance = (float) ($validated['bank_balance'] ?? 0);
        $previousNetWorth = (float) ($validated['previous_net_worth'] ?? 0);

        // Core Accounting Equations
        // 1. م/ الموجودات = كاش حقيقي + رصيد مصارف + نطلب
        $totalAssets = $actualCash + $bankBalance + $totalReceivables;

        // 2. م/ مطلوبات = مطلوبين + كمرك
        $totalLiabilities = $totalPayables + $totalCustoms;

        // 3. الموجود الكلي = م/ الموجودات - م/ مطلوبات
        $netWorth = $totalAssets - $totalLiabilities;

        // 4. ربح آخر جرد = الموجود الكلي - موجود كلي سابق
        $inventoryProfit = $netWorth - $previousNetWorth;

        // Special Account: خاص محمد
        $mohOpening = (float) ($validated['mohammed_opening_cash'] ?? 0);
        $mohOutflow = (float) ($validated['mohammed_outflow'] ?? 0);
        $mohInflow = (float) ($validated['mohammed_inflow'] ?? 0);
        $mohExpenses = (float) ($validated['mohammed_expenses'] ?? 0);
        $mohAssets = (float) ($validated['mohammed_assets'] ?? 0);
        $mohCashPresent = (float) ($validated['mohammed_cash_present'] ?? 0);

        // كاش محسوب = افتتاح + وارد - صادر - نثريات
        $mohCalculatedCash = ($mohOpening + $mohInflow) - ($mohOutflow + $mohExpenses);
        $mohDifference = $mohCashPresent - $mohCalculatedCash;

        $inventory = PeriodicInventory::create([
            'title' => $validated['title'] ?: 'جرد وميزانية بتاريخ ' . $validated['inventory_date'],
            'inventory_date' => $validated['inventory_date'],
            'receivables_items' => $receivables,
            'payables_items' => $payables,
            'customs_items' => $customs,
            'expenses_items' => $expenses,
            'total_receivables' => $totalReceivables,
            'total_payables' => $totalPayables,
            'total_customs' => $totalCustoms,
            'total_expenses' => $totalExpenses,
            'actual_cash' => $actualCash,
            'bank_balance' => $bankBalance,
            'total_assets' => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'net_worth' => $netWorth,
            'previous_net_worth' => $previousNetWorth,
            'inventory_profit' => $inventoryProfit,
            'mohammed_opening_cash' => $mohOpening,
            'mohammed_outflow' => $mohOutflow,
            'mohammed_inflow' => $mohInflow,
            'mohammed_expenses' => $mohExpenses,
            'mohammed_assets' => $mohAssets,
            'mohammed_cash_present' => $mohCashPresent,
            'mohammed_calculated_cash' => $mohCalculatedCash,
            'mohammed_difference' => $mohDifference,
            'mohammed_previous_net_worth' => $previousNetWorth,
            'mohammed_current_net_worth' => $netWorth,
            'notes' => $validated['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('inventories.show', $inventory->id)
            ->with('success', 'تم حفظ كشف الجرد والميزانية بنجاح.');
    }

    /**
     * Display the specified periodic inventory.
     */
    public function show(PeriodicInventory $inventory)
    {
        $inventory->load('creator');

        return Inertia::render('Inventories/Show', [
            'inventory' => $inventory,
        ]);
    }

    /**
     * Remove the specified inventory from storage.
     */
    public function destroy(PeriodicInventory $inventory)
    {
        $inventory->delete();

        return redirect()->route('inventories.index')
            ->with('success', 'تم حذف كشف الجرد بنجاح.');
    }

    /**
     * Helper to clean dynamic table items.
     */
    private function filterItems($items): array
    {
        if (!is_array($items)) {
            return [];
        }

        $clean = [];
        foreach ($items as $item) {
            $amount = isset($item['amount']) && is_numeric($item['amount']) ? (float) $item['amount'] : 0;
            $details = isset($item['details']) ? trim($item['details']) : '';

            if ($amount != 0 || !empty($details)) {
                $clean[] = [
                    'amount' => $amount,
                    'details' => $details,
                ];
            }
        }

        return $clean;
    }
}
