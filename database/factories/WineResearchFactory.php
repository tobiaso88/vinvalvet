<?php

namespace Database\Factories;

use App\Enums\WineResearchStatus;
use App\Models\Wine;
use App\Models\WineResearch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WineResearch>
 */
class WineResearchFactory extends Factory
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
            'status' => WineResearchStatus::Completed,
            'input_snapshot' => ['name' => 'Barolo', 'vintage' => 2020],
            'suggestions' => ['fields' => [], 'confidence' => [], 'source_urls' => []],
            'ratings' => [],
            'sources' => [],
            'warnings' => [],
            'applied_fields' => [],
            'researched_at' => now(),
        ];
    }
}
