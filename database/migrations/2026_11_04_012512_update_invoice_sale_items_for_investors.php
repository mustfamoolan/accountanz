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
        Schema::table('invoice_sale_items', function (Blueprint $table) {
            $table->foreignId('investor_id')->nullable()->after('invoice_sale_id')->constrained('investors')->nullOnDelete();
            $table->unsignedBigInteger('customer_id')->nullable()->change();
            $table->decimal('amount_after_customs_usd', 15, 2)->nullable()->after('customs_percentage');
            $table->decimal('customs_exchange_rate', 15, 4)->nullable()->after('amount_after_customs_usd');
            $table->decimal('customs_amount_iqd', 18, 2)->nullable()->after('customs_exchange_rate');
            $table->decimal('amount_after_customs_iqd', 18, 2)->nullable()->after('customs_amount_iqd');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_sale_items', function (Blueprint $table) {
            $table->dropForeign(['investor_id']);
            $table->dropColumn([
                'investor_id',
                'amount_after_customs_usd',
                'customs_exchange_rate',
                'customs_amount_iqd',
                'amount_after_customs_iqd',
            ]);
        });
    }
};
