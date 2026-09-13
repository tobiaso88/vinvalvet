<?php

namespace Database\Factories;

use App\Enums\BottleStatus;
use App\Models\Wine;
use Illuminate\Database\Eloquent\Factories\Factory;

class BottleFactory extends Factory
{
    public function definition(): array
    {
        return ['wine_id' => Wine::factory(), 'status' => BottleStatus::Available];
    }
}
