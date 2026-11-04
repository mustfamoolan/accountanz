<?php

namespace App\Http\Controllers;

use App\Models\PeriodicInventory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PeriodicInventoryController extends Controller
{
    /**
     * Display a listing of periodic inventories (الجرد).
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

        // Calculate statistics for the filtered period
        $statsQuery = PeriodicInventory::query();
        if ($request->filled('from_date')) {
            $statsQuery->whereDate('inventory_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $statsQuery->whereDate('inventory_date', '<=', $request->to_date);
        }

        $totalCount = (clone $statsQuery)->count();
        $periodProfitsSum = (float) (clone $statsQuery)->sum('inventory_profit');
        $periodAssetsSum = (float) (clone $statsQuery)->sum('total_assets');

        // Latest inventory profit overall (ربح آخر جرد مسجل)
        $latest = PeriodicInventory::latest('inventory_date')->first();
        $latestProfit = $latest ? (float) $latest->inventory_profit : 0;

        return Inertia::render('Inventories/Index', [
            'inventories' => $inventories,
            'filters' => [
                'search' => $request->input('search', ''),
                'from_date' => $request->input('from_date', ''),
                'to_date' => $request->input('to_date', ''),
            ],
            'stats' => [
                'totalCount' => $totalCount,
                'periodProfitsSum' => $periodProfitsSum,
                'periodAssetsSum' => $periodAssetsSum,
                'latestProfit' => $latestProfit,
            ],
        ]);
    }

    /**
     * Show form for creating a new periodic inventory.
     */
    public function create()
    {
        // Get the latest inventory's profit to be used as previous profit
        $latest = PeriodicInventory::latest('inventory_date')->first();
        $previousProfit = $latest ? (float) $latest->inventory_profit : 0;

        return Inertia::render('Inventories/Create', [
            'previousProfit' => $previousProfit,
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
            'previous_profit' => 'nullable|numeric',
            'receivables' => 'nullable|array',
            'payables' => 'nullable|array',
            'customs' => 'nullable|array',
            'expenses' => 'nullable|array',
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
        $previousProfit = (float) ($validated['previous_profit'] ?? 0);

        // Core Accounting Equations
        // 1. الرصيد المتوفر = رصيد الصندوق (كاش) + رصيد المصارف + نطلب
        $availableBalance = $actualCash + $bankBalance + $totalReceivables;

        // 2. مجموع الالتزامات = مطلوبين + كمرك
        $totalLiabilities = $totalPayables + $totalCustoms;

        // 3. الربح الإجمالي الحالي = الرصيد المتوفر - (المطلوبين + الكمرك)
        $currentProfit = $availableBalance - $totalLiabilities;

        // 4. الربح الجديد = الربح الإجمالي الحالي - ربح آخر جرد
        $newProfit = $currentProfit - $previousProfit;

        $inventory = PeriodicInventory::create([
            'title' => $validated['title'] ?: 'جرد بتاريخ ' . $validated['inventory_date'],
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
            'total_assets' => $availableBalance,
            'total_liabilities' => $totalLiabilities,
            'net_worth' => $currentProfit,
            'previous_net_worth' => $previousProfit,
            'inventory_profit' => $newProfit,
            'notes' => $validated['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('inventories.show', $inventory->id)
            ->with('success', 'تم حفظ كشف الجرد بنجاح.');
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
