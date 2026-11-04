<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeriodicInventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'inventory_date',
        'receivables_items',
        'payables_items',
        'customs_items',
        'expenses_items',
        'total_receivables',
        'total_payables',
        'total_customs',
        'total_expenses',
        'actual_cash',
        'bank_balance',
        'total_assets',
        'total_liabilities',
        'net_worth',
        'previous_net_worth',
        'inventory_profit',
        'mohammed_opening_cash',
        'mohammed_outflow',
        'mohammed_inflow',
        'mohammed_expenses',
        'mohammed_assets',
        'mohammed_cash_present',
        'mohammed_calculated_cash',
        'mohammed_difference',
        'mohammed_previous_net_worth',
        'mohammed_current_net_worth',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'inventory_date' => 'date',
            'receivables_items' => 'array',
            'payables_items' => 'array',
            'customs_items' => 'array',
            'expenses_items' => 'array',
            'total_receivables' => 'decimal:2',
            'total_payables' => 'decimal:2',
            'total_customs' => 'decimal:2',
            'total_expenses' => 'decimal:2',
            'actual_cash' => 'decimal:2',
            'bank_balance' => 'decimal:2',
            'total_assets' => 'decimal:2',
            'total_liabilities' => 'decimal:2',
            'net_worth' => 'decimal:2',
            'previous_net_worth' => 'decimal:2',
            'inventory_profit' => 'decimal:2',
            'mohammed_opening_cash' => 'decimal:2',
            'mohammed_outflow' => 'decimal:2',
            'mohammed_inflow' => 'decimal:2',
            'mohammed_expenses' => 'decimal:2',
            'mohammed_assets' => 'decimal:2',
            'mohammed_cash_present' => 'decimal:2',
            'mohammed_calculated_cash' => 'decimal:2',
            'mohammed_difference' => 'decimal:2',
            'mohammed_previous_net_worth' => 'decimal:2',
            'mohammed_current_net_worth' => 'decimal:2',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

