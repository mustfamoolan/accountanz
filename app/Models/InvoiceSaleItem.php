<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceSaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_sale_id',
        'customer_id',
        'amount_usd',
        'exchange_rate',
        'amount_iqd',
        'customs_percentage',
        'notes',
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_iqd' => 'decimal:2',
        'customs_percentage' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(InvoiceSale::class, 'invoice_sale_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}

