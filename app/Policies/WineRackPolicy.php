<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WineRack;
use Illuminate\Auth\Access\Response;

class WineRackPolicy
{
    public function before(User $user, string $ability, WineRack $record): ?Response
    {
        return $record->user_id === $user->id ? null : Response::denyAsNotFound();
    }

    public function view(User $user, WineRack $record): bool
    {
        return true;
    }

    public function update(User $user, WineRack $record): bool
    {
        return true;
    }

    public function delete(User $user, WineRack $record): bool
    {
        return true;
    }
}
