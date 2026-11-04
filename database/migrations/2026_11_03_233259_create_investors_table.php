<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('phone')->nullable();
            $table->string('currency', 10)->default('IQD');
            $table->decimal('capital_balance', 18, 2)->default(0.00);
            $table->decimal('profit_balance', 18, 2)->default(0.00);
            $table->decimal('total_withdrawn_capital', 18, 2)->default(0.00);
            $table->decimal('total_withdrawn_profits', 18, 2)->default(0.00);
            $table->decimal('profit_rate', 5, 2)->default(0.00);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investors');
    }
};
