<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceSaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_sale_id',
        'investor_id',
        'customer_id',
        'amount_usd',
        'exchange_rate',
        'amount_iqd',
        'customs_percentage',
        'amount_after_customs_usd',
        'customs_exchange_rate',
        'customs_amount_iqd',
        'amount_after_customs_iqd',
        'notes',
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_iqd' => 'decimal:2',
        'customs_percentage' => 'decimal:2',
        'amount_after_customs_usd' => 'decimal:2',
        'customs_exchange_rate' => 'decimal:4',
        'customs_amount_iqd' => 'decimal:2',
        'amount_after_customs_iqd' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(InvoiceSale::class, 'invoice_sale_id');
    }

    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
