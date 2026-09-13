<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateWinefinderUser extends Command
{
    protected $signature = 'winefinder:create-user';

    protected $description = 'Skapa ett privat Winefinder-konto med ett dolt lösenord';

    public function handle(): int
    {
        $data = ['name' => $this->ask('Namn'), 'email' => $this->ask('E-postadress'), 'password' => $this->secret('Lösenord (minst 12 tecken)'), 'password_confirmation' => $this->secret('Bekräfta lösenord')];
        $validator = Validator::make($data, ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:255', 'unique:users,email'], 'password' => ['required', 'string', 'min:12', 'confirmed']]);
        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }
        $user = User::create(collect($validator->validated())->except('password_confirmation')->all());
        $this->info('Kontot för '.$user->email.' har skapats.');

        return self::SUCCESS;
    }
}
