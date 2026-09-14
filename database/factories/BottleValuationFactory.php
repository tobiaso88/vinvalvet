<?php

namespace Database\Factories;

use App\Enums\BottleValuationStatus;
use App\Models\Bottle;
use App\Models\BottleValuation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BottleValuation>
 */
class BottleValuationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'bottle_id' => Bottle::factory(),
            'status' => BottleValuationStatus::Completed,
            'estimated_value' => fake()->randomFloat(2, 100, 5000),
            'currency' => 'SEK',
            'basis' => fake()->sentence(),
            'sources' => [['title' => 'Wine merchant', 'url' => 'https://example.com/wine']],
            'warnings' => [],
            'valued_at' => now(),
        ];
    }
}
