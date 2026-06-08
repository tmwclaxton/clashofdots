<?php

namespace App\Http\Requests\Games;

use App\Enums\GameStatus;
use App\Games\Services\GuestGameIdentity;
use App\Models\Game;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class RecruitTroopRequest extends FormRequest
{
    public function authorize(): bool
    {
        $game = $this->route('game');

        if (! $game instanceof Game || $game->status !== GameStatus::Playing) {
            return false;
        }

        if ($this->user() !== null) {
            return $game->players()->where('user_id', $this->user()->id)->exists();
        }

        $guestKey = session(GuestGameIdentity::SESSION_KEY);

        return is_string($guestKey)
            && Str::isUuid($guestKey)
            && $game->players()->where('guest_key', $guestKey)->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
