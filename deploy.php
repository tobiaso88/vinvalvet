<?php

namespace Deployer;

use Dotenv\Dotenv;
use RuntimeException;

require 'recipe/laravel.php';

if (is_file(__DIR__.'/.env.deploy')) {
    Dotenv::createImmutable(__DIR__, '.env.deploy')->safeLoad();
}

$deploymentValue = static function (string $name): string {
    $value = $_ENV[$name] ?? $_SERVER[$name] ?? getenv($name);

    if (! is_string($value) || $value === '') {
        throw new RuntimeException("Missing required deployment setting: {$name}");
    }

    return $value;
};

set('application', 'vinvalvet');
set('repository', 'https://github.com/tobiaso88/vinvalvet.git');
set('branch', 'main');
set('keep_releases', 5);
set('http_user', 'www-data');

host('production')
    ->setHostname($deploymentValue('DEPLOY_HOST'))
    ->setRemoteUser($deploymentValue('DEPLOY_USER'))
    ->setIdentityFile($deploymentValue('DEPLOY_IDENTITY_FILE'))
    ->setSshArguments(['-o IdentitiesOnly=yes'])
    ->setDeployPath($deploymentValue('DEPLOY_PATH'));

desc('Build frontend assets locally');
task('frontend:build', function (): void {
    $frontendChanges = runLocally(
        'git status --porcelain -- package.json package-lock.json vite.config.js resources/js resources/css',
        cwd: __DIR__,
    );

    if ($frontendChanges !== '') {
        throw new RuntimeException('Commit frontend changes before deploying.');
    }

    runLocally('npm ci --no-audit --no-fund', cwd: __DIR__, timeout: 600);
    runLocally('npm run build', cwd: __DIR__, timeout: 600);
})->once();

desc('Upload frontend assets');
task('frontend:upload', function (): void {
    run('mkdir -p {{release_path}}/public/build');
    upload(__DIR__.'/public/build/', '{{release_path}}/public/build/', [
        'options' => ['--delete'],
        'timeout' => 300,
    ]);
});

before('deploy', 'frontend:build');
after('deploy:update_code', 'frontend:upload');
after('deploy:failed', 'deploy:unlock');
