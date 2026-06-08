<?php

namespace App\Http\Middleware;

use App\Games\Services\GuestGameIdentity;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureGuestGameIdentity
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        GuestGameIdentity::ensure($request);

        return $next($request);
    }
}
