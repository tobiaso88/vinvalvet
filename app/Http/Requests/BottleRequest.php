<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BottleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'wine_id' => [$this->route('bottle') ? 'sometimes' : 'required', 'integer', Rule::exists('wines', 'id')->where('user_id', $this->user()->id)],
            'quantity' => ['sometimes', 'integer', 'between:1,100'],
            'wine_rack_id' => ['nullable', 'integer', Rule::exists('wine_racks', 'id')->where('user_id', $this->user()->id)],
            'row' => ['nullable', 'required_with:wine_rack_id', 'integer', 'between:1,26'],
            'column' => ['nullable', 'required_with:wine_rack_id', 'integer', 'between:1,50'],
        ];
    }
}
