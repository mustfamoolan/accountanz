<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\User;
use App\Services\TreasuryService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TreasurySystemTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected TreasuryService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->admin = User::where('role', 'admin')->first();
        $this->service = app(TreasuryService::class);
    }

    public function test_treasury_page_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/treasury');
        $response->assertStatus(200);
    }

    public function test_banks_page_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/banks');
        $response->assertStatus(200);
    }

    public function test_investors_pages_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/investors');
        $response->assertStatus(200);

        $investor = Investor::first();
        $showResponse = $this->actingAs($this->admin)->get("/investors/{$investor->id}");
        $showResponse->assertStatus(200);
    }

    public function test_fund_deposit_and_withdrawal_updates_balance_and_ledger(): void
    {
        $fund = Fund::where('code', 'FUND-MAIN')->first();
        $initialBalance = (float) $fund->balance;

        // 1. Deposit
        $txDeposit = $this->service->deposit($fund, 1000000, 'إيداع تجريبي للاختبار', $this->admin->id);
        $fund->refresh();

        $this->assertEquals($initialBalance + 1000000, (float) $fund->balance);
        $this->assertEquals('deposit', $txDeposit->type);
        $this->assertEquals(1000000, (float) $txDeposit->amount);

        // 2. Withdrawal
        $txWithdraw = $this->service->withdraw($fund, 400000, 'سحب تجريبي للاختبار', $this->admin->id);
        $fund->refresh();

        $this->assertEquals($initialBalance + 600000, (float) $fund->balance);
        $this->assertEquals('withdrawal', $txWithdraw->type);
        $this->assertEquals(400000, (float) $txWithdraw->amount);
    }

    public function test_cannot_overdraw_from_fund(): void
    {
        $fund = Fund::where('code', 'FUND-MAIN')->first();
        $excessiveAmount = (float) $fund->balance + 999999999;

        $this->expectException(\Exception::class);
        $this->service->withdraw($fund, $excessiveAmount, 'محاولة سحب تفوق الرصيد', $this->admin->id);
    }

    public function test_transfer_between_fund_and_bank(): void
    {
        $fund = Fund::where('code', 'FUND-MAIN')->first();
        $bank = Bank::first();

        $fundBefore = (float) $fund->balance;
        $bankBefore = (float) $bank->balance;

        $this->service->transfer($fund, $bank, 500000, 'تحويل من الصندوق إلى البنك', $this->admin->id);

        $fund->refresh();
        $bank->refresh();

        $this->assertEquals($fundBefore - 500000, (float) $fund->balance);
        $this->assertEquals($bankBefore + 500000, (float) $bank->balance);
    }

    public function test_investor_capital_deposit_and_withdrawal(): void
    {
        $fund = Fund::where('code', 'FUND-MAIN')->first();
        $investor = Investor::first();

        $invCapBefore = (float) $investor->capital_balance;
        $fundBefore = (float) $fund->balance;

        // Deposit capital: increases investor capital and enters fund
        $this->service->investorDepositCapital($investor, $fund, 2000000, 'إيداع رأس مال إضافي', $this->admin->id);

        $investor->refresh();
        $fund->refresh();

        $this->assertEquals($invCapBefore + 2000000, (float) $investor->capital_balance);
        $this->assertEquals($fundBefore + 2000000, (float) $fund->balance);

        // Withdraw capital: decreases investor capital and exits fund
        $this->service->investorWithdrawCapital($investor, $fund, 500000, 'استرداد جزء من رأس المال', $this->admin->id);

        $investor->refresh();
        $fund->refresh();

        $this->assertEquals($invCapBefore + 1500000, (float) $investor->capital_balance);
        $this->assertEquals($fundBefore + 1500000, (float) $fund->balance);
        $this->assertEquals(500000, (float) $investor->total_withdrawn_capital);
    }

    public function test_investor_profit_distribution_and_withdrawal(): void
    {
        $fund = Fund::where('code', 'FUND-MAIN')->first();
        $investor = Investor::first();

        $profitBefore = (float) $investor->profit_balance;
        $fundBefore = (float) $fund->balance;

        // Distribute profits: increases investor profit balance
        $this->service->investorDistributeProfit($investor, 1200000, 'توزيع أرباح شهرية', $this->admin->id);

        $investor->refresh();
        $this->assertEquals($profitBefore + 1200000, (float) $investor->profit_balance);

        // Withdraw profits: decreases investor profit balance and exits cash fund
        $this->service->investorWithdrawProfit($investor, $fund, 700000, 'صرف أرباح نقدية', $this->admin->id);

        $investor->refresh();
        $fund->refresh();

        $this->assertEquals($profitBefore + 500000, (float) $investor->profit_balance);
        $this->assertEquals($fundBefore - 700000, (float) $fund->balance);
        $this->assertEquals(700000, (float) $investor->total_withdrawn_profits);
    }
}

