<?php

namespace Database\Factories;

use App\Enums\WineBody;
use App\Enums\WineType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class WineFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory(), 'name' => fake()->words(2, true), 'producer' => fake()->company(), 'vintage' => 2020, 'type' => WineType::Red, 'country' => 'Frankrike', 'ean' => fake()->ean13(), 'systembolaget_number' => (string) fake()->numberBetween(1000, 9999999), 'body' => WineBody::Medium];
    }
}
