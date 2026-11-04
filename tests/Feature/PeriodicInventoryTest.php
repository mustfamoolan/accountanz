<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\PeriodicInventory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeriodicInventoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Fund $mainFund;
    protected Bank $bank;
    protected Investor $mohammed;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->mainFund = Fund::create([
            'name' => 'الصندوق الرئيسي',
            'code' => 'FUND-TEST',
            'type' => 'main',
            'currency' => 'IQD',
            'balance' => 50000000.00,
            'status' => 'active',
        ]);

        $this->bank = Bank::create([
            'name' => 'مصرف بغداد',
            'account_number' => 'ACC-TEST',
            'currency' => 'IQD',
            'balance' => 20000000.00,
            'status' => 'active',
        ]);

        $this->mohammed = Investor::create([
            'name' => 'محمد',
            'code' => 'INV-MOHAMMED',
            'currency' => 'IQD',
            'capital_balance' => 15000000.00,
            'profit_balance' => 0.00,
            'status' => 'active',
            'is_permanent' => true,
        ]);
    }

    public function test_can_view_inventories_index_page()
    {
        $this->actingAs($this->admin);

        $response = $this->get('/inventories');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Inventories/Index'));
    }

    public function test_can_view_create_inventory_page_with_prefilled_cash_and_banks()
    {
        $this->actingAs($this->admin);

        $response = $this->get('/inventories/create');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Inventories/Create')
            ->where('systemActualCash', 50000000)
            ->where('systemBankBalance', 20000000)
            ->where('mohammedOpeningCash', 15000000)
        );
    }

    public function test_storing_inventory_calculates_exact_accounting_formulas_and_special_account()
    {
        $this->actingAs($this->admin);

        // Simulation parameters:
        // Cash in fund = 50,000,000 IQD
        // Banks = 20,000,000 IQD
        // Receivables (نطلب) = 10,000,000 IQD
        // -> Total Assets = 50m + 20m + 10m = 80,000,000 IQD
        // Payables (مطلوبين) = 15,000,000 IQD
        // Customs (كمرك) = 5,000,000 IQD
        // -> Total Liabilities = 15m + 5m = 20,000,000 IQD
        // -> Net Worth (الموجود الكلي) = 80m - 20m = 60,000,000 IQD
        // Previous Net Worth = 55,000,000 IQD
        // -> Inventory Profit = 60m - 55m = 5,000,000 IQD
        //
        // Special Account "خاص محمد":
        // Opening cash = 10,000,000 IQD
        // Inflows = 3,000,000 IQD
        // Outflows = 2,000,000 IQD
        // Expenses = 500,000 IQD
        // -> Calculated Cash = (10m + 3m) - (2m + 0.5m) = 10,500,000 IQD
        // Cash Present = 10,500,000 IQD -> Difference = 0 (مطابق)
        $payload = [
            'title' => 'جرد تجريبي شامل',
            'inventory_date' => now()->toDateString(),
            'actual_cash' => 50000000,
            'bank_balance' => 20000000,
            'previous_net_worth' => 55000000,
            'receivables' => [
                ['amount' => 10000000, 'details' => 'شركة النور'],
            ],
            'payables' => [
                ['amount' => 15000000, 'details' => 'المورد الصيني'],
            ],
            'customs' => [
                ['amount' => 5000000, 'details' => 'كمرك ميناء أم قصر'],
            ],
            'expenses' => [
                ['amount' => 1000000, 'details' => 'نثريات تشغيلية'],
            ],
            'mohammed_opening_cash' => 10000000,
            'mohammed_inflow' => 3000000,
            'mohammed_outflow' => 2000000,
            'mohammed_expenses' => 500000,
            'mohammed_assets' => 0,
            'mohammed_cash_present' => 10500000,
            'notes' => 'ملاحظات الفحص',
        ];

        $response = $this->post('/inventories', $payload);

        $response->assertSessionHasNoErrors();

        $inventory = PeriodicInventory::latest()->first();
        $this->assertNotNull($inventory);

        // Assert accounting equations:
        $this->assertEquals(80000000.00, (float) $inventory->total_assets);
        $this->assertEquals(20000000.00, (float) $inventory->total_liabilities);
        $this->assertEquals(60000000.00, (float) $inventory->net_worth);
        $this->assertEquals(5000000.00, (float) $inventory->inventory_profit);

        // Assert Special Account equations:
        $this->assertEquals(10500000.00, (float) $inventory->mohammed_calculated_cash);
        $this->assertEquals(0.00, (float) $inventory->mohammed_difference);
        $this->assertEquals(60000000.00, (float) $inventory->mohammed_current_net_worth);

        $response->assertRedirect("/inventories/{$inventory->id}");
    }

    public function test_permanent_investor_mohammed_cannot_be_deleted()
    {
        $this->actingAs($this->admin);

        $response = $this->delete("/investors/{$this->mohammed->id}");

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('investors', [
            'id' => $this->mohammed->id,
            'is_permanent' => true,
        ]);
    }
}

