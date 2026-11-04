<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'sale_number',
        'sale_date',
        'total_amount_usd',
        'total_amount_iqd',
        'cost_iqd',
        'profit_iqd',
        'payment_destination_type',
        'payment_destination_id',
        'created_by',
    ];

    protected $casts = [
        'total_amount_usd' => 'decimal:2',
        'total_amount_iqd' => 'decimal:2',
        'cost_iqd' => 'decimal:2',
        'profit_iqd' => 'decimal:2',
        'sale_date' => 'date',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceSaleItem::class);
    }

    public function distributions()
    {
        return $this->hasMany(InvoiceDistribution::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
