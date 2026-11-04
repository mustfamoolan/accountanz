<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class TreasuryTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_no',
        'type',
        'source_type',
        'source_id',
        'destination_type',
        'destination_id',
        'investor_id',
        'amount',
        'currency',
        'balance_before',
        'balance_after',
        'description',
        'transaction_date',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_before' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'transaction_date' => 'datetime',
        ];
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function destination(): MorphTo
    {
        return $this->morphTo();
    }

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Type label in Arabic
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'deposit' => 'إيداع نقدي',
            'withdrawal' => 'سحب نقدي',
            'transfer' => 'تحويل مالي',
            'capital_deposit' => 'إيداع رأس مال',
            'capital_withdrawal' => 'سحب رأس مال',
            'profit_distribution' => 'إثبات أرباح مستثمر',
            'profit_withdrawal' => 'سحب أرباح مستثمر',
            'expense' => 'مصروف تشغيلي',
            default => $this->type,
        };
    }
}

