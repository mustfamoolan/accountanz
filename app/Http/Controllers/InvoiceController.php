<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\Customer;
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

        $invoices = $query->paginate(15)->withQueryString();

        // Summary Statistics
        $totalInvoicesCount = Invoice::count();
        $totalAmountUsd = (float) Invoice::sum('amount_usd');
        $totalAmountIqd = (float) Invoice::sum('total_iqd');
        $totalProfitIqd = (float) InvoiceSale::sum('profit_iqd');
        $availableInvoicesCount = Invoice::whereIn('status', ['available', 'partial'])->count();

        // Support data for modals and filters
        $investors = Investor::where('status', 'active')->select('id', 'name', 'code', 'capital_balance', 'profit_rate')->get();
        $funds = Fund::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();
        $banks = Bank::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();
        $customers = Customer::orderBy('name')->get();

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
            'funds' => $funds,
            'banks' => $banks,
            'customers' => $customers,
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
            return redirect()->back()->with('success', "تم تسجيل الفاتورة [{$invoice->invoice_number}] بنجاح.");
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
            'sales.items.customer',
            'sales.distributions.investor',
            'sales.createdBy',
        ])->findOrFail($id);

        $funds = Fund::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();
        $banks = Bank::where('status', 'active')->select('id', 'name', 'currency', 'balance')->get();
        $customers = Customer::orderBy('name')->get();

        return Inertia::render('Invoices/Show', [
            'invoice' => $invoice,
            'funds' => $funds,
            'banks' => $banks,
            'customers' => $customers,
        ]);
    }

    /**
     * Sell whole or partial amount of an invoice
     */
    public function sell(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'sale_date' => 'required|date',
            'payment_destination_type' => 'required|in:fund,bank',
            'payment_destination_id' => 'required|integer',
            'customers' => 'required|array|min:1',
            'customers.*.customer_id' => 'required|exists:customers,id',
            'customers.*.amount_usd' => 'required|numeric|min:0.01',
            'customers.*.exchange_rate' => 'required|numeric|min:0.0001',
            'customers.*.customs_percentage' => 'nullable|numeric|min:0',
            'customers.*.notes' => 'nullable|string',
        ]);

        try {
            $sale = $this->treasuryService->sellInvoice($invoice, $validated, auth()->id());
            return redirect()->back()->with('success', "تم بيع الفاتورة وتسجيل الأرباح وتوزيعها على المستثمرين بنجاح (عملية بيع {$sale->sale_number}).");
        } catch (Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Quick Customer creation
     */
    public function storeCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create($validated);

        return redirect()->back()->with('success', "تم إضافة العميل [{$customer->name}] بنجاح.");
    }
}

