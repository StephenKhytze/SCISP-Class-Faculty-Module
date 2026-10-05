<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Runs after auth.jwt: blocks write routes for anyone who isn't an administrator,
     * so hiding a button in the frontend is no longer the only protection.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json([
                'message' => 'Only administrators can perform this action.'
            ], 403);
        }

        return $next($request);
    }
}
