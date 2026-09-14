<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplyWineResearchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'fields' => ['required', 'array', 'min:1', 'max:9'],
            'fields.*' => ['required', 'string', 'distinct', Rule::in(['producer', 'vintage', 'country', 'region', 'ean', 'systembolaget_number', 'alcohol', 'body', 'grapes'])],
        ];
    }
}
