<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WineScanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['label' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240', 'dimensions:max_width=12000,max_height=12000']];
    }
}
