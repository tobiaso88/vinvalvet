<?php

namespace App\Models;

use App\Enums\BottleStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Bottle extends Model
{
    use HasFactory;

    protected $fillable = ['wine_rack_id', 'row', 'column', 'status', 'purchase_price', 'estimated_value'];

    protected $attributes = ['status' => 'available'];

    protected $appends = ['location'];

    protected function casts(): array
    {
        return [
            'status' => BottleStatus::class,
            'row' => 'integer',
            'column' => 'integer',
            'purchase_price' => 'float',
            'estimated_value' => 'float',
        ];
    }

    public function wine(): BelongsTo
    {
        return $this->belongsTo(Wine::class);
    }

    public function rack(): BelongsTo
    {
        return $this->belongsTo(WineRack::class, 'wine_rack_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(BottleEvent::class);
    }

    public function valuation(): HasOne
    {
        return $this->hasOne(BottleValuation::class);
    }

    public function getLocationAttribute(): string
    {
        return $this->wine_rack_id ? $this->rack->name.' · '.chr(64 + $this->row).$this->column : 'Oplacerad';
    }
}
