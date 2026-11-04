<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\Invoice;
use App\Models\InvoiceSale;
use App\Services\TreasuryService;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    protected TreasuryService $treasuryService;

    public function __construct(TreasuryService $treasuryService)
    {
        $this->treasuryService = $treasuryService;
    }

    /**
     * Display listing of invoices
     */
    public function index(Request $request)
    {
        $query = Invoice::with(['investor', 'createdBy'])
            ->withCount('sales')
            ->orderBy('purchase_date', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('investor_id')) {
            $query->where('investor_id', $request->investor_id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('invoice_number', 'like', "%{$s}%");
        }

        $invoices = $query->paginate(15)->through(function ($inv) {
            return [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'amount_usd' => (float) $inv->amount_usd,
                'exchange_rate' => (float) $inv->exchange_rate,
                'amount_iqd' => (float) $inv->amount_iqd,
                'tax_percentage' => (float) $inv->tax_percentage,
                'tax_iqd' => (float) $inv->tax_iqd,
                'total_iqd' => (float) $inv->total_iqd,
                'status' => $inv->status,
                'purchase_date' => $inv->purchase_date->format('Y-m-d'),
                'sold_amount_usd' => (float) $inv->sold_amount_usd,
                'available_amount_usd' => (float) $inv->available_amount_usd,
                'total_profit_iqd' => (float) $inv->total_profit_iqd,
                'investor_id' => $inv->investor_id,
                'investor' => $inv->investor ? [
                    'id' => $inv->investor->id,
                    'name' => $inv->investor->name,
                    'code' => $inv->investor->code,
                ] : null,
                'sales_count' => $inv->sales_count,
            ];
        })->withQueryString();

        // Summary Statistics
        $totalInvoicesCount = Invoice::count();
        $totalAmountUsd = (float) Invoice::sum('amount_usd');
        $totalAmountIqd = (float) Invoice::sum('total_iqd');
        $totalProfitIqd = (float) InvoiceSale::sum('profit_iqd');
        $availableInvoicesCount = Invoice::whereIn('status', ['available', 'partial'])->count();

        $investors = Investor::where('status', 'active')->select('id', 'name', 'code', 'capital_balance')->get();

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'stats' => [
                'totalInvoicesCount' => $totalInvoicesCount,
                'totalAmountUsd' => $totalAmountUsd,
                'totalAmountIqd' => $totalAmountIqd,
                'totalProfitIqd' => $totalProfitIqd,
                'availableInvoicesCount' => $availableInvoicesCount,
            ],
            'filters' => $request->only(['status', 'investor_id', 'search']),
            'investors' => $investors,
        ]);
    }

    /**
     * Show form for purchasing a new invoice (Dedicated Page)
     */
    public function create()
    {
        $investors = Investor::where('status', 'active')->select('id', 'name', 'code', 'capital_balance', 'profit_rate')->get();
        $funds = Fund::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();
        $banks = Bank::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();

        return Inertia::render('Invoices/Create', [
            'investors' => $investors,
            'funds' => $funds,
            'banks' => $banks,
        ]);
    }

    /**
     * Store newly purchased invoice
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string|unique:invoices,invoice_number',
            'amount_usd' => 'required|numeric|min:0.01',
            'exchange_rate' => 'required|numeric|min:0.0001',
            'tax_percentage' => 'nullable|numeric|min:0|max:100',
            'paid_from_type' => 'nullable|in:fund,bank',
            'paid_from_id' => 'nullable|integer',
            'investor_id' => 'nullable|exists:investors,id',
            'purchase_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        try {
            $invoice = $this->treasuryService->purchaseInvoice($validated, auth()->id());
            return redirect()->route('invoices.show', $invoice->id)->with('success', "تم شراء الفاتورة [{$invoice->invoice_number}] بنجاح.");
        } catch (Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Show single invoice with sales and profit distribution breakdown
     */
    public function show($id)
    {
        $invoice = Invoice::with([
            'investor',
            'createdBy',
            'sales.items.investor',
            'sales.distributions.investor',
            'sales.createdBy',
        ])->findOrFail($id);

        return Inertia::render('Invoices/Show', [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'amount_usd' => (float) $invoice->amount_usd,
                'exchange_rate' => (float) $invoice->exchange_rate,
                'amount_iqd' => (float) $invoice->amount_iqd,
                'tax_percentage' => (float) $invoice->tax_percentage,
                'tax_iqd' => (float) $invoice->tax_iqd,
                'total_iqd' => (float) $invoice->total_iqd,
                'status' => $invoice->status,
                'purchase_date' => $invoice->purchase_date->format('Y-m-d'),
                'notes' => $invoice->notes,
                'sold_amount_usd' => (float) $invoice->sold_amount_usd,
                'available_amount_usd' => (float) $invoice->available_amount_usd,
                'total_profit_iqd' => (float) $invoice->total_profit_iqd,
                'investor' => $invoice->investor ? [
                    'id' => $invoice->investor->id,
                    'name' => $invoice->investor->name,
                    'code' => $invoice->investor->code,
                ] : null,
                'sales' => $invoice->sales->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'sale_number' => $s->sale_number,
                        'sale_date' => $s->sale_date->format('Y-m-d'),
                        'total_amount_usd' => (float) $s->total_amount_usd,
                        'total_amount_iqd' => (float) $s->total_amount_iqd,
                        'cost_iqd' => (float) $s->cost_iqd,
                        'profit_iqd' => (float) $s->profit_iqd,
                        'payment_destination_type' => $s->payment_destination_type,
                        'items' => $s->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'investor_id' => $item->investor_id,
                                'investor' => $item->investor ? [
                                    'id' => $item->investor->id,
                                    'name' => $item->investor->name,
                                    'code' => $item->investor->code,
                                ] : null,
                                'amount_usd' => (float) $item->amount_usd,
                                'exchange_rate' => (float) $item->exchange_rate,
                                'amount_iqd' => (float) $item->amount_iqd,
                                'customs_percentage' => (float) $item->customs_percentage,
                                'amount_after_customs_usd' => (float) $item->amount_after_customs_usd,
                                'customs_exchange_rate' => (float) $item->customs_exchange_rate,
                                'customs_amount_iqd' => (float) $item->customs_amount_iqd,
                                'amount_after_customs_iqd' => (float) $item->amount_after_customs_iqd,
                                'notes' => $item->notes,
                            ];
                        }),
                        'distributions' => $s->distributions->map(function ($d) {
                            return [
                                'id' => $d->id,
                                'investor_id' => $d->investor_id,
                                'investor' => $d->investor ? [
                                    'id' => $d->investor->id,
                                    'name' => $d->investor->name,
                                    'code' => $d->investor->code,
                                ] : null,
                                'share_percentage' => (float) $d->share_percentage,
                                'profit_amount' => (float) $d->profit_amount,
                            ];
                        }),
                    ];
                }),
            ],
        ]);
    }

    /**
     * Show form for selling invoice to investors (Dedicated Page)
     */
    public function sellForm($id)
    {
        $invoice = Invoice::findOrFail($id);

        if ($invoice->status === 'sold') {
            return redirect()->route('invoices.show', $id)->with('error', 'هذه الفاتورة مباعة بالكامل بالفعل.');
        }

        $investors = Investor::where('status', 'active')->select('id', 'name', 'code', 'capital_balance')->get();
        $funds = Fund::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();
        $banks = Bank::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();

        return Inertia::render('Invoices/Sell', [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'amount_usd' => (float) $invoice->amount_usd,
                'exchange_rate' => (float) $invoice->exchange_rate,
                'sold_amount_usd' => (float) $invoice->sold_amount_usd,
                'available_amount_usd' => (float) $invoice->available_amount_usd,
                'investor_id' => $invoice->investor_id,
                'investor' => $invoice->investor ? [
                    'id' => $invoice->investor->id,
                    'name' => $invoice->investor->name,
                ] : null,
            ],
            'investors' => $investors,
            'funds' => $funds,
            'banks' => $banks,
        ]);
    }

    /**
     * Sell whole or partial amount of an invoice to investors
     */
    public function sell(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'sale_date' => 'required|date',
            'payment_destination_type' => 'required|in:fund,bank',
            'payment_destination_id' => 'required|integer',
            'investors' => 'required|array|min:1',
            'investors.*.investor_id' => 'required|exists:investors,id',
            'investors.*.amount_usd' => 'required|numeric|min:0.01',
            'investors.*.exchange_rate' => 'required|numeric|min:0.0001',
            'investors.*.customs_percentage' => 'nullable|numeric|min:0',
            'investors.*.customs_exchange_rate' => 'nullable|numeric|min:0',
            'investors.*.notes' => 'nullable|string',
        ]);

        try {
            $sale = $this->treasuryService->sellInvoice($invoice, $validated, auth()->id());
            return redirect()->route('invoices.show', $invoice->id)->with('success', "تم بيع الفاتورة وتسجيل الأرباح وتوزيعها على المستثمرين بنجاح (عملية بيع {$sale->sale_number}).");
        } catch (Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Quick Customer creation (kept for fallback)
     */
    public function storeCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        \App\Models\Customer::create($validated);

        return redirect()->back()->with('success', "تمت الإضافة بنجاح.");
    }
}
