<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WineRackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string', 'max:2000'], 'rows' => ['required', 'integer', 'between:1,26'], 'columns' => ['required', 'integer', 'between:1,50']];
    }
}
