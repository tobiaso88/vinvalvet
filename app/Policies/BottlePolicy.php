<?php

namespace App\Policies;

use App\Models\Bottle;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BottlePolicy
{
    public function before(User $user, string $ability, Bottle $record): ?Response
    {
        return $record->wine->user_id === $user->id ? null : Response::denyAsNotFound();
    }

    public function view(User $user, Bottle $record): bool
    {
        return true;
    }

    public function update(User $user, Bottle $record): bool
    {
        return true;
    }

    public function delete(User $user, Bottle $record): bool
    {
        return true;
    }
}
