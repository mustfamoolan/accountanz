<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add is_permanent to investors
        if (!Schema::hasColumn('investors', 'is_permanent')) {
            Schema::table('investors', function (Blueprint $table) {
                $table->boolean('is_permanent')->default(false)->after('status')->comment('مستثمر دائم محمي من الحذف');
            });
        }

        // 2. Create periodic_inventories table
        Schema::create('periodic_inventories', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->date('inventory_date');

            // Dynamic items (Excel rows)
            $table->json('receivables_items')->nullable()->comment('نطلب (المدينون)');
            $table->json('payables_items')->nullable()->comment('مطلوبين (الدائنون)');
            $table->json('customs_items')->nullable()->comment('كمرك');
            $table->json('expenses_items')->nullable()->comment('نثريات');

            // Columns totals
            $table->decimal('total_receivables', 18, 2)->default(0);
            $table->decimal('total_payables', 18, 2)->default(0);
            $table->decimal('total_customs', 18, 2)->default(0);
            $table->decimal('total_expenses', 18, 2)->default(0);

            // Assets, liabilities and net worth
            $table->decimal('actual_cash', 18, 2)->default(0)->comment('كاش حقيقي (صناديق)');
            $table->decimal('bank_balance', 18, 2)->default(0)->comment('رصيد مصارف');
            $table->decimal('total_assets', 18, 2)->default(0)->comment('م/ موجودات = كاش + مصارف + نطلب');
            $table->decimal('total_liabilities', 18, 2)->default(0)->comment('م/ مطلوبات = مطلوبين + كمرك');
            $table->decimal('net_worth', 18, 2)->default(0)->comment('الموجود الكلي = موجودات - مطلوبات');
            $table->decimal('previous_net_worth', 18, 2)->default(0)->comment('موجود كلي سابق');
            $table->decimal('inventory_profit', 18, 2)->default(0)->comment('ربح آخر جرد = موجود كلي - سابق');

            // Special Account: "خاص محمد"
            $table->decimal('mohammed_opening_cash', 18, 2)->default(0)->comment('كاش محمد آخر جرد');
            $table->decimal('mohammed_outflow', 18, 2)->default(0)->comment('م/ صادر');
            $table->decimal('mohammed_inflow', 18, 2)->default(0)->comment('م/ وارد');
            $table->decimal('mohammed_expenses', 18, 2)->default(0)->comment('نثريات');
            $table->decimal('mohammed_assets', 18, 2)->default(0)->comment('الموجودات');
            $table->decimal('mohammed_cash_present', 18, 2)->default(0)->comment('الكاش الموجود');
            $table->decimal('mohammed_calculated_cash', 18, 2)->default(0)->comment('كاش محسوب');
            $table->decimal('mohammed_difference', 18, 2)->default(0)->comment('فارق الكاش');
            $table->decimal('mohammed_previous_net_worth', 18, 2)->default(0)->comment('موجود كلي سابق محمد');
            $table->decimal('mohammed_current_net_worth', 18, 2)->default(0)->comment('موجود كلي حاليا');

            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periodic_inventories');

        if (Schema::hasColumn('investors', 'is_permanent')) {
            Schema::table('investors', function (Blueprint $table) {
                $table->dropColumn('is_permanent');
            });
        }
    }
};

