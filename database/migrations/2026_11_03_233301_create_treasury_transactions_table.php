<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treasury_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no')->unique();
            $table->enum('type', [
                'deposit',
                'withdrawal',
                'transfer',
                'capital_deposit',
                'capital_withdrawal',
                'profit_distribution',
                'profit_withdrawal',
                'expense',
            ]);
            $table->string('source_type')->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('destination_type')->nullable();
            $table->unsignedBigInteger('destination_id')->nullable();
            $table->foreignId('investor_id')->nullable()->constrained('investors')->nullOnDelete();
            $table->decimal('amount', 18, 2);
            $table->string('currency', 10)->default('IQD');
            $table->decimal('balance_before', 18, 2)->default(0.00);
            $table->decimal('balance_after', 18, 2)->default(0.00);
            $table->text('description');
            $table->timestamp('transaction_date')->useCurrent();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['source_type', 'source_id']);
            $table->index(['destination_type', 'destination_id']);
            $table->index('transaction_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treasury_transactions');
    }
};
