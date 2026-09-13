<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Wine;
use Illuminate\Auth\Access\Response;

class WinePolicy
{
    public function before(User $user, string $ability, Wine $record): ?Response
    {
        return $record->user_id === $user->id ? null : Response::denyAsNotFound();
    }

    public function view(User $user, Wine $record): bool
    {
        return true;
    }

    public function update(User $user, Wine $record): bool
    {
        return true;
    }

    public function delete(User $user, Wine $record): bool
    {
        return true;
    }
}
