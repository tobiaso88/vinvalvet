<?php

namespace Tests\Feature;

use App\Models\Bottle;
use App\Models\Wine;
use App\Models\WineRack;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class ConcurrentPlacementTest extends TestCase
{
    use DatabaseMigrations;

    public function test_only_one_concurrent_placement_claims_a_slot(): void
    {
        $wine = Wine::factory()->create();
        $rack = WineRack::factory()->for($wine->user)->create();
        $bottles = Bottle::factory()->for($wine)->count(2)->create();
        $script = <<<'PHP'
        require "vendor/autoload.php";
        $app = require "bootstrap/app.php";
        $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
        $bottle = App\Models\Bottle::findOrFail($argv[1]);
        echo "ready\n";
        try {
            app(App\Services\InventoryService::class)->place($bottle, ["wine_rack_id" => (int) $argv[2], "row" => 1, "column" => 1]);
            echo "placed";
        } catch (Illuminate\Validation\ValidationException $exception) {
            echo isset($exception->errors()["position"]) ? "rejected" : "unexpected validation";
        }
        PHP;
        $connection = config('database.connections.mysql');
        $env = [
            'APP_ENV' => 'testing', 'DB_CONNECTION' => 'mysql', 'DB_URL' => false,
            'DB_DATABASE' => $connection['database'], 'DB_HOST' => $connection['host'],
            'DB_PORT' => (string) $connection['port'], 'DB_USERNAME' => $connection['username'],
            'DB_PASSWORD' => (string) $connection['password'],
        ];
        $processes = $bottles->map(fn (Bottle $bottle): Process => new Process(
            [PHP_BINARY, '-r', $script, (string) $bottle->id, (string) $rack->id], base_path(), $env, timeout: 10,
        ));

        DB::beginTransaction();
        app(InventoryService::class)->lockOwner($wine->user_id);
        try {
            foreach ($processes as $process) {
                $process->start();
                $this->assertTrue($process->waitUntil(fn (string $type, string $output): bool => str_contains($output, 'ready')));
            }
            DB::commit();
            foreach ($processes as $process) {
                $this->assertSame(0, $process->wait(), $process->getErrorOutput());
            }

            $outputs = $processes->map(fn (Process $process): string => trim(str_replace('ready', '', $process->getOutput())))->sort()->values()->all();
            $this->assertSame(['placed', 'rejected'], $outputs);
            $this->assertSame(1, $rack->bottles()->count());
            $this->assertSame(1, $wine->bottles()->whereNull('wine_rack_id')->count());
            $this->assertDatabaseCount('bottle_events', 1);
        } finally {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            foreach ($processes as $process) {
                $process->stop();
            }
        }
    }
}
