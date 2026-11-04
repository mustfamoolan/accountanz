<?php

namespace Database\Seeders;

use App\Models\Fund;
use App\Models\Investor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin User Only (المدير العام فقط)
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'المدير العام',
                'phone' => '07700000000',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // 2. Main Company Cash Fund (الصندوق الرئيسي - برصيد 0)
        Fund::updateOrCreate(
            ['code' => 'FUND-MAIN'],
            [
                'name' => 'الصندوق الرئيسي للشركة',
                'type' => 'main',
                'currency' => 'IQD',
                'balance' => 0.00,
                'status' => 'active',
                'notes' => 'الخزينة النقدية الرئيسية للمركز',
            ]
        );

        // 3. Permanent System Investor "محمد" (المستثمر الثابت محمد فقط - برصيد 0)
        Investor::updateOrCreate(
            ['code' => 'INV-MOHAMMED'],
            [
                'name' => 'محمد',
                'phone' => null,
                'currency' => 'IQD',
                'capital_balance' => 0.00,
                'profit_balance' => 0.00,
                'total_withdrawn_capital' => 0.00,
                'total_withdrawn_profits' => 0.00,
                'profit_rate' => 0.00,
                'status' => 'active',
                'is_permanent' => true,
                'notes' => 'مستثمر النظام الثابت - مرتبط بكشوفات الجرد والميزانية وحساب (خاص محمد)',
            ]
        );
    }
}
