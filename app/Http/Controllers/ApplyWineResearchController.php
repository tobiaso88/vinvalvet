<?php

namespace App\Http\Controllers;

use App\Enums\WineResearchStatus;
use App\Http\Requests\ApplyWineResearchRequest;
use App\Models\Grape;
use App\Models\WineResearch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class ApplyWineResearchController extends Controller
{
    public function __invoke(ApplyWineResearchRequest $request, WineResearch $wineResearch): RedirectResponse
    {
        Gate::authorize('update', $wineResearch->wine);

        $applied = DB::transaction(function () use ($request, $wineResearch): array {
            $research = WineResearch::whereKey($wineResearch->id)->lockForUpdate()->firstOrFail();
            if ($research->status !== WineResearchStatus::Completed) {
                throw ValidationException::withMessages(['research' => 'Researchen måste vara färdig innan uppgifter kan godkännas.']);
            }
            $wine = $research->wine()->with('grapes')->lockForUpdate()->firstOrFail();
            $suggestions = $research->suggestions['fields'] ?? [];
            $appliedFields = [];
            foreach ($request->validated('fields') as $field) {
                $value = $suggestions[$field] ?? null;
                if ($field === 'grapes') {
                    if ($wine->grapes->isNotEmpty() || ! is_array($value) || $value === []) {
                        continue;
                    }
                    $grapeIds = collect($value)->map(fn (string $name) => trim($name))->filter()->unique(fn (string $name) => mb_strtolower($name))
                        ->map(fn (string $name) => Grape::firstOrCreate(['name' => $name])->id)->all();
                    $wine->grapes()->sync($grapeIds);
                    $appliedFields[] = $field;

                    continue;
                }
                if (filled($wine->getAttribute($field)) || $value === null || $value === '') {
                    continue;
                }
                $wine->setAttribute($field, $value);
                $appliedFields[] = $field;
            }
            $wine->save();
            $research->update([
                'applied_fields' => array_values(array_unique([...($research->applied_fields ?? []), ...$appliedFields])),
                'reviewed_at' => now(),
            ]);

            return $appliedFields;
        });

        return back()->with('success', $applied === [] ? 'Inga uppgifter kunde fyllas i eftersom fälten inte längre är tomma.' : 'Valda vinuppgifter har sparats.');
    }
}
