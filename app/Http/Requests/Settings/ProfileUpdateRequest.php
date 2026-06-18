<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'game_display_name' => ['nullable', 'string', 'max:50'],
            'avatar_style' => ['nullable', 'string', 'in:pixel-art,pixel-art-neutral,lorelei,lorelei-neutral,bottts,adventurer,adventurer-neutral,fun-emoji'],
            'avatar_seed' => ['nullable', 'string', 'max:64'],
        ];
    }
}
