<?php

namespace Database\Seeders;

use App\Enums\WineBody;
use App\Enums\WineType;
use App\Models\Grape;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class WinefinderDemoSeeder extends Seeder
{
    public function run(InventoryService $inventory): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Demodata får bara skapas lokalt eller i testmiljön.');
        }
        if (User::where('email', 'demo@winefinder.test')->exists()) {
            $this->command?->info('Demokontot finns redan. Inga ändringar gjordes.');

            return;
        }
        $password = Str::password(20);
        $user = User::create(['name' => 'Vinälskare', 'email' => 'demo@winefinder.test', 'password' => Hash::make($password)]);
        $rack = $user->racks()->create(['name' => 'Källaren', 'description' => 'Den stora hyllan, till vänster om dörren.', 'rows' => 4, 'columns' => 6]);
        $user->racks()->create(['name' => 'Vinkylen', 'description' => 'Redo att servera.', 'rows' => 3, 'columns' => 4]);
        $wines = [
            ['Barolo', 'Vigna del Bosco', 2019, WineType::Red, 'Italien', 'Piemonte', 'Nebbiolo', WineBody::Full, 14.5, 5],
            ['Chablis', 'Domaine des Collines', 2022, WineType::White, 'Frankrike', 'Bourgogne', 'Chardonnay', WineBody::Light, 12.5, 4],
            ['Rioja Reserva', 'Bodega del Valle', 2018, WineType::Red, 'Spanien', 'Rioja', 'Tempranillo', WineBody::Full, 14, 3],
            ['Brut Réserve', 'Maison du Matin', null, WineType::Sparkling, 'Frankrike', 'Champagne', 'Chardonnay', WineBody::Medium, 12, 2],
            ['Riesling', 'Weingut Morgenlicht', 2023, WineType::White, 'Tyskland', 'Mosel', 'Riesling', WineBody::Light, 11.5, 3],
            ['Rosé de Provence', 'Domaine du Soleil', 2023, WineType::Rose, 'Frankrike', 'Provence', 'Grenache', WineBody::Light, 12.5, 2],
        ];
        $position = 0;
        foreach ($wines as [$name,$producer,$vintage,$type,$country,$region,$grape,$body,$alcohol,$quantity]) {
            $wine = $user->wines()->create(compact('name', 'producer', 'vintage', 'type', 'country', 'region', 'body', 'alcohol') + ['notes' => 'Fiktivt exempelvin för att utforska appen.']);
            $wine->grapes()->attach(Grape::firstOrCreate(['name' => $grape]));
            $positions = [];
            for ($i = 0; $i < $quantity - 1; $i++) {
                $positions[] = ['wine_rack_id' => $rack->id, 'row' => intdiv($position, 6) + 1, 'column' => $position % 6 + 1];
                $position++;
            }
            $inventory->add($wine, $quantity, $positions);
        }
        $this->command?->info('Demokonto: demo@winefinder.test');
        $this->command?->info('Tillfälligt lösenord: '.$password);
    }
}
