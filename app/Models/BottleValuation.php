<?php

namespace App\Models;

use App\Enums\BottleValuationStatus;
use Database\Factories\BottleValuationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BottleValuation extends Model
{
    /** @use HasFactory<BottleValuationFactory> */
    use HasFactory;

    protected $fillable = [
        'status',
        'input_snapshot',
        'estimated_value',
        'currency',
        'basis',
        'sources',
        'warnings',
        'error_message',
        'valued_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => BottleValuationStatus::class,
            'input_snapshot' => 'array',
            'estimated_value' => 'float',
            'sources' => 'array',
            'warnings' => 'array',
            'valued_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function bottle(): BelongsTo
    {
        return $this->belongsTo(Bottle::class);
    }
}
