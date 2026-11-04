<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'amount_usd',
        'exchange_rate',
        'amount_iqd',
        'tax_percentage',
        'tax_iqd',
        'total_iqd',
        'status',
        'paid_from_type',
        'paid_from_id',
        'investor_id',
        'purchase_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_iqd' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'tax_iqd' => 'decimal:2',
        'total_iqd' => 'decimal:2',
        'purchase_date' => 'date',
    ];

    public function sales()
    {
        return $this->hasMany(InvoiceSale::class);
    }

    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getSoldAmountUsdAttribute(): float
    {
        return (float) $this->sales()->sum('total_amount_usd');
    }

    public function getAvailableAmountUsdAttribute(): float
    {
        return max(0, (float) $this->amount_usd - $this->sold_amount_usd);
    }

    public function getTotalProfitIqdAttribute(): float
    {
        return (float) $this->sales()->sum('profit_iqd');
    }
}
