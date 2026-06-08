<?php

namespace App\Games\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class GuestGameIdentity
{
    public const string SESSION_KEY = 'wod_guest_key';

    public static function ensure(Request $request): string
    {
        $key = $request->session()->get(self::SESSION_KEY);

        if (! is_string($key) || ! Str::isUuid($key)) {
            $key = (string) Str::uuid();
            $request->session()->put(self::SESSION_KEY, $key);
        }

        return $key;
    }

    public static function broadcastSegment(string $guestUuidWithDashes): string
    {
        return 'g'.str_replace('-', '', $guestUuidWithDashes);
    }

    public static function guestUuidFromBroadcastSegment(string $segment): ?string
    {
        if (! str_starts_with($segment, 'g')) {
            return null;
        }

        $hex = substr($segment, 1);

        if (strlen($hex) !== 32 || ! ctype_xdigit($hex)) {
            return null;
        }

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12),
        );
    }
}
