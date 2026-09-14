<?php

namespace Database\Factories;

use App\Enums\WineValuationStatus;
use App\Models\Wine;
use App\Models\WineValuation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WineValuation>
 */
class WineValuationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'wine_id' => Wine::factory(),
            'status' => WineValuationStatus::Completed,
            'estimated_value' => fake()->randomFloat(2, 100, 5000),
            'currency' => 'SEK',
            'basis' => fake()->sentence(),
            'sources' => [['title' => 'Wine merchant', 'url' => 'https://example.com/wine']],
            'warnings' => [],
            'valued_at' => now(),
        ];
    }
}
