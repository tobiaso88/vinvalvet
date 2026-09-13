<?php

namespace Database\Factories;

use App\Enums\BottleEventType;
use App\Models\Bottle;
use Illuminate\Database\Eloquent\Factories\Factory;

class BottleEventFactory extends Factory
{
    public function definition(): array
    {
        return ['bottle_id' => Bottle::factory(), 'user_id' => fn (array $attributes) => Bottle::find($attributes['bottle_id'])->wine->user_id, 'type' => BottleEventType::Created, 'to_location' => 'Oplacerad'];
    }
}
