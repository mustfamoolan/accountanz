<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\Expense;
use App\Models\Fund;
use App\Models\Investor;
use App\Models\Invoice;
use App\Models\InvoiceSale;
use App\Models\InvoiceSaleItem;
use App\Models\InvoiceDistribution;
use App\Models\Customer;
use App\Models\TreasuryTransaction;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TreasuryService
{
    /**
     * Generate unique reference number (e.g. TX-20261104-1234)
     */
    protected function generateReference(): string
    {
        $date = date('Ymd');
        $random = strtoupper(Str::random(4));
        return "TX-{$date}-{$random}";
    }

    /**
     * General Deposit into Fund or Bank
     */
    public function deposit($target, float $amount, string $description, ?int $userId = null, ?string $transactionDate = null): TreasuryTransaction
    {
        if ($amount <= 0) {
            throw new Exception("يجب أن يكون مبلغ الإيداع أكبر من الصفر.");
        }

        return DB::transaction(function () use ($target, $amount, $description, $userId, $transactionDate) {
            $locked = get_class($target)::where('id', $target->id)->lockForUpdate()->first();

            $before = (float) $locked->balance;
            $after = $before + $amount;

            $locked->balance = $after;
            $locked->save();

            return TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'deposit',
                'source_type' => null,
                'source_id' => null,
                'destination_type' => get_class($locked),
                'destination_id' => $locked->id,
                'amount' => $amount,
                'currency' => $locked->currency,
                'balance_before' => $before,
                'balance_after' => $after,
                'description' => $description,
                'transaction_date' => $transactionDate ? \Carbon\Carbon::parse($transactionDate) : now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * General Withdrawal from Fund or Bank
     */
    public function withdraw($source, float $amount, string $description, ?int $userId = null, ?string $transactionDate = null): TreasuryTransaction
    {
        if ($amount <= 0) {
            throw new Exception("يجب أن يكون مبلغ السحب أكبر من الصفر.");
        }

        return DB::transaction(function () use ($source, $amount, $description, $userId, $transactionDate) {
            $locked = get_class($source)::where('id', $source->id)->lockForUpdate()->first();

            $before = (float) $locked->balance;
            if ($before < $amount) {
                throw new Exception("الرصيد المتوفر غير كافٍ. الرصيد الحالي: " . number_format($before, 2));
            }

            $after = $before - $amount;
            $locked->balance = $after;
            $locked->save();

            return TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'withdrawal',
                'source_type' => get_class($locked),
                'source_id' => $locked->id,
                'destination_type' => null,
                'destination_id' => null,
                'amount' => $amount,
                'currency' => $locked->currency,
                'balance_before' => $before,
                'balance_after' => $after,
                'description' => $description,
                'transaction_date' => $transactionDate ? \Carbon\Carbon::parse($transactionDate) : now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * Transfer between Funds/Banks
     */
    public function transfer($fromSource, $toDestination, float $amount, string $description, ?int $userId = null): TreasuryTransaction
    {
        if ($amount <= 0) {
            throw new Exception("يجب أن يكون مبلغ التحويل أكبر من الصفر.");
        }

        if (get_class($fromSource) === get_class($toDestination) && $fromSource->id === $toDestination->id) {
            throw new Exception("لا يمكن التحويل لنفس الحساب أو الصندوق.");
        }

        return DB::transaction(function () use ($fromSource, $toDestination, $amount, $description, $userId) {
            $lockedFrom = get_class($fromSource)::where('id', $fromSource->id)->lockForUpdate()->first();
            $lockedTo = get_class($toDestination)::where('id', $toDestination->id)->lockForUpdate()->first();

            $fromBefore = (float) $lockedFrom->balance;
            if ($fromBefore < $amount) {
                throw new Exception("رصيد الجهة المحول منها غير كافٍ.");
            }

            $fromAfter = $fromBefore - $amount;
            $lockedFrom->balance = $fromAfter;
            $lockedFrom->save();

            $toBefore = (float) $lockedTo->balance;
            $toAfter = $toBefore + $amount;
            $lockedTo->balance = $toAfter;
            $lockedTo->save();

            return TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'transfer',
                'source_type' => get_class($lockedFrom),
                'source_id' => $lockedFrom->id,
                'destination_type' => get_class($lockedTo),
                'destination_id' => $lockedTo->id,
                'amount' => $amount,
                'currency' => $lockedFrom->currency,
                'balance_before' => $fromBefore,
                'balance_after' => $fromAfter,
                'description' => $description . " (تحويل من {$lockedFrom->name} إلى {$lockedTo->name})",
                'transaction_date' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * Investor Deposits Capital (Enters company Fund or Bank)
     */
    public function investorDepositCapital(Investor $investor, $targetMoneySource, float $amount, string $description, ?int $userId = null): TreasuryTransaction
    {
        if ($amount <= 0) {
            throw new Exception("مبلغ رأس المال يجب أن يكون أكبر من الصفر.");
        }

        return DB::transaction(function () use ($investor, $targetMoneySource, $amount, $description, $userId) {
            $lockedInvestor = Investor::where('id', $investor->id)->lockForUpdate()->first();
            $lockedSource = get_class($targetMoneySource)::where('id', $targetMoneySource->id)->lockForUpdate()->first();

            // Increase Investor Capital
            $investorBefore = (float) $lockedInvestor->capital_balance;
            $lockedInvestor->capital_balance = $investorBefore + $amount;
            $lockedInvestor->save();

            // Increase Company Fund / Bank Balance
            $sourceBefore = (float) $lockedSource->balance;
            $sourceAfter = $sourceBefore + $amount;
            $lockedSource->balance = $sourceAfter;
            $lockedSource->save();

            return TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'capital_deposit',
                'source_type' => Investor::class,
                'source_id' => $lockedInvestor->id,
                'destination_type' => get_class($lockedSource),
                'destination_id' => $lockedSource->id,
                'investor_id' => $lockedInvestor->id,
                'amount' => $amount,
                'currency' => $lockedInvestor->currency,
                'balance_before' => $sourceBefore,
                'balance_after' => $sourceAfter,
                'description' => "إيداع رأس مال للمستثمر [{$lockedInvestor->name}]: {$description}",
                'transaction_date' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * Investor Withdraws Capital (Exits company Fund or Bank)
     */
    public function investorWithdrawCapital(Investor $investor, $sourceMoneySource, float $amount, string $description, ?int $userId = null): TreasuryTransaction
    {
        if ($amount <= 0) {
            throw new Exception("مبلغ السحب يجب أن يكون أكبر من الصفر.");
        }

        return DB::transaction(function () use ($investor, $sourceMoneySource, $amount, $description, $userId) {
            $lockedInvestor = Investor::where('id', $investor->id)->lockForUpdate()->first();
            $lockedSource = get_class($sourceMoneySource)::where('id', $sourceMoneySource->id)->lockForUpdate()->first();

            // Check investor capital
            $investorCap = (float) $lockedInvestor->capital_balance;
            if ($investorCap < $amount) {
                throw new Exception("رأس مال المستثمر الحالي لا يكفي. المتوفر: " . number_format($investorCap, 2));
            }

            // Check cash in Fund/Bank
            $sourceBefore = (float) $lockedSource->balance;
            if ($sourceBefore < $amount) {
                throw new Exception("رصيد الصندوق أو البنك غير كافٍ لسحب رأس المال.");
            }

            $lockedInvestor->capital_balance = $investorCap - $amount;
            $lockedInvestor->total_withdrawn_capital = (float) $lockedInvestor->total_withdrawn_capital + $amount;
            $lockedInvestor->save();

            $sourceAfter = $sourceBefore - $amount;
            $lockedSource->balance = $sourceAfter;
            $lockedSource->save();

            return TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'capital_withdrawal',
                'source_type' => get_class($lockedSource),
                'source_id' => $lockedSource->id,
                'destination_type' => Investor::class,
                'destination_id' => $lockedInvestor->id,
                'investor_id' => $lockedInvestor->id,
                'amount' => $amount,
                'currency' => $lockedInvestor->currency,
                'balance_before' => $sourceBefore,
                'balance_after' => $sourceAfter,
                'description' => "سحب رأس مال للمستثمر [{$lockedInvestor->name}]: {$description}",
                'transaction_date' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * Distribute/Add Profit to Investor Fund
     */
    public function investorDistributeProfit(Investor $investor, float $amount, string $description, ?int $userId = null): TreasuryTransaction
    {
        if ($amount <= 0) {
            throw new Exception("مبلغ الأرباح الموزعة يجب أن يكون أكبر من الصفر.");
        }

        return DB::transaction(function () use ($investor, $amount, $description, $userId) {
            $lockedInvestor = Investor::where('id', $investor->id)->lockForUpdate()->first();

            $before = (float) $lockedInvestor->profit_balance;
            $after = $before + $amount;
            $lockedInvestor->profit_balance = $after;
            $lockedInvestor->save();

            return TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'profit_distribution',
                'source_type' => null,
                'source_id' => null,
                'destination_type' => Investor::class,
                'destination_id' => $lockedInvestor->id,
                'investor_id' => $lockedInvestor->id,
                'amount' => $amount,
                'currency' => $lockedInvestor->currency,
                'balance_before' => $before,
                'balance_after' => $after,
                'description' => "إثبات وتوزيع أرباح للمستثمر [{$lockedInvestor->name}]: {$description}",
                'transaction_date' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * Investor Withdraws Profit (Exits company Fund or Bank)
     */
    public function investorWithdrawProfit(Investor $investor, $sourceMoneySource, float $amount, string $description, ?int $userId = null): TreasuryTransaction
    {
        if ($amount <= 0) {
            throw new Exception("مبلغ سحب الأرباح يجب أن يكون أكبر من الصفر.");
        }

        return DB::transaction(function () use ($investor, $sourceMoneySource, $amount, $description, $userId) {
            $lockedInvestor = Investor::where('id', $investor->id)->lockForUpdate()->first();
            $lockedSource = get_class($sourceMoneySource)::where('id', $sourceMoneySource->id)->lockForUpdate()->first();

            $profitBefore = (float) $lockedInvestor->profit_balance;
            if ($profitBefore < $amount) {
                throw new Exception("أرباح المستثمر المتوفرة لا تكفي. رصيد أرباحه الحالي: " . number_format($profitBefore, 2));
            }

            $sourceBefore = (float) $lockedSource->balance;
            if ($sourceBefore < $amount) {
                throw new Exception("رصيد الصندوق أو البنك غير كافٍ لصرف الأرباح.");
            }

            $lockedInvestor->profit_balance = $profitBefore - $amount;
            $lockedInvestor->total_withdrawn_profits = (float) $lockedInvestor->total_withdrawn_profits + $amount;
            $lockedInvestor->save();

            $sourceAfter = $sourceBefore - $amount;
            $lockedSource->balance = $sourceAfter;
            $lockedSource->save();

            return TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'profit_withdrawal',
                'source_type' => get_class($lockedSource),
                'source_id' => $lockedSource->id,
                'destination_type' => Investor::class,
                'destination_id' => $lockedInvestor->id,
                'investor_id' => $lockedInvestor->id,
                'amount' => $amount,
                'currency' => $lockedInvestor->currency,
                'balance_before' => $sourceBefore,
                'balance_after' => $sourceAfter,
                'description' => "سحب أرباح المستثمر [{$lockedInvestor->name}]: {$description}",
                'transaction_date' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * Record Operating Expense
     */
    public function recordExpense(float $amount, $sourceMoneySource, string $category, string $title, ?string $notes = null, ?int $userId = null): Expense
    {
        if ($amount <= 0) {
            throw new Exception("مبلغ المصروف يجب أن يكون أكبر من الصفر.");
        }

        return DB::transaction(function () use ($amount, $sourceMoneySource, $category, $title, $notes, $userId) {
            $lockedSource = get_class($sourceMoneySource)::where('id', $sourceMoneySource->id)->lockForUpdate()->first();

            $before = (float) $lockedSource->balance;
            if ($before < $amount) {
                throw new Exception("الرصيد المتاح في {$lockedSource->name} لا يكفي لتسجيل هذا المصروف.");
            }

            $after = $before - $amount;
            $lockedSource->balance = $after;
            $lockedSource->save();

            $expense = Expense::create([
                'title' => $title,
                'category' => $category,
                'amount' => $amount,
                'currency' => $lockedSource->currency,
                'source_type' => get_class($lockedSource),
                'source_id' => $lockedSource->id,
                'expense_date' => now()->toDateString(),
                'notes' => $notes,
                'created_by' => $userId ?? auth()->id(),
            ]);

            TreasuryTransaction::create([
                'reference_no' => $this->generateReference(),
                'type' => 'expense',
                'source_type' => get_class($lockedSource),
                'source_id' => $lockedSource->id,
                'destination_type' => null,
                'destination_id' => null,
                'amount' => $amount,
                'currency' => $lockedSource->currency,
                'balance_before' => $before,
                'balance_after' => $after,
                'description' => "تسجيل مصروف [{$category}]: {$title}" . ($notes ? " ({$notes})" : ""),
                'transaction_date' => now(),
                'created_by' => $userId ?? auth()->id(),
            ]);

            return $expense;
        });
    }

    /**
     * Create / Purchase Invoice
     */
    public function purchaseInvoice(array $data, ?int $userId = null): Invoice
    {
        return DB::transaction(function () use ($data, $userId) {
            $amountUsd = (float) $data['amount_usd'];
            $exchangeRate = (float) $data['exchange_rate'];
            $taxPercentage = isset($data['tax_percentage']) ? (float) $data['tax_percentage'] : 0.0;
            
            $amountIqd = $amountUsd * $exchangeRate;
            $taxIqd = $amountIqd * ($taxPercentage / 100);
            $totalIqd = $amountIqd + $taxIqd;

            $paidFromType = $data['paid_from_type'] ?? null;
            $paidFromId = $data['paid_from_id'] ?? null;

            // Optional deduction from payment source (if chosen)
            if ($paidFromType && $paidFromId) {
                $sourceModel = $paidFromType === 'bank' ? Bank::find($paidFromId) : Fund::find($paidFromId);
                if ($sourceModel) {
                    $deductAmount = $sourceModel->currency === 'USD' ? $amountUsd : $totalIqd;
                    $this->withdraw(
                        $sourceModel,
                        $deductAmount,
                        "تمويل شراء فاتورة استيرادية رقم [{$data['invoice_number']}] بمبلغ {$amountUsd} $",
                        $userId
                    );
                }
            }

            return Invoice::create([
                'invoice_number' => $data['invoice_number'],
                'amount_usd' => $amountUsd,
                'exchange_rate' => $exchangeRate,
                'amount_iqd' => $amountIqd,
                'tax_percentage' => $taxPercentage,
                'tax_iqd' => $taxIqd,
                'total_iqd' => $totalIqd,
                'status' => 'available',
                'paid_from_type' => $paidFromType,
                'paid_from_id' => $paidFromId,
                'investor_id' => !empty($data['investor_id']) ? $data['investor_id'] : null,
                'purchase_date' => $data['purchase_date'] ?? now()->toDateString(),
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId ?? auth()->id(),
            ]);
        });
    }

    /**
     * Sell Invoice to Investors and Distribute Profits
     */
    public function sellInvoice(Invoice $invoice, array $data, ?int $userId = null): InvoiceSale
    {
        return DB::transaction(function () use ($invoice, $data, $userId) {
            $lockedInvoice = Invoice::where('id', $invoice->id)->lockForUpdate()->first();

            $soldBefore = (float) $lockedInvoice->sales()->sum('total_amount_usd');
            $availableUsd = (float) $lockedInvoice->amount_usd - $soldBefore;

            $items = $data['investors'] ?? $data['customers'] ?? [];
            $totalSaleUsd = 0;
            $totalSaleIqd = 0;

            foreach ($items as $item) {
                $cUsd = (float) $item['amount_usd'];
                $cRate = (float) $item['exchange_rate'];
                $customsPct = isset($item['customs_percentage']) ? (float) $item['customs_percentage'] : 0.0;
                $customsRate = isset($item['customs_exchange_rate']) && (float) $item['customs_exchange_rate'] > 0
                    ? (float) $item['customs_exchange_rate']
                    : $cRate;

                $amountIqd = $cUsd * $cRate;
                $customsAmountUsd = $cUsd * ($customsPct / 100);
                $customsAmountIqd = $customsAmountUsd * $customsRate;
                $totalFinalIqd = $amountIqd + $customsAmountIqd;

                $totalSaleUsd += $cUsd;
                $totalSaleIqd += $totalFinalIqd;
            }

            if ($totalSaleUsd > ($availableUsd + 0.001)) {
                throw new Exception("الكمية المراد بيعها ({$totalSaleUsd} $) تتجاوز الكمية المتاحة في الفاتورة ({$availableUsd} $).");
            }

            // Cost of sold portion based on original purchase exchange rate
            $costIqd = $totalSaleUsd * (float) $lockedInvoice->exchange_rate;
            $profitIqd = $totalSaleIqd - $costIqd;

            $saleNumber = 'SLS-' . date('Ymd') . '-' . strtoupper(Str::random(4));

            $destType = $data['payment_destination_type'] ?? 'fund';
            $destId = $data['payment_destination_id'] ?? 1;

            $sale = InvoiceSale::create([
                'invoice_id' => $lockedInvoice->id,
                'sale_number' => $saleNumber,
                'sale_date' => $data['sale_date'] ?? now()->toDateString(),
                'total_amount_usd' => $totalSaleUsd,
                'total_amount_iqd' => $totalSaleIqd,
                'cost_iqd' => $costIqd,
                'profit_iqd' => $profitIqd,
                'payment_destination_type' => $destType,
                'payment_destination_id' => $destId,
                'created_by' => $userId ?? auth()->id(),
            ]);

            // Save sale items per investor
            foreach ($items as $item) {
                $itemUsd = (float) $item['amount_usd'];
                $itemRate = (float) $item['exchange_rate'];
                $customsPct = isset($item['customs_percentage']) ? (float) $item['customs_percentage'] : 0.0;
                $customsRate = isset($item['customs_exchange_rate']) && (float) $item['customs_exchange_rate'] > 0
                    ? (float) $item['customs_exchange_rate']
                    : $itemRate;

                $amountIqd = $itemUsd * $itemRate;
                $customsAmountUsd = $itemUsd * ($customsPct / 100);
                $amountAfterCustomsUsd = $itemUsd + $customsAmountUsd;
                $customsAmountIqd = $customsAmountUsd * $customsRate;
                $amountAfterCustomsIqd = $amountIqd + $customsAmountIqd;

                $investorId = $item['investor_id'] ?? $item['customer_id'] ?? null;

                InvoiceSaleItem::create([
                    'invoice_sale_id' => $sale->id,
                    'investor_id' => $investorId,
                    'customer_id' => null,
                    'amount_usd' => $itemUsd,
                    'exchange_rate' => $itemRate,
                    'amount_iqd' => $amountIqd,
                    'customs_percentage' => $customsPct,
                    'amount_after_customs_usd' => $amountAfterCustomsUsd,
                    'customs_exchange_rate' => $customsRate,
                    'customs_amount_iqd' => $customsAmountIqd,
                    'amount_after_customs_iqd' => $amountAfterCustomsIqd,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            // Deposit proceeds into destination fund or bank
            $destModel = $destType === 'bank' ? Bank::find($destId) : Fund::find($destId);
            if ($destModel) {
                $this->deposit(
                    $destModel,
                    $totalSaleIqd,
                    "متحصلات بيع فاتورة [{$lockedInvoice->invoice_number}] عملية بيع رقم {$saleNumber}",
                    $userId
                );
            }

            // Update Invoice Status
            $newTotalSoldUsd = $soldBefore + $totalSaleUsd;
            if ($newTotalSoldUsd >= ((float) $lockedInvoice->amount_usd - 0.001)) {
                $lockedInvoice->status = 'sold';
            } else {
                $lockedInvoice->status = 'partial';
            }
            $lockedInvoice->save();

            // Distribute Profits to Investors if profit > 0
            if ($profitIqd > 0) {
                if ($lockedInvoice->investor_id) {
                    // Customized for a specific investor
                    $targetInvestor = Investor::where('id', $lockedInvoice->investor_id)->lockForUpdate()->first();
                    if ($targetInvestor && $targetInvestor->status === 'active') {
                        $rate = (float) $targetInvestor->profit_rate;
                        $investorShare = $rate > 0 ? ($profitIqd * ($rate / 100)) : $profitIqd;

                        $targetInvestor->profit_balance = (float) $targetInvestor->profit_balance + $investorShare;
                        $targetInvestor->save();

                        $tx = TreasuryTransaction::create([
                            'reference_no' => $this->generateReference(),
                            'type' => 'profit_distribution',
                            'source_type' => InvoiceSale::class,
                            'source_id' => $sale->id,
                            'destination_type' => Investor::class,
                            'destination_id' => $targetInvestor->id,
                            'investor_id' => $targetInvestor->id,
                            'amount' => $investorShare,
                            'currency' => $targetInvestor->currency,
                            'balance_before' => (float) $targetInvestor->profit_balance - $investorShare,
                            'balance_after' => (float) $targetInvestor->profit_balance,
                            'description' => "أرباح الفاتورة المخصصة [{$lockedInvoice->invoice_number}] - عملية بيع {$saleNumber}",
                            'transaction_date' => now(),
                            'created_by' => $userId ?? auth()->id(),
                        ]);

                        InvoiceDistribution::create([
                            'invoice_sale_id' => $sale->id,
                            'investor_id' => $targetInvestor->id,
                            'share_percentage' => $rate > 0 ? $rate : 100.0,
                            'profit_amount' => $investorShare,
                            'treasury_transaction_id' => $tx->id,
                        ]);
                    }
                } else {
                    // Scenario 1: Distributed proportionally according to active capital balance
                    $activeInvestors = Investor::where('status', 'active')
                        ->where('capital_balance', '>', 0)
                        ->lockForUpdate()
                        ->get();

                    $totalCapital = (float) $activeInvestors->sum('capital_balance');

                    if ($totalCapital > 0) {
                        foreach ($activeInvestors as $inv) {
                            $cap = (float) $inv->capital_balance;
                            $ratio = $cap / $totalCapital;
                            $sharePct = round($ratio * 100, 2);
                            $invProfit = round($profitIqd * $ratio, 2);

                            if ($invProfit > 0) {
                                $inv->profit_balance = (float) $inv->profit_balance + $invProfit;
                                $inv->save();

                                $tx = TreasuryTransaction::create([
                                    'reference_no' => $this->generateReference(),
                                    'type' => 'profit_distribution',
                                    'source_type' => InvoiceSale::class,
                                    'source_id' => $sale->id,
                                    'destination_type' => Investor::class,
                                    'destination_id' => $inv->id,
                                    'investor_id' => $inv->id,
                                    'amount' => $invProfit,
                                    'currency' => $inv->currency,
                                    'balance_before' => (float) $inv->profit_balance - $invProfit,
                                    'balance_after' => (float) $inv->profit_balance,
                                    'description' => "أرباح بيع فاتورة [{$lockedInvoice->invoice_number}] - حصة ({$sharePct}%) من إجمالي ربح " . number_format($profitIqd) . " د.ع",
                                    'transaction_date' => now(),
                                    'created_by' => $userId ?? auth()->id(),
                                ]);

                                InvoiceDistribution::create([
                                    'invoice_sale_id' => $sale->id,
                                    'investor_id' => $inv->id,
                                    'share_percentage' => $sharePct,
                                    'profit_amount' => $invProfit,
                                    'treasury_transaction_id' => $tx->id,
                                ]);
                            }
                        }
                    }
                }
            }

            return $sale;
        });
    }
}

