<?php

namespace Database\Seeders;

use App\Models\Bank;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\User;
use App\Services\TreasuryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Users
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'المدير العام',
                'phone' => '07701234567',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        $accountant = User::updateOrCreate(
            ['username' => 'accountant'],
            [
                'name' => 'علي المحاسب',
                'phone' => '07801234567',
                'password' => Hash::make('password'),
                'role' => 'accountant',
            ]
        );

        $investorUser = User::updateOrCreate(
            ['username' => 'investor'],
            [
                'name' => 'أحمد المستثمر',
                'phone' => null,
                'password' => Hash::make('password'),
                'role' => 'investor',
            ]
        );

        // 2. Main Company Fund
        $mainFund = Fund::updateOrCreate(
            ['code' => 'FUND-MAIN'],
            [
                'name' => 'الصندوق الرئيسي للشركة',
                'type' => 'main',
                'currency' => 'IQD',
                'balance' => 0.00,
                'status' => 'active',
                'notes' => 'الخزينة النقدية الرئيسية للمركز والمبيعات',
            ]
        );

        // 3. Banks
        $tbiBank = Bank::updateOrCreate(
            ['account_number' => '20083921'],
            [
                'name' => 'المصرف العراقي للتجارة TBI',
                'iban' => 'IQ66TBII0000200839210001',
                'currency' => 'IQD',
                'branch' => 'الفرع الرئيسي - الكرادة',
                'balance' => 0.00,
                'status' => 'active',
                'notes' => 'حساب الحوالات والاعتمادات المستندية',
            ]
        );

        $baghdadBank = Bank::updateOrCreate(
            ['account_number' => '10048291'],
            [
                'name' => 'مصرف بغداد',
                'iban' => 'IQ44BBOB0000100482910001',
                'currency' => 'IQD',
                'branch' => 'فرع المنصور',
                'balance' => 0.00,
                'status' => 'active',
                'notes' => 'حساب العمليات اليومية والشيكات',
            ]
        );

        // 4. Initial Cash Inflow using TreasuryService
        $service = app(TreasuryService::class);

        // If balances are zero, inject realistic test balances
        if ($mainFund->balance == 0) {
            $service->deposit($mainFund, 25000000, 'رأس مال افتتاحي للشركة في الصندوق النقدي', $admin->id);
        }

        if ($tbiBank->balance == 0) {
            $service->deposit($tbiBank, 35000000, 'رصيد افتتاحي في المصرف العراقي للتجارة TBI', $admin->id);
        }

        if ($baghdadBank->balance == 0) {
            $service->deposit($baghdadBank, 15000000, 'رصيد افتتاحي في مصرف بغداد', $admin->id);
        }

        // 5. Investors
        $inv1 = Investor::updateOrCreate(
            ['code' => 'INV-001'],
            [
                'name' => 'الحاج مصطفى الزبيدي',
                'phone' => '07701122334',
                'currency' => 'IQD',
                'capital_balance' => 0.00,
                'profit_balance' => 0.00,
                'total_withdrawn_capital' => 0.00,
                'total_withdrawn_profits' => 0.00,
                'profit_rate' => 20.00,
                'status' => 'active',
                'notes' => 'شريك رئيسي بحصة 20% من الأرباح الاستثمارية',
            ]
        );

        $inv2 = Investor::updateOrCreate(
            ['code' => 'INV-002'],
            [
                'name' => 'السيد حيدر المعموري',
                'phone' => '07802233445',
                'currency' => 'IQD',
                'capital_balance' => 0.00,
                'profit_balance' => 0.00,
                'total_withdrawn_capital' => 0.00,
                'total_withdrawn_profits' => 0.00,
                'profit_rate' => 15.00,
                'status' => 'active',
                'notes' => 'شريك مستثمر',
            ]
        );

        $inv3 = Investor::updateOrCreate(
            ['code' => 'INV-003'],
            [
                'user_id' => $investorUser->id,
                'name' => 'أحمد المستثمر',
                'phone' => '07903344556',
                'currency' => 'IQD',
                'capital_balance' => 0.00,
                'profit_balance' => 0.00,
                'total_withdrawn_capital' => 0.00,
                'total_withdrawn_profits' => 0.00,
                'profit_rate' => 10.00,
                'status' => 'active',
                'notes' => 'مستثمر مرتبط بحساب المستخدم investor',
            ]
        );

        // Inject initial investor capital and profits if not yet set
        if ($inv1->capital_balance == 0) {
            $service->investorDepositCapital($inv1, $mainFund, 20000000, 'إيداع رأس مال تأسيسي للحاج مصطفى نقداً', $admin->id);
            $service->investorDistributeProfit($inv1, 2500000, 'توزيع أرباح الربع الثالث للمستثمر مصطفى الزبيدي', $admin->id);
        }

        if ($inv2->capital_balance == 0) {
            $service->investorDepositCapital($inv2, $tbiBank, 15000000, 'إيداع رأس مال السيد حيدر عبر حوالة TBI', $admin->id);
            $service->investorDistributeProfit($inv2, 1800000, 'توزيع أرباح الربع الثالث للسيد حيدر', $admin->id);
        }

        if ($inv3->capital_balance == 0) {
            $service->investorDepositCapital($inv3, $baghdadBank, 10000000, 'إيداع رأس مال أحمد المستثمر عبر مصرف بغداد', $admin->id);
            $service->investorDistributeProfit($inv3, 950000, 'أرباح استثمارية عن شهر تشرين الأول', $admin->id);
        }
    }
}
