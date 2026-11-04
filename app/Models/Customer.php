<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'company_name',
        'notes',
    ];

    public function saleItems()
    {
        return $this->hasMany(InvoiceSaleItem::class);
    }
}

