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

desc('Build frontend assets');
task('npm:build', function (): void {
    run('cd {{release_path}} && npm ci --no-audit --no-fund && npm run build && rm -rf node_modules');
});

after('deploy:update_code', 'npm:build');
after('deploy:failed', 'deploy:unlock');
