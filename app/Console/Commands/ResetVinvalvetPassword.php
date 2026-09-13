<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ResetVinvalvetPassword extends Command
{
    protected $signature = 'vinvalvet:reset-password';

    protected $description = 'Återställ ett kontos lösenord och avsluta befintliga sessioner';

    public function handle(): int
    {
        $email = $this->ask('E-postadress');
        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error('Kontot finns inte.');

            return self::FAILURE;
        }
        $data = ['password' => $this->secret('Nytt lösenord (minst 12 tecken)'), 'password_confirmation' => $this->secret('Bekräfta lösenord')];
        $validator = Validator::make($data, ['password' => ['required', 'string', 'min:12', 'confirmed']]);
        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }
        DB::transaction(function () use ($user, $data) {
            $user->forceFill(['password' => $data['password'], 'remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
        });
        $this->info('Lösenordet har ändrats. Befintliga sessioner är avslutade.');

        return self::SUCCESS;
    }
}
