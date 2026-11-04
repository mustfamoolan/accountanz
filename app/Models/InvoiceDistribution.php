<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceDistribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_sale_id',
        'investor_id',
        'share_percentage',
        'profit_amount',
        'treasury_transaction_id',
    ];

    protected $casts = [
        'share_percentage' => 'decimal:2',
        'profit_amount' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(InvoiceSale::class, 'invoice_sale_id');
    }

    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function transaction()
    {
        return $this->belongsTo(TreasuryTransaction::class, 'treasury_transaction_id');
    }
}
