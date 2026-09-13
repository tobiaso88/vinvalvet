import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: 'tests/browser',
    workers: 1,
    timeout: 45000,
    use: { baseURL: 'http://127.0.0.1:8098', channel: 'chrome', trace: 'retain-on-failure' },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
        { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    ],
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8098 --no-reload',
        url: 'http://127.0.0.1:8098/up',
        env: { DB_DATABASE: 'winefinder_browser_test', APP_ENV: 'local', OPENAI_API_KEY: '' },
        reuseExistingServer: false,
    },
});
