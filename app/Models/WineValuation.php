<?php

namespace App\Models;

use App\Enums\WineValuationStatus;
use Database\Factories\WineValuationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WineValuation extends Model
{
    /** @use HasFactory<WineValuationFactory> */
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
            'status' => WineValuationStatus::class,
            'input_snapshot' => 'array',
            'estimated_value' => 'float',
            'sources' => 'array',
            'warnings' => 'array',
            'valued_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function wine(): BelongsTo
    {
        return $this->belongsTo(Wine::class);
    }
}
