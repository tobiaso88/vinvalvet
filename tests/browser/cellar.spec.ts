import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';

let password: string;
test.beforeAll(() => {
    const env = { ...process.env, DB_DATABASE: 'winefinder_browser_test', APP_ENV: 'local' };
    execFileSync(
        'php',
        [
            '-r',
            'require "vendor/autoload.php"; $app=require "bootstrap/app.php"; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); $c=config("database.connections.mysql"); $p=new PDO("mysql:host=".$c["host"].";port=".$c["port"], $c["username"], $c["password"]); $p->exec("CREATE DATABASE IF NOT EXISTS winefinder_browser_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");',
        ],
        { env },
    );
    execFileSync('php', ['artisan', 'migrate:fresh', '--force', '--no-interaction'], { env });
    execFileSync('php', ['artisan', 'db:seed', '--class=VinvalvetDemoSeeder', '--no-interaction'], { env, stdio: 'pipe' });
    password = 'native-browser-test-password';
    execFileSync(
        'php',
        [
            '-r',
            'require "vendor/autoload.php"; $app=require "bootstrap/app.php"; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); App\\Models\\User::where("email", "demo@vinvalvet.test")->update(["password" => Illuminate\\Support\\Facades\\Hash::make("native-browser-test-password")]);',
        ],
        { env },
    );
});

test('complete cellar workflow', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/login');
    await expect(page).toHaveTitle('Logga in - Vinvalvet');
    await expect(page.getByRole('img', { name: 'Vinvalvet', exact: true })).toBeVisible();
    await page.getByLabel('E-postadress').fill('demo@vinvalvet.test');
    await page.getByLabel('Lösenord', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Logga in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Din vinkällare', exact: true })).toBeVisible();
    await page.screenshot({ path: 'storage/app/testing/dashboard-' + testInfo.project.name + '.png', fullPage: true });
    await page.goto('/racks');
    await page.getByRole('button', { name: 'Ny vinhylla' }).click();
    await page.getByLabel('Hyllans namn').fill('Testhylla');
    await page.getByLabel('Antal rader (A–Z)').fill('2');
    await page.getByLabel('Antal kolumner', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Skapa hylla', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Testhylla', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'A1 Ledig' }).click();
    await page.getByRole('button', { name: 'Spara placering' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'A1 Barolo' })).toBeVisible();
    await page.getByRole('button', { name: 'A1 Barolo' }).click();
    await page.getByRole('button', { name: /Flytta flaskan/ }).click();
    await page.getByRole('button', { name: 'B2 Ledig' }).click();
    await page.getByRole('button', { name: 'Spara placering' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'B2 Barolo' })).toBeVisible();
    await page.screenshot({ path: 'storage/app/testing/rack-' + testInfo.project.name + '.png', fullPage: true });
    await page.getByRole('button', { name: 'B2 Barolo' }).click();
    await page.getByRole('button', { name: 'Markera konsumerad' }).click();
    await page.getByRole('button', { name: 'Bekräfta', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'B2 Ledig' })).toBeVisible();

    await page.goto('/wines/create');
    await page.getByRole('button', { name: 'Fyll i manuellt' }).click();
    await page.getByLabel('Vinets namn *').fill('Mitt testvin');
    await page.getByLabel('Vintyp *').selectOption('white');
    await page.getByLabel('Årgång', { exact: true }).fill('2021');
    await page.getByRole('button', { name: 'Fortsätt till antal & placering' }).click();
    await page.getByLabel('Antal flaskor', { exact: true }).fill('2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'storage/app/testing/form-' + testInfo.project.name + '.png', fullPage: true });
    await page.getByRole('button', { name: 'Spara vin och flaskor' }).click();
    await expect(page.getByRole('heading', { name: 'Mitt testvin', exact: true, level: 1 })).toBeVisible();
    await page.getByRole('link', { name: 'Redigera vin' }).click();
    await page.getByLabel('Producent', { exact: true }).fill('Min producent');
    await page.getByRole('button', { name: 'Spara ändringar' }).click();
    await page.getByRole('button', { name: testInfo.project.name === 'mobile' ? /Om vinet/ : /Alla vinuppgifter/ }).click();
    await expect(page.getByText('Min producent', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Stäng', exact: true }).click();
    await page.goto('/wines');
    await page.getByLabel('Sök vin').fill('Mitt testvin');
    await page.getByRole('button', { name: 'Sök i samlingen' }).click();
    await page.waitForURL(/q=Mitt/);
    await expect(page.getByRole('heading', { name: 'Mitt testvin' })).toBeVisible();

    await page.goto('/pairing');
    await page.getByLabel('Vad blir det till middag?').fill('Ugnsbakad lax med citron');
    await page.getByRole('button', { name: 'Hitta passande vin' }).click();
    await expect(page.getByRole('alert')).toContainText('AI-funktionen är inte konfigurerad');
    await page.goto('/activity');
    await expect(page.locator('main span').getByText('Konsumerad', { exact: true })).toBeVisible();
    await page.goto('/settings/profile');
    await expect(page.getByLabel('Namn', { exact: true })).toHaveValue('Vinälskare');
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('native pages sheets and dark appearance remain usable', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/login');
    await page.getByLabel('E-postadress').fill('demo@vinvalvet.test');
    await page.getByLabel('Lösenord', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Logga in', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Din vinkällare', exact: true })).toBeVisible();
    for (const [path, name] of [
        ['/wines', 'wines'],
        ['/wines/1', 'wine'],
        ['/racks', 'racks'],
        ['/racks/1', 'rack'],
        ['/racks/unplaced', 'unplaced'],
        ['/settings', 'more'],
        ['/settings/profile', 'profile'],
        ['/settings/password', 'password'],
        ['/settings/appearance', 'appearance'],
        ['/activity', 'activity'],
        ['/pairing', 'pairing'],
    ]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
        await page.screenshot({ path: 'storage/app/testing/native-' + name + '-' + testInfo.project.name + '.png', fullPage: true });
    }
    await page.goto('/wines');
    await page.getByRole('button', { name: /Filter ·/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('combobox', { name: 'Vintyp', exact: true }).selectOption('red');
    await page.getByRole('button', { name: 'Visa viner', exact: true }).click();
    await expect(page).toHaveURL(/type=red/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goto('/wines/1');
    await page
        .getByRole('button', { name: /Om vinet/ })
        .count()
        .then(async (count) => {
            if (count && testInfo.project.name === 'mobile') {
                await page.getByRole('button', { name: /Om vinet/ }).click();
                await expect(page.getByRole('dialog')).toContainText('Nebbiolo');
                await page.getByRole('button', { name: 'Stäng', exact: true }).click();
            }
        });
    await page.getByRole('button', { name: /Marknadsvärde/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Värde per flaska');
    await page.screenshot({ path: 'storage/app/testing/native-valuation-' + testInfo.project.name + '.png', fullPage: true });
    await page.getByRole('button', { name: 'Stäng', exact: true }).click();
    await page.getByRole('button', { name: 'Fyll på med flaskor', exact: true }).click();
    await expect(page.getByLabel('Antal nya flaskor')).toHaveValue('1');
    await page.getByRole('button', { name: 'Stäng', exact: true }).click();
    await page.goto('/settings/appearance');
    await page.getByRole('button', { name: 'Mörkt', exact: true }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.goto('/wines/1');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.screenshot({ path: 'storage/app/testing/native-wine-dark-' + testInfo.project.name + '.png', fullPage: true });
    await page.goto('/settings/profile');
    await page.getByRole('button', { name: 'Radera konto', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Kontot och dess data raderas permanent');
    await expect(page.getByRole('button', { name: 'Radera konto', exact: true }).last()).toBeVisible();
    await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(errors).toEqual([]);
});
