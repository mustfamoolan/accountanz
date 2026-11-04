<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Fund extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'type',
        'currency',
        'balance',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    public function transactionsAsSource(): MorphMany
    {
        return $this->morphMany(TreasuryTransaction::class, 'source');
    }

    public function transactionsAsDestination(): MorphMany
    {
        return $this->morphMany(TreasuryTransaction::class, 'destination');
    }

    public function expenses(): MorphMany
    {
        return $this->morphMany(Expense::class, 'source');
    }
}

