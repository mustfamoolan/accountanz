<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\Invoice;
use App\Models\User;
use App\Services\TreasuryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceSystemTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Fund $mainFundIqd;
    protected Fund $mainFundUsd;
    protected TreasuryService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'username' => 'admin_test',
        ]);

        $this->service = app(TreasuryService::class);

        $this->mainFundIqd = Fund::create([
            'name' => 'الصندوق الرئيسي (دينار)',
            'code' => 'FUND-MAIN-IQD',
            'type' => 'main',
            'currency' => 'IQD',
            'balance' => 100000000.00,
            'status' => 'active',
        ]);

        $this->mainFundUsd = Fund::create([
            'name' => 'الصندوق الرئيسي (دولار)',
            'code' => 'FUND-MAIN-USD',
            'type' => 'main',
            'currency' => 'USD',
            'balance' => 50000.00,
            'status' => 'active',
        ]);
    }

    public function test_can_purchase_invoice()
    {
        $this->actingAs($this->admin);

        $response = $this->post('/invoices', [
            'invoice_number' => 'INV-TEST-001',
            'amount_usd' => 10000,
            'exchange_rate' => 1500,
            'tax_percentage' => 5,
            'paid_from_type' => 'fund',
            'paid_from_id' => $this->mainFundUsd->id,
            'purchase_date' => now()->toDateString(),
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('invoices', [
            'invoice_number' => 'INV-TEST-001',
            'amount_usd' => 10000,
            'exchange_rate' => 1500,
            'amount_iqd' => 15000000,
            'tax_iqd' => 750000,
            'total_iqd' => 15750000,
            'status' => 'available',
        ]);

        // Verifies deduction from fund
        $this->assertEquals(40000.00, $this->mainFundUsd->fresh()->balance);
    }

    public function test_selling_invoice_distributes_profits_to_investors_by_capital_share()
    {
        $this->actingAs($this->admin);

        // Setup 2 active investors:
        // Investor A: 30,000,000 IQD (60%)
        // Investor B: 20,000,000 IQD (40%)
        // Total Capital = 50,000,000 IQD
        $invA = Investor::create([
            'name' => 'المستثمر أحمد',
            'code' => 'INV-A',
            'currency' => 'IQD',
            'capital_balance' => 30000000.00,
            'profit_balance' => 0.00,
            'status' => 'active',
        ]);

        $invB = Investor::create([
            'name' => 'المستثمر بلال',
            'code' => 'INV-B',
            'currency' => 'IQD',
            'capital_balance' => 20000000.00,
            'profit_balance' => 0.00,
            'status' => 'active',
        ]);

        // Create Customer
        $customer = Customer::create([
            'name' => 'شركة البشير',
            'phone' => '07700000000',
        ]);

        // Create Invoice: 10,000 $ @ 1,500 = 15,000,000 IQD cost
        $invoice = Invoice::create([
            'invoice_number' => 'INV-TEST-002',
            'amount_usd' => 10000,
            'exchange_rate' => 1500,
            'amount_iqd' => 15000000,
            'tax_percentage' => 0,
            'tax_iqd' => 0,
            'total_iqd' => 15000000,
            'status' => 'available',
            'purchase_date' => now()->toDateString(),
            'created_by' => $this->admin->id,
        ]);

        $fundBalanceBefore = (float) $this->mainFundIqd->balance;

        // Sell 10,000 $ @ 1,530 = 15,300,000 IQD to Investor A
        // Profit = 15,300,000 - 15,000,000 = 300,000 IQD
        // Investor A gets 60% = 180,000 IQD
        // Investor B gets 40% = 120,000 IQD
        $response = $this->post("/invoices/{$invoice->id}/sell", [
            'sale_date' => now()->toDateString(),
            'payment_destination_type' => 'fund',
            'payment_destination_id' => $this->mainFundIqd->id,
            'investors' => [
                [
                    'investor_id' => $invA->id,
                    'amount_usd' => 10000,
                    'exchange_rate' => 1530,
                    'customs_percentage' => 0,
                    'customs_exchange_rate' => 1530,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();

        // 1. Invoice status should be sold
        $this->assertEquals('sold', $invoice->fresh()->status);

        // 2. Proceeds (15,300,000 IQD) deposited into main Fund
        $this->assertEquals($fundBalanceBefore + 15300000.00, (float) $this->mainFundIqd->fresh()->balance);

        // 3. Profits distributed accurately
        $this->assertEquals(180000.00, (float) $invA->fresh()->profit_balance);
        $this->assertEquals(120000.00, (float) $invB->fresh()->profit_balance);

        // 4. Distribution table contains records
        $this->assertDatabaseHas('invoice_distributions', [
            'investor_id' => $invA->id,
            'profit_amount' => 180000.00,
            'share_percentage' => 60.00,
        ]);

        $this->assertDatabaseHas('invoice_distributions', [
            'investor_id' => $invB->id,
            'profit_amount' => 120000.00,
            'share_percentage' => 40.00,
        ]);

        // 5. Invoice Sale Item is linked to Investor A
        $this->assertDatabaseHas('invoice_sale_items', [
            'investor_id' => $invA->id,
            'amount_usd' => 10000.00,
            'exchange_rate' => 1530.00,
        ]);

        // 6. Investor show page displays purchases
        $showResponse = $this->get("/investors/{$invA->id}");
        $showResponse->assertOk();
        $showResponse->assertInertia(fn ($page) => $page
            ->component('Investors/Show')
            ->has('invoicePurchases', 1)
        );
    }

    public function test_can_create_new_fund_with_currency()
    {
        $this->actingAs($this->admin);

        $response = $this->post('/treasury/funds', [
            'name' => 'صندوق أربيل (دولار)',
            'code' => 'FUND-ERBIL-USD',
            'currency' => 'USD',
            'type' => 'sub',
            'initial_balance' => 5000,
            'notes' => 'فرع أربيل',
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('funds', [
            'code' => 'FUND-ERBIL-USD',
            'currency' => 'USD',
            'balance' => 5000.00,
        ]);
    }
}

