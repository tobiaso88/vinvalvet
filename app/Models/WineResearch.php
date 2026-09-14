<?php

namespace App\Models;

use App\Enums\WineResearchStatus;
use Database\Factories\WineResearchFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WineResearch extends Model
{
    /** @use HasFactory<WineResearchFactory> */
    use HasFactory;

    protected $table = 'wine_researches';

    protected $fillable = [
        'status',
        'input_snapshot',
        'suggestions',
        'ratings',
        'sources',
        'warnings',
        'applied_fields',
        'error_message',
        'researched_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => WineResearchStatus::class,
            'input_snapshot' => 'array',
            'suggestions' => 'array',
            'ratings' => 'array',
            'sources' => 'array',
            'warnings' => 'array',
            'applied_fields' => 'array',
            'researched_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function wine(): BelongsTo
    {
        return $this->belongsTo(Wine::class);
    }
}
