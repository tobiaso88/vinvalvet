<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WineRack extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'rows', 'columns'];

    protected function casts(): array
    {
        return ['rows' => 'integer', 'columns' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bottles(): HasMany
    {
        return $this->hasMany(Bottle::class);
    }
}
