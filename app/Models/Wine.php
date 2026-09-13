<?php

namespace App\Models;

use App\Enums\WineBody;
use App\Enums\WineType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wine extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'producer', 'vintage', 'type', 'country', 'region', 'ean', 'systembolaget_number', 'alcohol', 'body', 'notes'];

    protected $hidden = ['label_path'];

    protected $appends = ['label_url'];

    protected function casts(): array
    {
        return ['type' => WineType::class, 'body' => WineBody::class, 'vintage' => 'integer', 'alcohol' => 'float'];
    }

    public function getLabelUrlAttribute(): ?string
    {
        return $this->label_path ? route('wines.label', $this) : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function grapes(): BelongsToMany
    {
        return $this->belongsToMany(Grape::class);
    }

    public function bottles(): HasMany
    {
        return $this->hasMany(Bottle::class);
    }
}
