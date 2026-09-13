<?php

namespace App\Models;

use App\Enums\BottleEventType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BottleEvent extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return ['type' => BottleEventType::class];
    }

    protected $fillable = ['type', 'from_location', 'to_location'];

    public function bottle(): BelongsTo
    {
        return $this->belongsTo(Bottle::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
