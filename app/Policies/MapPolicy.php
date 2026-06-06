<?php

namespace App\Policies;

use App\Models\Map;
use App\Models\User;

class MapPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Map $map): bool
    {
        return $user->id === $map->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Map $map): bool
    {
        return $user->id === $map->user_id;
    }

    public function delete(User $user, Map $map): bool
    {
        return $user->id === $map->user_id;
    }
}
