<?php

namespace App\Http\Requests;

use App\Enums\WineBody;
use App\Enums\WineType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WineRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->has('grapes')) {
            $this->merge(['grapes' => []]);
        }
    }

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'], 'producer' => ['nullable', 'string', 'max:255'],
            'vintage' => ['nullable', 'integer', 'between:1800,'.date('Y')], 'type' => ['required', Rule::enum(WineType::class)],
            'country' => ['nullable', 'string', 'max:255'], 'region' => ['nullable', 'string', 'max:255'],
            'ean' => ['nullable', 'string', 'regex:/^(?:\d{8}|\d{13})$/'],
            'systembolaget_number' => ['nullable', 'string', 'max:20', 'regex:/^\d+$/'],
            'alcohol' => ['nullable', 'numeric', 'between:0,30'], 'body' => ['nullable', Rule::enum(WineBody::class)],
            'notes' => ['nullable', 'string', 'max:5000'], 'grapes' => ['present', 'array', 'max:20'],
            'grapes.*' => ['required', 'string', 'max:100', 'distinct:ignore_case'],
            'label' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240', 'dimensions:max_width=12000,max_height=12000'],
            'quantity' => [$this->route('wine') ? 'sometimes' : 'required', 'integer', 'between:0,100'],
            'positions' => ['sometimes', 'array', 'max:100'],
            'positions.*' => ['array:wine_rack_id,row,column'],
            'positions.*.wine_rack_id' => ['required', 'integer', Rule::exists('wine_racks', 'id')->where('user_id', $this->user()->id)],
            'positions.*.row' => ['required', 'integer', 'between:1,26'], 'positions.*.column' => ['required', 'integer', 'between:1,50'],
        ];
    }
}
