<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PairingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['dish' => ['required', 'string', 'min:3', 'max:2000']];
    }
}
