<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Investor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'code',
        'phone',
        'currency',
        'capital_balance',
        'profit_balance',
        'total_withdrawn_capital',
        'total_withdrawn_profits',
        'profit_rate',
        'status',
        'is_permanent',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'capital_balance' => 'decimal:2',
            'profit_balance' => 'decimal:2',
            'total_withdrawn_capital' => 'decimal:2',
            'total_withdrawn_profits' => 'decimal:2',
            'profit_rate' => 'decimal:2',
            'is_permanent' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(TreasuryTransaction::class)->latest('transaction_date');
    }

    public function invoicePurchases(): HasMany
    {
        return $this->hasMany(InvoiceSaleItem::class)->latest('created_at');
    }

    /**
     * Total Equity of Investor (Capital + Available Profits)
     */
    public function getTotalEquityAttribute(): float
    {
        return (float) $this->capital_balance + (float) $this->profit_balance;
    }
}

