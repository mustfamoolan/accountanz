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
        // 1. Customers Table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('company_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 2. Invoices Table
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->decimal('amount_usd', 15, 2);
            $table->decimal('exchange_rate', 10, 4); // سعر صرف الشراء الأصلي (مثلاً: 1500)
            $table->decimal('amount_iqd', 18, 2);    // التكلفة بالدينار قبل الرسوم
            $table->decimal('tax_percentage', 5, 2)->default(0.00); // نسبة الضريبة / الكمارك
            $table->decimal('tax_iqd', 18, 2)->default(0.00);       // قيمة الضريبة
            $table->decimal('total_iqd', 18, 2);     // التكلفة الإجمالية بالدينار
            $table->enum('status', ['available', 'partial', 'sold'])->default('available');
            
            // التمويل والتخصيص
            $table->string('paid_from_type')->nullable(); // 'fund', 'bank', 'investor'
            $table->unsignedBigInteger('paid_from_id')->nullable();
            $table->foreignId('investor_id')->nullable()->constrained('investors')->nullOnDelete(); // إذا كانت الفاتورة مخصصة لمستثمر بعينه، وإلا عامة

            $table->date('purchase_date');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('invoice_number');
            $table->index('status');
            $table->index('purchase_date');
        });

        // 3. Invoice Sales Table (عملية بيع الفاتورة)
        Schema::create('invoice_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->string('sale_number')->unique();
            $table->date('sale_date');
            $table->decimal('total_amount_usd', 15, 2); // الكمية المباعة بالدولار في هذه العملية
            $table->decimal('total_amount_iqd', 18, 2); // إجمالي سعر البيع بالدينار المحصل من العملاء
            $table->decimal('cost_iqd', 18, 2);         // تكلفة الكمية المباعة بالدينار
            $table->decimal('profit_iqd', 18, 2);       // صافي ربح البيع بالدينار
            
            // جهة توريد المبالغ المحصلة
            $table->string('payment_destination_type')->default('fund'); // 'fund' or 'bank'
            $table->unsignedBigInteger('payment_destination_id')->default(1);
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 4. Invoice Sale Items (تفاصيل توزيع البيع لكل عميل)
        Schema::create('invoice_sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_sale_id')->constrained('invoice_sales')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers');
            $table->decimal('amount_usd', 15, 2);       // الكمية بالدولار للعميل
            $table->decimal('exchange_rate', 10, 4);    // سعر الصرف للعميل (مثلاً: 1530)
            $table->decimal('amount_iqd', 18, 2);       // المبلغ المستحق بالدينار
            $table->decimal('customs_percentage', 5, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 5. Invoice Profit Distributions to Investors (سجل توزيع أرباح الفاتورة على حصص المستثمرين)
        Schema::create('invoice_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_sale_id')->constrained('invoice_sales')->cascadeOnDelete();
            $table->foreignId('investor_id')->constrained('investors')->cascadeOnDelete();
            $table->decimal('share_percentage', 6, 2);  // نسبة المستثمر المحسوبة
            $table->decimal('profit_amount', 18, 2);    // حصته من الربح بالدينار
            $table->foreignId('treasury_transaction_id')->nullable()->constrained('treasury_transactions')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_distributions');
        Schema::dropIfExists('invoice_sale_items');
        Schema::dropIfExists('invoice_sales');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('customers');
    }
};
