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
    const output = execFileSync('php', ['artisan', 'db:seed', '--class=VinvalvetDemoSeeder', '--no-interaction'], { env, encoding: 'utf8' });
    password = output.match(/Tillfälligt lösenord: (.+)/)![1].trim();
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
    await page.getByLabel('Vinets namn *').fill('Mitt testvin');
    await page.getByLabel('Vintyp *').selectOption('white');
    await page.getByLabel('Årgång', { exact: true }).fill('2021');
    await page.getByLabel('Antal flaskor', { exact: true }).fill('2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: 'storage/app/testing/form-' + testInfo.project.name + '.png', fullPage: true });
    await page.getByRole('button', { name: 'Spara vin och flaskor' }).click();
    await expect(page.getByRole('heading', { name: 'Mitt testvin', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Redigera vin' }).click();
    await page.getByLabel('Producent', { exact: true }).fill('Min producent');
    await page.getByRole('button', { name: 'Spara ändringar' }).click();
    await expect(page.getByText('Min producent · 2021')).toBeVisible();
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
