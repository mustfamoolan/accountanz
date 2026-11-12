<?php

namespace App\Console\Commands;

use App\Models\PeriodicInventory;
use Illuminate\Console\Command;

class RecalculateInventories extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventories:recalculate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate all periodic inventories so that previous baseline is the previous inventory net_worth (الموجود الكلي السابق).';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting recalculation of all periodic inventories...');

        $inventories = PeriodicInventory::orderBy('inventory_date')->orderBy('id')->get();
        $previousNetWorth = 0.00;
        $count = 0;

        foreach ($inventories as $inv) {
            $totalReceivables = collect($inv->receivables_items ?? [])->sum(fn ($i) => (float) ($i['amount'] ?? 0));
            $totalPayables = collect($inv->payables_items ?? [])->sum(fn ($i) => (float) ($i['amount'] ?? 0));
            $totalCustoms = collect($inv->customs_items ?? [])->sum(fn ($i) => (float) ($i['amount'] ?? 0));
            $totalExpenses = collect($inv->expenses_items ?? [])->sum(fn ($i) => (float) ($i['amount'] ?? 0));

            $availableBalance = (float) $inv->actual_cash + (float) $inv->bank_balance + $totalReceivables;
            $totalLiabilities = $totalPayables + $totalCustoms;
            $currentNetWorth = $availableBalance - $totalLiabilities;
            $profit = $currentNetWorth - $previousNetWorth;

            $inv->update([
                'total_receivables' => $totalReceivables,
                'total_payables' => $totalPayables,
                'total_customs' => $totalCustoms,
                'total_expenses' => $totalExpenses,
                'total_assets' => $availableBalance,
                'total_liabilities' => $totalLiabilities,
                'net_worth' => $currentNetWorth,
                'previous_net_worth' => $previousNetWorth,
                'inventory_profit' => $profit,
            ]);

            $this->line("Updated Inventory #{$inv->id} ({$inv->inventory_date->format('Y-m-d')}): NetWorth={$currentNetWorth}, PrevNetWorth={$previousNetWorth}, Profit={$profit}");

            $previousNetWorth = $currentNetWorth;
            $count++;
        }

        $this->info("Successfully recalculated {$count} inventories!");
        return Command::SUCCESS;
    }
}

